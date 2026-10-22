// WuazeShop - About Us Page Dynamic Logic & CMS Integration
const CART_STORAGE_KEY = 'wuazeshop_cart';

function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function updateCartBadges() {
  const cart = loadCartFromStorage();
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalAmount = cart.reduce((sum, item) => sum + ((item.product?.price || 0) * (item.quantity || 1)), 0);

  const cartBadgeCount = document.getElementById('cart-badge-count');
  const cartBadgeTotal = document.getElementById('cart-badge-total');
  const mobileCartBadge = document.getElementById('mobile-cart-badge');

  if (cartBadgeCount) cartBadgeCount.textContent = totalItems;
  if (mobileCartBadge) mobileCartBadge.textContent = totalItems;
  if (cartBadgeTotal) {
    cartBadgeTotal.textContent = new Intl.NumberFormat('fr-FR').format(totalAmount) + ' FCFA';
  }
}

async function loadAboutSettings() {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) return;
    const settings = await res.json();

    if (settings.about_section) {
      const a = settings.about_section;
      if (a.badge && document.getElementById('about-hero-badge')) {
        document.getElementById('about-hero-badge').textContent = a.badge;
      }
      if (a.title && document.getElementById('about-hero-title')) {
        document.getElementById('about-hero-title').innerHTML = a.title.replace(/\n/g, '<br/>');
      }
      if (a.subtitle && document.getElementById('about-hero-subtitle')) {
        document.getElementById('about-hero-subtitle').textContent = a.subtitle;
      }
      if (a.storyTitle && document.getElementById('about-story-title')) {
        document.getElementById('about-story-title').textContent = a.storyTitle;
      }
      if (a.storyParagraph1 && document.getElementById('about-story-p1')) {
        document.getElementById('about-story-p1').textContent = a.storyParagraph1;
      }
      if (a.storyParagraph2 && document.getElementById('about-story-p2')) {
        document.getElementById('about-story-p2').textContent = a.storyParagraph2;
      }
      if (a.storyParagraph3 && document.getElementById('about-story-p3')) {
        document.getElementById('about-story-p3').textContent = a.storyParagraph3;
      }
      if (a.missionTitle && document.getElementById('about-mission-title')) {
        document.getElementById('about-mission-title').textContent = a.missionTitle;
      }
      if (a.missionText && document.getElementById('about-mission-text')) {
        document.getElementById('about-mission-text').textContent = a.missionText;
      }
      if (a.stat1Number && document.getElementById('about-stat1-num')) {
        document.getElementById('about-stat1-num').textContent = a.stat1Number;
      }
      if (a.stat1Label && document.getElementById('about-stat1-label')) {
        document.getElementById('about-stat1-label').textContent = a.stat1Label;
      }
      if (a.stat2Number && document.getElementById('about-stat2-num')) {
        document.getElementById('about-stat2-num').textContent = a.stat2Number;
      }
      if (a.stat2Label && document.getElementById('about-stat2-label')) {
        document.getElementById('about-stat2-label').textContent = a.stat2Label;
      }
      if (a.stat3Number && document.getElementById('about-stat3-num')) {
        document.getElementById('about-stat3-num').textContent = a.stat3Number;
      }
      if (a.stat3Label && document.getElementById('about-stat3-label')) {
        document.getElementById('about-stat3-label').textContent = a.stat3Label;
      }
      if (a.stat4Number && document.getElementById('about-stat4-num')) {
        document.getElementById('about-stat4-num').textContent = a.stat4Number;
      }
      if (a.stat4Label && document.getElementById('about-stat4-label')) {
        document.getElementById('about-stat4-label').textContent = a.stat4Label;
      }
    }

    if (settings.footer_section) {
      const f = settings.footer_section;
      if (f.description && document.getElementById('footer-desc')) {
        document.getElementById('footer-desc').textContent = f.description;
      }
      if (f.copyright && document.getElementById('footer-copyright')) {
        document.getElementById('footer-copyright').textContent = f.copyright;
      }
    }
  } catch (err) {
    console.warn('Configuration standard active pour À propos:', err);
  }
}

