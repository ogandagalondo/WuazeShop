// WuazeShop - Dedicated Category Catalog Logic
const CART_STORAGE_KEY = 'wuazeshop_cart';

let currentCategorySlug = '';
let currentCategoryData = null;
let allProducts = [];
let filteredProducts = [];
let cart = loadCartFromStorage();
let currentPendingOrder = null;

// DOM Elements
const loadingEl = document.getElementById('category-loading');
const errorEl = document.getElementById('category-error');
const emptyEl = document.getElementById('category-empty');
const productsGrid = document.getElementById('category-products-grid');

const heroTitle = document.getElementById('category-hero-title');
const heroDesc = document.getElementById('category-hero-description');
const heroCount = document.getElementById('category-hero-count');
const heroIcon = document.getElementById('category-hero-icon');
const heroImg = document.getElementById('category-hero-img');
const heroImgFallback = document.getElementById('category-hero-img-fallback');
const breadcrumbCurrent = document.getElementById('breadcrumb-category-current');
const pageTitle = document.getElementById('category-page-title');

const searchFilterInput = document.getElementById('category-search-filter');
const sortSelect = document.getElementById('category-sort-select');
const quickListContainer = document.getElementById('categories-quick-list');
const globalSearchInput = document.getElementById('global-search-input');

// Cart & Drawer DOM Elements
const cartToggleBtn = document.getElementById('cart-toggle-btn');
const mobileCartBtn = document.getElementById('mobile-cart-btn');
const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartBadgeCount = document.getElementById('cart-badge-count');
const cartBadgeTotal = document.getElementById('cart-badge-total');
const mobileCartBadge = document.getElementById('mobile-cart-badge');
const cartSubtotalDisplay = document.getElementById('cart-subtotal-display');

// Checkout & Simulator Elements
const openCheckoutModalBtn = document.getElementById('open-checkout-modal-btn');
const checkoutModalOverlay = document.getElementById('checkout-modal-overlay');
const closeCheckoutBtn = document.getElementById('close-checkout-btn');
const checkoutForm = document.getElementById('checkout-form');
const checkoutTotalDisplay = document.getElementById('checkout-total-display');

const simulatorModalOverlay = document.getElementById('simulator-modal-overlay');
const simOrderNumber = document.getElementById('sim-order-number');
const simAmount = document.getElementById('sim-amount');
const simConfirmBtn = document.getElementById('sim-confirm-btn');
const simCloseBtn = document.getElementById('sim-close-btn');

// Hamburger Menu Elements
const hamburgerBtn = document.getElementById('hamburger-menu-btn');
const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
const closeMobileNavBtn = document.getElementById('close-mobile-nav-btn');

// 1. Helpers
function formatFCFA(amount) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

function calculateDiscountPercent(price, originalPrice) {
  if (!originalPrice || originalPrice <= price) return null;
  const percent = Math.round(((originalPrice - price) / originalPrice) * 100);
  return `-${percent}%`;
}

function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCartToStorage() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {}
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 2. Resolve Category Slug from URL
function getCategorySlugFromUrl() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts.length >= 2 && (pathParts[0] === 'category' || pathParts[0] === 'categories')) {
    return pathParts[1].toLowerCase();
  }
  const urlParams = new URLSearchParams(window.location.search);
  return (urlParams.get('category') || urlParams.get('slug') || 'smartphones').toLowerCase();
}

// 3. Load Category & Products
async function loadCategoryPage() {
  currentCategorySlug = getCategorySlugFromUrl();

  try {
    const [catRes, allCatsRes] = await Promise.all([
      fetch(`/api/categories/${currentCategorySlug}`),
      fetch('/api/categories')
    ]);

    if (!catRes.ok) {
      showError();
      return;
    }

    currentCategoryData = await catRes.json();
    allProducts = currentCategoryData.products || [];
    filteredProducts = [...allProducts];

    renderCategoryHeader(currentCategoryData);

    if (allCatsRes.ok) {
      const allCats = await allCatsRes.json();
      renderQuickPills(allCats, currentCategorySlug);
    }

    applyFilterAndSort();
  } catch (err) {
    console.error('Erreur chargement catégorie:', err);
    showError();
  }
}

