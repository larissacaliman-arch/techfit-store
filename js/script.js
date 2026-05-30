let cart = [];
let currentFilter = 'all';
let searchTerm = '';
let currentSlide = 0;
let slideInterval;
let searchTimeout;
let currentSort = 'relevancia';

function formatPrice(value) {
    return 'R$ ' + value.toFixed(2).replace('.', ',');
}

function highlightText(text, term) {
    if (!term) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background:#fff3cd;padding:0 2px;border-radius:2px;font-weight:700">$1</mark>');
}

function getFeatured() {
    return produtos.filter(p => p.id <= 4);
}

function renderFeatured() {
    const grid = document.getElementById('featuredGrid');
    const featured = getFeatured();
    grid.innerHTML = featured.map(p => {
        const cashPrice = p.preco * 0.9;
        const hasDiscount = p.oldPreco !== null;
        const discountPct = hasDiscount ? Math.round((1 - p.preco / p.oldPreco) * 100) : 0;
        const imgSrc = p.imagem ? p.imagem.replace(/\//g, '/') : null;
        return `
        <div class="featured-card" onclick="openQuickView(${p.id})">
            ${imgSrc
                ? `<img class="featured-card-img" src="${imgSrc}" alt="${p.nome}" loading="lazy">`
                : `<div class="featured-card-img" style="display:flex;align-items:center;justify-content:center;background:${p.categoria === 'gtech' ? 'linear-gradient(135deg,#1a1a2e,#2d2d44)' : 'linear-gradient(135deg,#008a55,#00a86b)'};color:#fff;font-size:48px;"><i class="${p.icone}"></i></div>`
            }
            ${hasDiscount ? `<span class="fc-badge">-${discountPct}%</span>` : ''}
            <div class="featured-card-info">
                <div class="fc-category">${p.categoria === 'gtech' ? 'G-Tech' : 'Suplementos'}</div>
                <h4>${p.nome}</h4>
                <div class="fc-price">${formatPrice(cashPrice)} <span style="font-size:12px;font-weight:400;color:var(--gray);display:block;">até 6x de ${formatPrice(p.preco / 6)}</span></div>
                <div class="fc-stock"><i class="fas fa-check-circle"></i> Em estoque</div>
            </div>
        </div>
    `}).join('');
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    let filtered = produtos.filter(p => {
        const matchCategory = currentFilter === 'all' || p.categoria === currentFilter;
        const matchSearch = !searchTerm ||
            p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.categoria.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCategory && matchSearch;
    });

    filtered = sortProducts(filtered);

    const sectionHeader = document.querySelector('.section-header h2');
    if (searchTerm) {
        sectionHeader.textContent = `"${searchTerm}" - ${filtered.length} ${filtered.length === 1 ? 'resultado' : 'resultados'}`;
    } else {
        sectionHeader.textContent = 'Todos os Produtos';
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="no-results" style="grid-column:1/-1;text-align:center;padding:60px 20px;">
            <i class="fas fa-search" style="font-size:48px;color:#dfe6e9;margin-bottom:15px;display:block"></i>
            <p style="color:#636e72;font-size:16px">Nenhum produto encontrado para <strong>"${searchTerm}"</strong></p>
            <button class="btn" style="margin-top:15px;font-size:13px;padding:10px 24px" onclick="clearSearch()">Limpar Busca</button>
        </div>`;
        return;
    }

    grid.innerHTML = filtered.map((p, index) => {
        const cashPrice = p.preco * 0.9;
        const installmentPrice = p.preco;
        const installmentValue = installmentPrice / 6;
        const hasDiscount = p.oldPreco !== null;
        const discountPct = hasDiscount ? Math.round((1 - p.preco / p.oldPreco) * 100) : 0;
        const imgSrc = p.imagem ? p.imagem.replace(/\//g, '/') : null;
        const inStock = p.emEstoque !== false;
        const freteGratis = p.preco >= 199;
        const economia = hasDiscount ? (p.oldPreco - cashPrice) : 0;

        return `
        <div class="product-card" data-categoria="${p.categoria}" style="animation-delay:${index * 0.04}s">
            <div class="product-img ${p.categoria}">
                ${imgSrc
                    ? `<img src="${imgSrc}" alt="${p.nome}" loading="lazy" 
                           onerror="this.style.display='none';this.parentElement.innerHTML='<i class=\\'${p.icone}\\' style=\\'font-size:56px;color:rgba(255,255,255,0.6)\\'>'">`
                    : `<i class="${p.icone}" style="font-size:56px;color:rgba(255,255,255,0.6)"></i>`
                }
                ${hasDiscount ? `<span class="product-tag">-${discountPct}%</span>` : ''}
                ${freteGratis ? `<span class="product-tag new">Frete Grátis</span>` : ''}
                ${inStock ? '' : `<span class="product-tag" style="background:#dc3545">Indisponível</span>`}
                <div class="product-actions">
                    <button onclick="event.stopPropagation();openQuickView(${p.id})" title="Ver detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">${p.categoria === 'gtech' ? 'G-Tech' : 'Suplementos'}</div>
                <div class="product-name">${highlightText(p.nome, searchTerm)}</div>
                <div class="product-rating">
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star-half-alt"></i>
                    <span>(4.8)</span>
                </div>
                <div class="product-description">${highlightText(p.descricao, searchTerm)}</div>
                <div class="product-stock">${inStock ? '<i class="fas fa-check-circle"></i> Em estoque' : '<i class="fas fa-clock"></i> Indisponível'}</div>
                <div class="product-price">
                    <div class="price-row">
                        ${hasDiscount ? `<span class="old-price">De: ${formatPrice(p.oldPreco)}</span>` : ''}
                        <div class="price-cash">${formatPrice(cashPrice)} <small>à vista no PIX</small></div>
                    </div>
                    <div class="price-installment">ou <strong>${formatPrice(installmentPrice)}</strong> em até <strong>6x</strong> de <strong>${formatPrice(installmentValue)}</strong></div>
                    ${economia > 0 ? `<div class="price-save">Economia de <strong>${formatPrice(economia)}</strong></div>` : ''}
                </div>
                <button class="add-to-cart" onclick="addToCart(${p.id})" ${inStock ? '' : 'disabled'}>
                    <i class="fas fa-shopping-cart"></i> ${inStock ? 'COMPRAR' : 'INDISPONÍVEL'}
                </button>
                <div class="product-guarantee">
                    <i class="fas fa-shield-alt"></i> Produto original com garantia
                </div>
            </div>
        </div>
    `}).join('');
}

function sortProducts(list) {
    const sorted = [...list];
    switch (currentSort) {
        case 'menor-preco':
            sorted.sort((a, b) => a.preco - b.preco);
            break;
        case 'maior-preco':
            sorted.sort((a, b) => b.preco - a.preco);
            break;
        case 'a-z':
            sorted.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
            break;
        default:
            sorted.sort((a, b) => a.id - b.id);
    }
    return sorted;
}

function setSort(sort) {
    currentSort = sort;
    document.querySelectorAll('.sort-option').forEach(el => {
        el.classList.toggle('active', el.dataset.sort === sort);
    });
    document.getElementById('sortDropdown').classList.remove('active');
    document.getElementById('sortBtn').classList.remove('active');
    renderProducts();
}

function renderSuggestions() {
    const container = document.getElementById('searchSuggestions');
    const value = document.getElementById('searchInput').value.trim().toLowerCase();

    if (!value || value.length < 2) {
        container.classList.remove('active');
        return;
    }

    const matches = produtos.filter(p =>
        p.nome.toLowerCase().includes(value) ||
        p.descricao.toLowerCase().includes(value)
    ).slice(0, 6);

    if (matches.length === 0) {
        container.innerHTML = `
            <div style="padding:16px;text-align:center;color:var(--gray);font-size:13px;">
                <i class="fas fa-search" style="display:block;font-size:20px;margin-bottom:6px;color:var(--light-gray);"></i>
                Nenhum produto encontrado
            </div>
        `;
        container.classList.add('active');
        return;
    }

    container.innerHTML = matches.map(p => {
        const iconBg = p.categoria === 'gtech' ? 'linear-gradient(135deg,#1a1a2e,#2d2d44)' : 'linear-gradient(135deg,#008a55,#00a86b)';
        return `
        <div class="search-suggestion-item" data-id="${p.id}" onclick="selectSuggestion(${p.id})">
            ${p.imagem
                ? `<img src="${p.imagem}" alt="${p.nome}" loading="lazy">`
                : `<div class="sug-icon" style="background:${iconBg}"><i class="${p.icone}"></i></div>`
            }
            <div class="sug-info">
                <div class="sug-name">${highlightText(p.nome, value)}</div>
                <div class="sug-price">${formatPrice(p.preco * 0.9)} à vista</div>
            </div>
            <div class="sug-category">${p.categoria === 'gtech' ? 'G-Tech' : 'Suplementos'}</div>
        </div>
    `}).join('');
    container.classList.add('active');
}

function selectSuggestion(id) {
    document.getElementById('searchSuggestions').classList.remove('active');
    const p = produtos.find(prod => prod.id === id);
    if (!p) return;
    document.getElementById('searchInput').value = p.nome;
    searchTerm = p.nome;
    updateSearchClearBtn();
    renderProducts();
    document.getElementById('produtos').scrollIntoView({ behavior: 'smooth' });
}

function openQuickView(id) {
    const p = produtos.find(prod => prod.id === id);
    if (!p) return;
    const cashPrice = p.preco * 0.9;
    const installmentValue = p.preco / 6;
    const hasDiscount = p.oldPreco !== null;
    const imgSrc = p.imagem ? p.imagem.replace(/\//g, '/') : null;

    document.getElementById('modalImg').src = imgSrc || '';
    document.getElementById('modalImg').style.display = imgSrc ? 'block' : 'none';
    document.getElementById('modalInfo').innerHTML = `
        <div class="modal-category">${p.categoria === 'gtech' ? 'G-Tech' : 'Suplementos'}</div>
        <h2>${p.nome}</h2>
        <div class="modal-desc">${p.descricao}</div>
        <div class="modal-price-box">
            ${hasDiscount ? `<div class="modal-old-price">De: ${formatPrice(p.oldPreco)}</div>` : ''}
            <div class="modal-cash-price">${formatPrice(cashPrice)} <small>à vista no PIX / Boleto</small></div>
            <div class="modal-installment">ou <strong>${formatPrice(p.preco)}</strong> em até <strong>6x</strong> de <strong>${formatPrice(installmentValue)}</strong></div>
        </div>
        <div class="modal-qty">
            <label>Quantidade:</label>
            <div class="modal-qty-controls">
                <button onclick="modalQty(-1)">-</button>
                <span id="modalQty">1</span>
                <button onclick="modalQty(1)">+</button>
            </div>
        </div>
        <button class="modal-btn" onclick="addToCart(${p.id});closeModal();">
            <i class="fab fa-whatsapp"></i> Adicionar ao Carrinho
        </button>
    `;
    window._modalProductId = p.id;
    window._modalQty = 1;
    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function modalQty(delta) {
    const el = document.getElementById('modalQty');
    window._modalQty = Math.max(1, (window._modalQty || 1) + delta);
    el.textContent = window._modalQty;
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function addToCart(id) {
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;
    const qty = window._modalQty || 1;
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ ...produto, qty });
    }
    window._modalQty = 1;
    updateCartUI();
    const cartBtn = document.getElementById('cartBtn');
    cartBtn.classList.remove('cart-bounce');
    void cartBtn.offsetWidth;
    cartBtn.classList.add('cart-bounce');
    showToast(`${produto.nome} adicionado ao carrinho!`);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(id);
    } else {
        updateCartUI();
    }
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cartCount').textContent = count;
    document.getElementById('cartSidebarCount').textContent = count > 0 ? `(${count} ${count === 1 ? 'item' : 'itens'})` : '';
    const sidebar = document.getElementById('cartItems');
    const footer = document.getElementById('cartFooter');
    if (cart.length === 0) {
        sidebar.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-bag"></i>
                <p>Seu carrinho está vazio</p>
                <span style="font-size:13px;color:#adb5bd;display:block;margin-top:6px;">Adicione produtos para começar</span>
                <button class="btn" style="margin-top:16px;font-size:13px;padding:10px 24px" onclick="closeCart();document.getElementById('produtos').scrollIntoView({behavior:'smooth'})">
                    <i class="fas fa-plus"></i> Escolher Produtos
                </button>
            </div>
        `;
        footer.style.display = 'none';
        return;
    }
    footer.style.display = 'block';
    sidebar.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-img" style="background:${item.categoria === 'gtech' ? 'linear-gradient(135deg,#1a1a2e,#2d2d44)' : 'linear-gradient(135deg,#008a55,#00a86b)'};font-size:20px;">
                ${item.imagem ? `<img src="${item.imagem}" alt="${item.nome}">` : `<i class="${item.icone}"></i>`}
            </div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.nome}</div>
                <div class="cart-item-price">${formatPrice(item.preco)}</div>
                <div class="cart-item-qty">
                    <button onclick="changeQty(${item.id}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button onclick="changeQty(${item.id}, 1)">+</button>
                </div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})"><i class="fas fa-times"></i></button>
        </div>
    `).join('');
    const total = cart.reduce((sum, item) => sum + item.preco * item.qty, 0);
    document.getElementById('cartTotal').textContent = formatPrice(total);
}

function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('active');
    document.getElementById('cartOverlay').classList.toggle('active');
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function sendWhatsApp() {
    if (cart.length === 0) { showToast('Carrinho vazio! Adicione produtos antes de finalizar.'); return; }
    const total = cart.reduce((sum, item) => sum + item.preco * item.qty, 0);
    let msg = 'Olá! Gostaria de fazer um pedido:\n\n';
    cart.forEach(item => { msg += `- ${item.nome} x${item.qty} = ${formatPrice(item.preco * item.qty)}\n`; });
    msg += `\n*Total: ${formatPrice(total)}*\n\n*TechFit Store*`;
    window.open(`https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(msg)}`, '_blank');
}

function clearCart() {
    if (cart.length === 0) return;
    cart = []; updateCartUI(); closeCart(); showToast('Carrinho limpo!');
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn, .nav-menu a, .category-card').forEach(el => {
        if (el.dataset.filter === filter) el.classList.add('active');
        else el.classList.remove('active');
    });
    renderProducts();
}

function doSearch() {
    searchTerm = document.getElementById('searchInput').value.trim();
    renderProducts();
    document.getElementById('produtos').scrollIntoView({ behavior: 'smooth' });
    updateSearchClearBtn();
}

function clearSearch() {
    searchTerm = '';
    document.getElementById('searchInput').value = '';
    renderProducts();
    updateSearchClearBtn();
    document.getElementById('searchSuggestions').classList.remove('active');
    document.getElementById('searchInput').focus();
}

function updateSearchClearBtn() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');
    clearBtn.classList.toggle('visible', input.value.trim().length > 0);
}

function goToSlide(index) {
    const slides = document.getElementById('heroSlides');
    const dots = document.querySelectorAll('.hero-dot');
    const slidesAll = document.querySelectorAll('.hero-slide');
    const total = slidesAll.length;
    currentSlide = Math.max(0, Math.min(index, total - 1));
    slides.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
    slidesAll.forEach((s, i) => s.classList.toggle('active', i === currentSlide));
}

function nextSlide() { goToSlide((currentSlide + 1) % document.querySelectorAll('.hero-slide').length); }
function prevSlide() { const t = document.querySelectorAll('.hero-slide').length; goToSlide((currentSlide - 1 + t) % t); }

document.addEventListener('DOMContentLoaded', () => {
    renderFeatured();
    renderProducts();
    updateCartUI();
    document.getElementById('cartFooter').style.display = 'none';

    const totalSlides = document.querySelectorAll('.hero-slide').length;
    const dotsContainer = document.getElementById('heroDots');
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('button');
        dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }
    slideInterval = setInterval(nextSlide, 5000);
    document.getElementById('heroPrev').addEventListener('click', () => { prevSlide(); clearInterval(slideInterval); slideInterval = setInterval(nextSlide, 5000); });
    document.getElementById('heroNext').addEventListener('click', () => { nextSlide(); clearInterval(slideInterval); slideInterval = setInterval(nextSlide, 5000); });

    document.getElementById('cartBtn').addEventListener('click', (e) => { e.preventDefault(); toggleCart(); });
    document.getElementById('cartClose').addEventListener('click', closeCart);
    document.getElementById('cartOverlay').addEventListener('click', closeCart);

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    document.querySelectorAll('.nav-menu a, .category-card').forEach(el => {
        el.addEventListener('click', (e) => {
            const filter = el.dataset.filter;
            if (!filter) return;
            e.preventDefault();
            setFilter(filter);
            document.getElementById('produtos').scrollIntoView({ behavior: 'smooth' });
            if (window.innerWidth <= 768) document.getElementById('navMenu').classList.remove('active');
        });
    });

    document.getElementById('navToggle').addEventListener('click', () => {
        document.getElementById('navMenu').classList.toggle('active');
    });

    document.getElementById('searchBtn').addEventListener('click', doSearch);

    document.getElementById('searchInput').addEventListener('input', () => {
        updateSearchClearBtn();
        renderSuggestions();
    });

    document.getElementById('searchInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('searchSuggestions').classList.remove('active');
            doSearch();
        }
        if (e.key === 'Escape') {
            document.getElementById('searchSuggestions').classList.remove('active');
        }
    });

    document.getElementById('searchInput').addEventListener('blur', () => {
        setTimeout(() => document.getElementById('searchSuggestions').classList.remove('active'), 250);
    });

    document.getElementById('searchInput').addEventListener('focus', () => {
        if (document.getElementById('searchInput').value.trim()) {
            renderSuggestions();
        }
    });

    document.getElementById('searchClear').addEventListener('click', clearSearch);

    document.getElementById('sortBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('sortDropdown').classList.toggle('active');
        document.getElementById('sortBtn').classList.toggle('active');
    });

    document.querySelectorAll('.sort-option').forEach(el => {
        el.addEventListener('click', () => setSort(el.dataset.sort));
    });

    document.addEventListener('click', () => {
        document.getElementById('sortDropdown').classList.remove('active');
        document.getElementById('sortBtn').classList.remove('active');
    });

    document.getElementById('whatsappBtn').addEventListener('click', sendWhatsApp);
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeCart(); closeModal(); document.getElementById('searchSuggestions').classList.remove('active'); }
    });

    window.addEventListener('scroll', () => {
        const btn = document.getElementById('scrollTop');
        btn.classList.toggle('visible', window.scrollY > 500);
        const headerMain = document.querySelector('.header-main');
        if (headerMain) {
            headerMain.classList.toggle('scrolled', window.scrollY > 100);
        }
    });

    document.getElementById('scrollTop').addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Scroll reveal
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
});