// Hamburger Navigation Logic
function setupHamburgerMenu() {
  const hamburgerBtn = document.getElementById('hamburger-menu-btn');
  const closeNavBtn = document.getElementById('close-mobile-nav-btn');
  const navDrawer = document.getElementById('mobile-nav-drawer');
  const navOverlay = document.getElementById('mobile-nav-overlay');
  const navLinks = document.querySelectorAll('.mobile-nav-link');

  function openNav() {
    if (navDrawer && navOverlay) {
      navOverlay.classList.remove('hidden');
      navDrawer.classList.remove('nav-drawer-closed');
      document.body.classList.add('overflow-hidden');
    }
  }

  function closeNav() {
    if (navDrawer && navOverlay) {
      navDrawer.classList.add('nav-drawer-closed');
      setTimeout(() => navOverlay.classList.add('hidden'), 250);
      document.body.classList.remove('overflow-hidden');
    }
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', openNav);
  if (closeNavBtn) closeNavBtn.addEventListener('click', closeNav);
  if (navOverlay) navOverlay.addEventListener('click', closeNav);

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (link.id === 'drawer-about-toggle-btn') return;
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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });
}

// Global search bar redirect to /categories
const globalSearchInput = document.getElementById('global-search-input');
if (globalSearchInput) {
  globalSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = globalSearchInput.value.trim();
      if (q) window.location.href = `/categories?q=${encodeURIComponent(q)}`;
    }
  });
}

// Cart Drawer Management
const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartToggleBtn = document.getElementById('cart-toggle-btn');
const mobileCartBtn = document.getElementById('mobile-cart-btn');

function openCartDrawer() {
  if (!cartDrawerOverlay) return;
  renderCartDrawer();
  cartDrawerOverlay.classList.remove('hidden');
  const drawer = cartDrawerOverlay.querySelector('.drawer');
  if (drawer) drawer.classList.remove('drawer-closed');
}

function closeCartDrawer() {
  if (!cartDrawerOverlay) return;
  const drawer = cartDrawerOverlay.querySelector('.drawer');
  if (drawer) drawer.classList.add('drawer-closed');
  setTimeout(() => cartDrawerOverlay.classList.add('hidden'), 250);
}

function renderCartDrawer() {
  const cart = getCart();
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartFooterContainer = document.getElementById('cart-footer-container');
  const cartSubtotalRow = document.getElementById('cart-subtotal-row');
  const cartSubtotalDisplay = document.getElementById('cart-subtotal-display');
  const openCheckoutModalBtn = document.getElementById('open-checkout-modal-btn');

  const totalAmount = cart.reduce((sum, item) => sum + ((item.product?.price || 0) * (item.quantity || 1)), 0);
  if (cartSubtotalDisplay) {
    cartSubtotalDisplay.textContent = new Intl.NumberFormat('fr-FR').format(totalAmount) + ' FCFA';
  }

  if (!cartItemsContainer) return;

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

  cartItemsContainer.innerHTML = cart.map((item, idx) => `
    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
      <img src="${item.product?.image_url || '/images/hero-devices.jpg'}" class="w-12 h-12 rounded-xl object-contain bg-white p-1 shadow-sm" alt="${item.product?.title || 'Produit'}"/>
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-bold text-gray-900 truncate">${item.product?.title || 'Produit'}</h4>
        <span class="text-xs font-extrabold text-[#0d7252]">${new Intl.NumberFormat('fr-FR').format(item.product?.price || 0)} FCFA</span>
      </div>
      <div class="text-xs font-bold text-gray-500">x${item.quantity || 1}</div>
    </div>
  `).join('');
}

[cartToggleBtn, mobileCartBtn].forEach(btn => {
  if (btn) btn.addEventListener('click', openCartDrawer);
});
if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);
if (cartDrawerOverlay) {
  cartDrawerOverlay.addEventListener('click', (e) => {
    if (e.target === cartDrawerOverlay) closeCartDrawer();
  });
}

const openCheckoutBtn = document.getElementById('open-checkout-modal-btn');
if (openCheckoutBtn) {
  openCheckoutBtn.addEventListener('click', () => {
    window.location.href = '/?checkout=open';
  });
}

document.addEventListener('click', (e) => {
  const link = e.target.closest('.continue-shopping-action');
  if (link) {
    closeCartDrawer();
  }
});

// Init
document.addEventListener('DOMContentLoaded', () => {
  loadAboutSettings();
  updateCartBadges();
  setupHamburgerMenu();
});