function renderCategoryHeader(category) {
  if (loadingEl) loadingEl.classList.add('hidden');
  if (errorEl) errorEl.classList.add('hidden');

  const title = category.name || category.slug;
  if (pageTitle) pageTitle.textContent = `${title} | WuazeShop Gabon`;
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = title;
  if (heroTitle) heroTitle.textContent = title;
  if (heroDesc && category.description) heroDesc.textContent = category.description;
  if (heroIcon) heroIcon.textContent = category.icon || 'category';

  const count = category.productCount || (category.products ? category.products.length : 0);
  if (heroCount) heroCount.textContent = `${count} ${count > 1 ? 'articles disponibles' : 'article disponible'}`;

  if (category.banner_url) {
    if (heroImg) {
      heroImg.src = category.banner_url;
      heroImg.classList.remove('hidden');
    }
    if (heroImgFallback) heroImgFallback.classList.add('hidden');
  } else {
    if (heroImg) heroImg.classList.add('hidden');
    if (heroImgFallback) heroImgFallback.classList.remove('hidden');
  }
}

function renderQuickPills(categories, activeSlug) {
  if (!quickListContainer || !Array.isArray(categories)) return;

  const html = categories.map(cat => {
    const isActive = cat.slug === activeSlug;
    const activeClass = isActive ? 'active' : '';
    return `
      <a href="/category/${escapeHtml(cat.slug)}" class="cat-quick-pill ${activeClass} px-4 py-2 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:border-[#0d7252] hover:text-[#0d7252] transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs">
        <span class="material-symbols-outlined text-base">${escapeHtml(cat.icon || 'category')}</span>
        <span>${escapeHtml(cat.name)}</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'} font-semibold">${cat.productCount || 0}</span>
      </a>
    `;
  }).join('');

  quickListContainer.innerHTML = html;
}

function showError() {
  if (loadingEl) loadingEl.classList.add('hidden');
  if (productsGrid) productsGrid.classList.add('hidden');
  if (errorEl) errorEl.classList.remove('hidden');
}

// 4. Products Rendering & Filtering
function applyFilterAndSort() {
  const query = (searchFilterInput ? searchFilterInput.value : '').toLowerCase().trim();
  const sortMode = sortSelect ? sortSelect.value : 'featured';

  filteredProducts = allProducts.filter(p => {
    if (!query) return true;
    const titleMatch = (p.title || '').toLowerCase().includes(query);
    const descMatch = (p.description || '').toLowerCase().includes(query);
    return titleMatch || descMatch;
  });

  if (sortMode === 'price-asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortMode === 'price-desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortMode === 'title-asc') {
    filteredProducts.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }

  renderProducts(filteredProducts);
}

