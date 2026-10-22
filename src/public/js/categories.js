// WuazeShop - All Categories Grid Catalog Logic
const CART_STORAGE_KEY = 'wuazeshop_cart';

let allCategories = [];
let filteredCategories = [];
let cart = loadCartFromStorage();
let currentPendingOrder = null;

// DOM Elements
const loadingEl = document.getElementById('categories-loading');
const errorEl = document.getElementById('categories-error');
const emptyEl = document.getElementById('categories-empty');
const gridContainer = document.getElementById('categories-cards-grid');
const searchInput = document.getElementById('categories-search-input');
const filterCount = document.getElementById('categories-filter-count');
const heroCount = document.getElementById('categories-hero-count');
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
const drawerAboutToggleBtn = document.getElementById('drawer-about-toggle-btn');
const drawerAboutDropdown = document.getElementById('drawer-about-dropdown');
const drawerAboutChevron = document.getElementById('drawer-about-chevron');

// Helpers
function formatFCFA(amount) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
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

// 1. Fetch Categories
async function loadCategories() {
  try {
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (gridContainer) gridContainer.classList.add('hidden');

    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Erreur de chargement');

    allCategories = await res.json();
    filteredCategories = [...allCategories];

    if (heroCount) {
      heroCount.textContent = `${allCategories.length} rayons disponibles`;
    }

    if (loadingEl) loadingEl.classList.add('hidden');
    renderCategoriesGrid(filteredCategories);
  } catch (err) {
    console.error('Erreur chargement catégories:', err);
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.remove('hidden');
  }
}

// 2. Render Categories in Grid (2 columns on mobile, 3 columns on desktop)
function renderCategoriesGrid(categories) {
  if (!gridContainer) return;

  if (!categories || categories.length === 0) {
    gridContainer.innerHTML = '';
    gridContainer.classList.add('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
    if (filterCount) filterCount.textContent = '0 rayon trouvé';
    return;
  }

  if (emptyEl) emptyEl.classList.add('hidden');
  gridContainer.classList.remove('hidden');

  if (filterCount) {
    filterCount.textContent = `${categories.length} ${categories.length > 1 ? 'rayons' : 'rayon'}`;
  }

  // Exact 2x3 Grid View matching the user wireframe (2 columns on mobile, 3 columns on desktop)
  gridContainer.className = 'grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6 max-w-4xl mx-auto';

  gridContainer.innerHTML = categories.map(cat => {
    const count = cat.productCount || 0;
    return `
      <a 
        href="/category/${escapeHtml(cat.slug)}"
        class="category-tile-card group relative overflow-hidden rounded-2xl sm:rounded-3xl p-3 sm:p-5 md:p-6 flex flex-col justify-between items-center text-center bg-white border border-gray-100 hover:border-[#0d7252] shadow-xs hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-300 min-h-[160px] sm:min-h-[195px] cursor-pointer hover:bg-gradient-to-b hover:from-white hover:to-emerald-50/40"
        title="Ouvrir le rayon ${escapeHtml(cat.name)}"
      >
        <!-- Subtle ambient light on hover -->
        <div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-500/5 blur-xl pointer-events-none group-hover:scale-125 transition-transform"></div>

        <!-- Top: Category Icon in Emerald Container -->
        <div class="relative z-10 w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-[#e6f7f0] text-[#0d7252] border border-emerald-200/60 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-[#0d7252] group-hover:text-white transition-all duration-300 shrink-0">
          <span class="material-symbols-outlined text-xl sm:text-2xl md:text-3xl">${escapeHtml(cat.icon || 'category')}</span>
        </div>

        <!-- Center: Category Title & Product Count Badge -->
        <div class="relative z-10 my-1.5 sm:my-2 space-y-1 sm:space-y-1.5 w-full flex flex-col items-center">
          <h3 class="font-extrabold text-xs sm:text-sm md:text-base text-gray-900 group-hover:text-[#0d7252] transition-colors leading-tight tracking-tight line-clamp-2 h-7 sm:h-9 flex items-center justify-center text-center px-0.5">
            ${escapeHtml(cat.name)}
          </h3>
          <span class="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] md:text-[11px] font-bold bg-gray-100 text-gray-600 group-hover:bg-[#e6f7f0] group-hover:text-[#0d7252] transition-colors shrink-0">
            <span>${count} ${count > 1 ? 'articles' : 'article'}</span>
          </span>
        </div>

        <!-- Bottom: Action Callout -->
        <div class="relative z-10 inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-gray-400 group-hover:text-[#0d7252] transition-colors shrink-0">
          <span>Explorer</span>
          <span class="material-symbols-outlined text-xs sm:text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </div>
      </a>
    `;
  }).join('');
}

// 3. Search / Filter Filter
function applyFilter() {
  const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
  if (!query) {
    filteredCategories = [...allCategories];
  } else {
    filteredCategories = allCategories.filter(cat => {
      const nameMatch = (cat.name || '').toLowerCase().includes(query);
      const descMatch = (cat.description || '').toLowerCase().includes(query);
      const slugMatch = (cat.slug || '').toLowerCase().includes(query);
      return nameMatch || descMatch || slugMatch;
    });
  }
  renderCategoriesGrid(filteredCategories);
}

// 4. Cart UI Management
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

// 5. Checkout & Simulator
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

// 6. Hamburger Menu & "À propos" Dropdown
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
    l.addEventListener('click', (e) => {
      // Don't close if clicking the accordion toggle button itself
      if (l.id === 'drawer-about-toggle-btn') return;
      closeNav();
    });
  });

  // Accordion Dropdown toggle for "À propos"
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

// 7. Event Listeners Init
function init() {
  if (searchInput) searchInput.addEventListener('input', applyFilter);
  if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCartDrawer);
  if (mobileCartBtn) mobileCartBtn.addEventListener('click', openCartDrawer);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.continue-shopping-action');
    if (link) {
      closeCartDrawer();
      const grid = document.getElementById('categories-container') || document.querySelector('main');
      if (grid) grid.scrollIntoView({ behavior: 'smooth' });
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
  updateCartUi();
  loadCategories();
}

init();