function renderProducts(products) {
  if (!productsGrid) return;

  if (!products || products.length === 0) {
    productsGrid.innerHTML = '';
    productsGrid.classList.add('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  if (emptyEl) emptyEl.classList.add('hidden');
  productsGrid.classList.remove('hidden');

  productsGrid.innerHTML = products.map(product => {
    const discount = calculateDiscountPercent(product.price, product.original_price);
    const specsList = Array.isArray(product.specs) ? product.specs.slice(0, 2) : [];

    return `
      <div class="product-card-hover group bg-white rounded-3xl p-3.5 sm:p-5 border border-gray-100 shadow-sm flex flex-col justify-between transition-all relative">
        
        <!-- Top Badges -->
        <div class="flex items-center justify-between gap-1 mb-2.5">
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase bg-[#e6f7f0] text-[#0d7252] border border-emerald-200/60">
            <span class="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
            <span>Neuf Chine</span>
          </span>

          ${discount ? `
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-50 text-red-600 border border-red-200">
              ${discount}
            </span>
          ` : ''}
        </div>

        <!-- Product Image (Click goes to product page) -->
        <a href="/product/${escapeHtml(product.slug)}" class="block w-full aspect-square rounded-2xl bg-gray-50 overflow-hidden relative mb-3 cursor-pointer">
          <img 
            src="${escapeHtml(product.image_url)}" 
            alt="${escapeHtml(product.title)}" 
            loading="lazy"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </a>

        <!-- Product Information -->
        <div class="flex-1 flex flex-col justify-between space-y-2">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">${escapeHtml(product.category)}</span>
            <a href="/product/${escapeHtml(product.slug)}" class="block hover:text-[#0d7252] transition-colors">
              <h3 class="font-extrabold text-xs sm:text-sm text-gray-900 line-clamp-2 leading-snug">
                ${escapeHtml(product.title)}
              </h3>
            </a>
          </div>

          <!-- Specs preview tags -->
          ${specsList.length > 0 ? `
            <div class="flex flex-wrap gap-1">
              ${specsList.map(s => `
                <span class="px-2 py-0.5 rounded-md bg-gray-50 text-[10px] font-medium text-gray-600 border border-gray-100">
                  ${escapeHtml(s)}
                </span>
              `).join('')}
            </div>
          ` : ''}

          <!-- Price & Actions -->
          <div class="pt-2 border-t border-gray-50 space-y-2">
            <div>
              <div class="text-sm sm:text-base font-black text-[#0d7252] leading-tight">
                ${formatFCFA(product.price)}
              </div>
              ${product.original_price && product.original_price > product.price ? `
                <div class="text-[11px] text-gray-400 line-through">
                  ${formatFCFA(product.original_price)}
                </div>
              ` : ''}
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2 pt-1">
              <button 
                type="button" 
                onclick="window.quickAddToCart && window.quickAddToCart(${product.id})"
                class="flex-1 py-2 sm:py-2.5 px-3 rounded-xl bg-[#0d7252] hover:bg-[#08553d] active:scale-95 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span class="material-symbols-outlined text-base">shopping_cart</span>
                <span>Ajouter</span>
              </button>

              <a 
                href="/product/${escapeHtml(product.slug)}" 
                class="p-2 sm:p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors"
                title="Voir le produit et ses options"
              >
                <span class="material-symbols-outlined text-base">visibility</span>
              </a>
            </div>

          </div>
        </div>

      </div>
    `;
  }).join('');
}

// Global quick add to cart
window.quickAddToCart = function(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const defaultColor = (product.colors && product.colors[0]) || 'Standard';
  const productToAdd = {
    ...product,
    selectedColor: defaultColor
  };

  const existingIndex = cart.findIndex(item => 
    item.product.id === productToAdd.id && 
    item.product.selectedColor === productToAdd.selectedColor
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity += 1;
  } else {
    cart.push({ product: productToAdd, quantity: 1 });
  }

  saveCartToStorage();
  updateCartUi();
  openCartDrawer();
};

// 5. Cart Drawer Management
function updateCartUi() {
  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  if (cartBadgeCount) cartBadgeCount.textContent = totalCount;
  if (mobileCartBadge) mobileCartBadge.textContent = totalCount;
  if (cartBadgeTotal) cartBadgeTotal.textContent = formatFCFA(totalPrice);
  if (cartSubtotalDisplay) cartSubtotalDisplay.textContent = formatFCFA(totalPrice);
  if (checkoutTotalDisplay) checkoutTotalDisplay.textContent = formatFCFA(totalPrice);

  renderCartItems();
}

function renderCartItems() {
  if (!cartItemsContainer) return;

  const cartFooterContainer = document.getElementById('cart-footer-container');
  const cartSubtotalRow = document.getElementById('cart-subtotal-row');
  const openCheckoutModalBtn = document.getElementById('open-checkout-modal-btn');

  if (cart.length === 0) {
    if (cartFooterContainer) cartFooterContainer.classList.add('hidden');

    cartItemsContainer.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
        <div class="w-20 h-20 rounded-full bg-emerald-50 text-[#0d7252] flex items-center justify-center mb-4 shadow-inner">
          <span class="material-symbols-outlined text-4xl">remove_shopping_cart</span>
        </div>
        <h4 class="text-base sm:text-lg font-extrabold text-gray-900 mb-2">Votre panier est vide</h4>
        <p class="text-xs sm:text-sm text-gray-500 max-w-xs leading-relaxed mb-6">
          Découvrez nos produits high-tech et trouvez les appareils parfaits direct usine au meilleur prix.
        </p>
        <a href="/categories" class="continue-shopping-action inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-[#0d7252] hover:bg-[#08553d] active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer">
          <span class="material-symbols-outlined text-base">grid_view</span>
          <span>Continuer mes achats</span>
        </a>
      </div>
    `;
    return;
  }

  if (cartFooterContainer) cartFooterContainer.classList.remove('hidden');
  if (cartSubtotalRow) cartSubtotalRow.classList.remove('hidden');
  if (openCheckoutModalBtn) openCheckoutModalBtn.classList.remove('hidden');

  cartItemsContainer.innerHTML = cart.map((item, index) => `
    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
      <img src="${escapeHtml(item.product.image_url)}" alt="${escapeHtml(item.product.title)}" class="w-14 h-14 object-cover rounded-xl bg-white border border-gray-200 shrink-0"/>
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-bold text-gray-900 truncate">${escapeHtml(item.product.title)}</h4>
        <p class="text-[10px] text-gray-500">${escapeHtml(item.product.selectedColor || 'Standard')}</p>
        <p class="text-xs font-black text-[#0d7252] mt-0.5">${formatFCFA(item.product.price * item.quantity)}</p>
      </div>
      <div class="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
        <button type="button" onclick="window.updateQuantity(${index}, -1)" class="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 text-xs font-bold cursor-pointer">-</button>
        <span class="text-xs font-bold px-1.5">${item.quantity}</span>
        <button type="button" onclick="window.updateQuantity(${index}, 1)" class="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 text-xs font-bold cursor-pointer">+</button>
      </div>
      <button type="button" onclick="window.removeCartItem(${index})" class="text-gray-400 hover:text-red-500 p-1 transition-colors cursor-pointer" title="Supprimer">
        <span class="material-symbols-outlined text-base">delete</span>
      </button>
    </div>
  `).join('');
}

window.updateQuantity = function(index, delta) {
  if (cart[index]) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    saveCartToStorage();
    updateCartUi();
  }
};

window.removeCartItem = function(index) {
  cart.splice(index, 1);
  saveCartToStorage();
  updateCartUi();
};

function openCartDrawer() {
  if (!cartDrawerOverlay) return;
  cartDrawerOverlay.classList.remove('hidden');
  setTimeout(() => {
    const drawer = cartDrawerOverlay.querySelector('.drawer');
    if (drawer) drawer.classList.remove('drawer-closed');
  }, 10);
}

function closeCartDrawer() {
  if (!cartDrawerOverlay) return;
  const drawer = cartDrawerOverlay.querySelector('.drawer');
  if (drawer) drawer.classList.add('drawer-closed');
  setTimeout(() => {
    cartDrawerOverlay.classList.add('hidden');
  }, 300);
}

// 6. Checkout & Mobile Money Simulator
function openCheckoutModal() {
  if (cart.length === 0) {
    alert('Votre panier est vide.');
    return;
  }
  closeCartDrawer();
  if (checkoutModalOverlay) checkoutModalOverlay.classList.remove('hidden');
}

function closeCheckoutModal() {
  if (checkoutModalOverlay) checkoutModalOverlay.classList.add('hidden');
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('checkout-name').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();
  const neighborhood = document.getElementById('checkout-neighborhood').value.trim();
  const paymentMethodInput = document.querySelector('input[name="paymentMethod"]:checked');
  const paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'AIRTEL_MONEY';

  const orderData = {
    customer_name: name,
    customer_phone: phone,
    delivery_neighborhood: neighborhood,
    payment_method: paymentMethod,
    items: cart.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity,
      selected_color: item.product.selectedColor || null
    }))
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de la commande');
    }

    const createdOrder = await res.json();
    currentPendingOrder = createdOrder;

    cart = [];
    saveCartToStorage();
    updateCartUi();
    closeCheckoutModal();

    openSimulatorModal(createdOrder);
  } catch (error) {
    alert(error.message);
  }
}

function openSimulatorModal(order) {
  if (!simulatorModalOverlay) return;
  if (simOrderNumber) simOrderNumber.textContent = order.order_number;
  if (simAmount) simAmount.textContent = formatFCFA(order.total_amount);
  simulatorModalOverlay.classList.remove('hidden');
}

function closeSimulatorModal() {
  if (simulatorModalOverlay) simulatorModalOverlay.classList.add('hidden');
  if (currentPendingOrder) {
    window.location.href = `/tracking?track=${currentPendingOrder.order_number}`;
  }
}

async function handleSimulatePayment() {
  if (!currentPendingOrder) return;

  if (simConfirmBtn) {
    simConfirmBtn.disabled = true;
    simConfirmBtn.innerHTML = `
      <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
      Validation USSD en cours...
    `;
  }

  try {
    const res = await fetch('/api/payments/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_number: currentPendingOrder.order_number,
        action: 'APPROVE'
      })
    });

    if (res.ok) {
      window.location.href = `/tracking?track=${currentPendingOrder.order_number}`;
    } else {
      alert('Erreur simulation paiement');
    }
  } catch (e) {
    alert('Erreur de connexion au serveur');
  }
}

// 7. Mobile Navigation Drawer (Hamburger Menu)
function setupHamburgerMenu() {
  if (!hamburgerBtn || !mobileNavDrawer || !mobileNavOverlay) return;

  function openNav() {
    mobileNavOverlay.classList.remove('hidden');
    setTimeout(() => {
      mobileNavDrawer.classList.remove('nav-drawer-closed');
    }, 10);
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    mobileNavDrawer.classList.add('nav-drawer-closed');
    setTimeout(() => {
      mobileNavOverlay.classList.add('hidden');
      document.body.style.overflow = '';
    }, 300);
  }

  hamburgerBtn.addEventListener('click', openNav);
  if (closeMobileNavBtn) closeMobileNavBtn.addEventListener('click', closeNav);
  mobileNavOverlay.addEventListener('click', closeNav);

  const links = mobileNavDrawer.querySelectorAll('.mobile-nav-link');
  links.forEach(l => {
    l.addEventListener('click', () => {
      if (l.id === 'drawer-about-toggle-btn') return;
      closeNav();
    });
  });

  const drawerAboutToggleBtn = document.getElementById('drawer-about-toggle-btn');
  const drawerAboutDropdown = document.getElementById('drawer-about-dropdown');
  const drawerAboutChevron = document.getElementById('drawer-about-chevron');

  if (drawerAboutToggleBtn && drawerAboutDropdown) {
    drawerAboutToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isHidden = drawerAboutDropdown.classList.contains('hidden');
      if (isHidden) {
        drawerAboutDropdown.classList.remove('hidden');
        drawerAboutToggleBtn.setAttribute('aria-expanded', 'true');
        if (drawerAboutChevron) drawerAboutChevron.classList.add('rotate-180');
      } else {
        drawerAboutDropdown.classList.add('hidden');
        drawerAboutToggleBtn.setAttribute('aria-expanded', 'false');
        if (drawerAboutChevron) drawerAboutChevron.classList.remove('rotate-180');
      }
    });
  }
}

// 8. Event Listeners Setup
function initEventListeners() {
  if (searchFilterInput) {
    searchFilterInput.addEventListener('input', applyFilterAndSort);
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', applyFilterAndSort);
  }

  if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCartDrawer);
  if (mobileCartBtn) mobileCartBtn.addEventListener('click', openCartDrawer);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.continue-shopping-action');
    if (link) {
      closeCartDrawer();
    }
  });
  if (cartDrawerOverlay) {
    cartDrawerOverlay.addEventListener('click', (e) => {
      if (e.target === cartDrawerOverlay) closeCartDrawer();
    });
  }

  if (openCheckoutModalBtn) openCheckoutModalBtn.addEventListener('click', openCheckoutModal);
  if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeCheckoutModal);
  if (checkoutModalOverlay) {
    checkoutModalOverlay.addEventListener('click', (e) => {
      if (e.target === checkoutModalOverlay) closeCheckoutModal();
    });
  }

  if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);

  if (simConfirmBtn) simConfirmBtn.addEventListener('click', handleSimulatePayment);
  if (simCloseBtn) simCloseBtn.addEventListener('click', closeSimulatorModal);

  if (globalSearchInput) {
    globalSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = globalSearchInput.value.trim();
        if (q) window.location.href = `/?search=${encodeURIComponent(q)}#products-section`;
      }
    });
  }

  setupHamburgerMenu();
}

// Initial Boot
initEventListeners();
updateCartUi();
loadCategoryPage();
