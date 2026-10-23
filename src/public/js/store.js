// WuazeShop Client Store Logic - TechNova Fidelity & Mobile-First
const CART_STORAGE_KEY = 'wuazeshop_cart';

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

let allProducts = [];
let currentCategory = 'all';
let cart = loadCartFromStorage(); // [{ product, quantity }]
let currentPendingOrder = null;

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const sectionTitle = document.getElementById('section-title');
const categoryCards = document.querySelectorAll('.cat-pill');
const cartBadgeCount = document.getElementById('cart-badge-count');
const cartBadgeTotal = document.getElementById('cart-badge-total');
const mobileCartBadge = document.getElementById('mobile-cart-badge');
const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartSubtotalDisplay = document.getElementById('cart-subtotal-display');
const checkoutModalOverlay = document.getElementById('checkout-modal-overlay');
const checkoutTotalDisplay = document.getElementById('checkout-total-display');
const checkoutForm = document.getElementById('checkout-form');
const simulatorModalOverlay = document.getElementById('simulator-modal-overlay');
const successModalOverlay = document.getElementById('success-modal-overlay');

// 1. Fetch and Display Products
async function loadProducts(category = 'all') {
  try {
    const url = category === 'all' ? '/api/products' : `/api/products?category=${category}`;
    const res = await fetch(url);
    allProducts = await res.json();
    renderProducts(allProducts);
  } catch (err) {
    console.error('Erreur chargement catalogue :', err);
    if (productsGrid) {
      productsGrid.innerHTML = `
        <div class="col-span-full text-center py-10 text-gray-400">
          <p>Impossible de charger le catalogue. Veuillez réessayer.</p>
        </div>
      `;
    }
  }
}

function formatFCFA(amount) {
  return new Intl.NumberFormat('fr-FR').format(amount) + '\u00A0FCFA';
}

function calculateDiscountPercent(price, originalPrice) {
  if (!originalPrice || originalPrice <= price) return null;
  const percent = Math.round(((originalPrice - price) / originalPrice) * 100);
  return `-${percent}%`;
}

function renderProducts(products) {
  if (!productsGrid) return;

  if (!products || products.length === 0) {
    productsGrid.innerHTML = `
      <div class="col-span-full text-center py-14 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <span class="material-symbols-outlined text-5xl text-gray-300 mb-2">inventory_2</span>
        <p class="text-sm font-bold text-gray-800">Aucun article dans cette catégorie pour le moment.</p>
        <p class="text-xs text-gray-400 mt-1">De nouveaux arrivages de Chine sont en cours d'enregistrement.</p>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = products.map((product) => {
    const discountBadgeText = calculateDiscountPercent(product.price, product.original_price);
    
    const strikePriceHtml = product.original_price && product.original_price > product.price
      ? `<span class="text-[10px] sm:text-xs text-gray-400 line-through whitespace-nowrap shrink-0">${new Intl.NumberFormat('fr-FR').format(product.original_price)}<span class="hidden sm:inline">&nbsp;FCFA</span></span>`
      : '';

    const whatsappUrl = `https://wa.me/241074001122?text=${encodeURIComponent(`Bonjour, je souhaite avoir des conseils et des photos réelles sur l'article : ${product.title} (${formatFCFA(product.price)}) vu sur WuazeShop.`)}`;

    return `
      <article class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between border border-gray-100 p-2.5 sm:p-4 relative">
        
        <!-- Top Card Row (Discount Pill if applicable) -->
        <div class="flex items-center justify-start mb-1.5 sm:mb-2 min-h-[1.25rem]">
          ${discountBadgeText ? `
            <span class="bg-[#10b981] text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-2xs">
              ${discountBadgeText}
            </span>
          ` : ''}
        </div>

        <!-- Product Image Container (Clickable to detail page) -->
        <a href="/product/${product.slug || product.id}" class="aspect-square w-full rounded-xl overflow-hidden flex items-center justify-center mb-2 sm:mb-3 bg-gray-50 group-hover:bg-gray-100 transition-colors cursor-pointer block relative" title="Voir les détails de ${product.title}">
          <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="${product.image_url}" alt="${product.title}"/>
        </a>

        <!-- Product Details -->
        <div class="flex flex-col flex-1 justify-between space-y-2 sm:space-y-3">
          <div>
            <span class="text-[9px] sm:text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-0.5">${product.category}</span>
            <a href="/product/${product.slug || product.id}" class="block group-hover:text-[#0d7252] transition-colors" title="Voir les caractéristiques et couleurs">
              <h3 class="text-xs sm:text-sm font-extrabold text-gray-900 line-clamp-2 leading-snug">
                ${product.title}
              </h3>
            </a>
            ${product.description ? `<p class="text-[10px] text-gray-500 line-clamp-1 mt-0.5">${product.description}</p>` : ''}
          </div>

          <!-- Price & Add to Cart -->
          <div class="pt-2 border-t border-gray-100">
            <div class="flex items-baseline gap-1.5 mb-2 sm:mb-2.5 whitespace-nowrap overflow-hidden">
              <span class="text-xs sm:text-sm font-black text-[#0d7252] whitespace-nowrap shrink-0">${formatFCFA(product.price)}</span>
              ${strikePriceHtml}
            </div>

            <div class="flex items-center gap-1.5 sm:gap-2">
              <button onclick="addToCart(${product.id})" class="flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-full bg-[#0d7252] hover:bg-[#08553d] active:scale-[0.98] text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm transition-all">
                <span class="material-symbols-outlined text-[15px] sm:text-sm">shopping_cart</span>
                <span class="hidden sm:inline">Ajouter au panier</span>
                <span class="sm:hidden">Ajouter</span>
              </button>
              <a href="${whatsappUrl}" target="_blank" class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#e6f7f0] text-[#0d7252] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-all shrink-0" title="Conseil WhatsApp direct">
                <span class="material-symbols-outlined text-[15px] sm:text-base">chat</span>
              </a>
            </div>
          </div>

        </div>
      </article>
    `;
  }).join('');
}

// 2. Category Cards & Filters Navigation
categoryCards.forEach(card => {
  card.addEventListener('click', (e) => {
    const cat = card.getAttribute('data-cat');
    if (cat && cat !== 'all') {
      window.location.href = `/category/${cat}`;
    }
  });
});

const viewAllCatsBtn = document.getElementById('view-all-cats-btn');
if (viewAllCatsBtn) {
  viewAllCatsBtn.addEventListener('click', () => {
    categoryCards.forEach(c => c.classList.remove('active'));
    currentCategory = 'all';
    if (sectionTitle) sectionTitle.textContent = 'Les meilleures ventes';
    loadProducts('all');
    const productsSection = document.getElementById('products-section');
    if (productsSection) productsSection.scrollIntoView({ behavior: 'smooth' });
  });
}

// 3. Search Filter (Desktop & Mobile)
function handleSearch(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    renderProducts(allProducts);
    return;
  }
  const filtered = allProducts.filter(p => 
    p.title.toLowerCase().includes(q) || 
    p.category.toLowerCase().includes(q) ||
    (p.specs && p.specs.some(s => s.toLowerCase().includes(q)))
  );
  renderProducts(filtered);
}

const desktopSearch = document.getElementById('desktop-search-input');
if (desktopSearch) {
  desktopSearch.addEventListener('input', (e) => {
    handleSearch(e.target.value);
    const mobileSearch = document.getElementById('mobile-search-input');
    if (mobileSearch) mobileSearch.value = e.target.value;
  });
}

const mobileSearch = document.getElementById('mobile-search-input');
if (mobileSearch) {
  mobileSearch.addEventListener('input', (e) => {
    handleSearch(e.target.value);
    if (desktopSearch) desktopSearch.value = e.target.value;
  });
}

// 4. Shopping Cart State & Drawer
window.addToCart = function(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.product.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ product, quantity: 1 });
  }

  saveCartToStorage();
  updateCartUi();
  openCartDrawer();
};

function updateCartUi() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (cartBadgeCount) cartBadgeCount.textContent = totalItems;
  if (mobileCartBadge) mobileCartBadge.textContent = totalItems;
  if (cartBadgeTotal) cartBadgeTotal.textContent = formatFCFA(subtotal);
  if (cartSubtotalDisplay) cartSubtotalDisplay.textContent = formatFCFA(subtotal);
  if (checkoutTotalDisplay) checkoutTotalDisplay.textContent = formatFCFA(subtotal);

  const cartFooterContainer = document.getElementById('cart-footer-container');
  const cartSubtotalRow = document.getElementById('cart-subtotal-row');
  const openCheckoutModalBtn = document.getElementById('open-checkout-modal-btn');

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
      <img src="${item.product.image_url}" class="w-12 h-12 rounded-xl object-contain bg-white p-1 shadow-sm" alt="${item.product.title}"/>
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-bold text-gray-900 truncate">${item.product.title}</h4>
        <span class="text-xs font-extrabold text-[#0d7252]">${formatFCFA(item.product.price)}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <button onclick="changeQuantity(${idx}, -1)" class="w-7 h-7 rounded-full bg-white text-gray-700 font-bold flex items-center justify-center border border-gray-200 hover:border-[#0d7252] shadow-sm">-</button>
        <span class="text-xs font-bold text-gray-900 w-5 text-center">${item.quantity}</span>
        <button onclick="changeQuantity(${idx}, 1)" class="w-7 h-7 rounded-full bg-white text-gray-700 font-bold flex items-center justify-center border border-gray-200 hover:border-[#0d7252] shadow-sm">+</button>
      </div>
    </div>
  `).join('');
}

window.changeQuantity = function(index, delta) {
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  saveCartToStorage();
  updateCartUi();
};

function openCartDrawer() {
  if (!cartDrawerOverlay) return;
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

const cartToggleBtn = document.getElementById('cart-toggle-btn');
if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCartDrawer);

const mobileCartBtn = document.getElementById('mobile-cart-btn');
if (mobileCartBtn) mobileCartBtn.addEventListener('click', openCartDrawer);

const closeCartBtn = document.getElementById('close-cart-btn');
if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);

document.addEventListener('click', (e) => {
  const link = e.target.closest('.continue-shopping-action');
  if (link) {
    closeCartDrawer();
  }
});

// 5. Checkout Modal
const openCheckoutModalBtn = document.getElementById('open-checkout-modal-btn');
if (openCheckoutModalBtn) {
  openCheckoutModalBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Votre panier est vide !');
      return;
    }
    closeCartDrawer();
    checkoutModalOverlay.classList.remove('hidden');
  });
}

const closeCheckoutBtn = document.getElementById('close-checkout-btn');
if (closeCheckoutBtn) {
  closeCheckoutBtn.addEventListener('click', () => {
    checkoutModalOverlay.classList.add('hidden');
  });
}

// 6. Handle Checkout Form Submission
if (checkoutForm) {
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('checkout-name').value;
    const phone = document.getElementById('checkout-phone').value;
    const neighborhood = document.getElementById('checkout-neighborhood').value;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    const primaryItem = cart[0];

    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: primaryItem.product.id,
          quantity: primaryItem.quantity,
          customerName: name,
          customerPhone: phone,
          customerNeighborhood: neighborhood,
          paymentMethod
        })
      });

      const orderData = await res.json();
      if (!res.ok) {
        alert(`Erreur : ${orderData.error || 'Impossible de créer la commande'}`);
        return;
      }

      currentPendingOrder = orderData;
      checkoutModalOverlay.classList.add('hidden');

      // Open Mobile Money Simulation Modal
      document.getElementById('sim-order-number').textContent = orderData.orderNumber;
      document.getElementById('sim-amount').textContent = formatFCFA(orderData.totalAmount);
      document.getElementById('sim-instructions').textContent = 
        `Une notification USSD push a été envoyée sur votre numéro ${phone} (${paymentMethod === 'AIRTEL_MONEY' ? 'Airtel Money Gabon' : 'Moov Money Gabon'}).`;
      simulatorModalOverlay.classList.remove('hidden');
    } catch (err) {
      alert('Erreur réseau lors de la commande.');
    }
  });
}

// 7. Handle Simulator Approval
const simConfirmBtn = document.getElementById('sim-confirm-btn');
if (simConfirmBtn) {
  simConfirmBtn.addEventListener('click', async () => {
    if (!currentPendingOrder) return;

    try {
      const res = await fetch('/api/payments/simulator/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionReference: currentPendingOrder.transactionReference })
      });

      const confirmData = await res.json();
      if (confirmData.success) {
        simulatorModalOverlay.classList.add('hidden');
        
        // Empty cart
        cart = [];
        saveCartToStorage();
        updateCartUi();

        // Show success modal with pre-filled WhatsApp confirmation link
        document.getElementById('success-order-num').textContent = currentPendingOrder.orderNumber;
        
        const whatsappMsg = `Bonjour WuazeShop ! Je viens d'effectuer mon règlement Mobile Money de ${formatFCFA(currentPendingOrder.totalAmount)} pour la commande ${currentPendingOrder.orderNumber} (${currentPendingOrder.productTitle}). Mon quartier de livraison est ${currentPendingOrder.customerNeighborhood}. Merci de me confirmer la prise en compte pour l'achat en Chine !`;
        
        const whatsappLink = `https://wa.me/241074001122?text=${encodeURIComponent(whatsappMsg)}`;
        document.getElementById('success-whatsapp-link').href = whatsappLink;

        successModalOverlay.classList.remove('hidden');
      }
    } catch (err) {
      alert('Erreur lors de la confirmation simulée.');
    }
  });
}

const simCloseBtn = document.getElementById('sim-close-btn');
if (simCloseBtn) {
  simCloseBtn.addEventListener('click', () => {
    simulatorModalOverlay.classList.add('hidden');
  });
}

const successDoneBtn = document.getElementById('success-done-btn');
if (successDoneBtn) {
  successDoneBtn.addEventListener('click', () => {
    successModalOverlay.classList.add('hidden');
  });
}

const successTrackBtn = document.getElementById('success-track-btn');
if (successTrackBtn) {
  successTrackBtn.addEventListener('click', () => {
    successModalOverlay.classList.add('hidden');
    const orderNum = (currentPendingOrder && (currentPendingOrder.orderNumber || currentPendingOrder.order_number)) || '';
    if (orderNum) {
      window.location.href = `/tracking?track=${encodeURIComponent(orderNum)}`;
    } else {
      window.location.href = '/tracking';
    }
  });
}

// 6. Dynamic Site Settings Hydration (CMS)
async function loadSiteSettings() {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) return;
    const settings = await res.json();

    // 1. Hero Section
    if (settings.hero_section) {
      const h = settings.hero_section;
      if (h.badge && document.getElementById('hero-badge-text')) {
        document.getElementById('hero-badge-text').textContent = h.badge.replace(/^✦\s*/, '');
      }
      if (h.title && document.getElementById('hero-title')) {
        const parts = h.title.split('\n');
        if (parts.length > 1) {
          document.getElementById('hero-title').innerHTML = `${parts[0]}<br/><span class="text-[#0d7252]">${parts.slice(1).join(' ')}</span>`;
        } else {
          document.getElementById('hero-title').textContent = h.title;
        }
      }
      if (h.subtitle && document.getElementById('hero-subtitle')) {
        document.getElementById('hero-subtitle').textContent = h.subtitle;
      }
      if (h.ctaText && document.getElementById('hero-cta-text')) {
        document.getElementById('hero-cta-text').textContent = h.ctaText;
      }
      if (h.ctaLink && document.getElementById('hero-cta-btn')) {
        document.getElementById('hero-cta-btn').setAttribute('href', h.ctaLink);
      }
      if (h.imageUrl && document.getElementById('hero-image')) {
        document.getElementById('hero-image').src = h.imageUrl;
      }
      if (h.prop1Title) document.querySelectorAll('.hero-prop1-title').forEach(el => el.textContent = h.prop1Title);
      if (h.prop1Sub) document.querySelectorAll('.hero-prop1-sub').forEach(el => el.textContent = h.prop1Sub);
      if (h.prop2Title) document.querySelectorAll('.hero-prop2-title').forEach(el => el.textContent = h.prop2Title);
      if (h.prop2Sub) document.querySelectorAll('.hero-prop2-sub').forEach(el => el.textContent = h.prop2Sub);
      if (h.prop3Title) document.querySelectorAll('.hero-prop3-title').forEach(el => el.textContent = h.prop3Title);
      if (h.prop3Sub) document.querySelectorAll('.hero-prop3-sub').forEach(el => el.textContent = h.prop3Sub);
    }

    // 2. Special Offer Promo Banner
    if (settings.promo_section) {
      const p = settings.promo_section;
      if (p.badge && document.getElementById('promo-badge')) document.getElementById('promo-badge').textContent = p.badge;
      if (p.title && document.getElementById('promo-title')) document.getElementById('promo-title').textContent = p.title;
      if (p.subtitle && document.getElementById('promo-subtitle')) document.getElementById('promo-subtitle').textContent = p.subtitle;
      if (p.description && document.getElementById('promo-desc')) document.getElementById('promo-desc').textContent = p.description;
      if (p.ctaText && document.getElementById('promo-cta-text')) document.getElementById('promo-cta-text').textContent = p.ctaText;
      if (p.ctaLink && document.getElementById('promo-cta-btn')) document.getElementById('promo-cta-btn').setAttribute('href', p.ctaLink);
      if (p.imageUrl && document.getElementById('promo-image')) document.getElementById('promo-image').src = p.imageUrl;
    }

    // 3. Trust Pillars
    if (Array.isArray(settings.trust_pillars) && settings.trust_pillars.length > 0) {
      const container = document.getElementById('trust-pillars-container');
      if (container) {
        container.innerHTML = settings.trust_pillars.map(pillar => `
          <div class="flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-full bg-[#e6f7f0] text-[#0d7252] flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-2xl">${pillar.icon || 'verified'}</span>
            </div>
            <div>
              <h4 class="text-xs sm:text-sm font-bold text-gray-900">${pillar.title}</h4>
              <p class="text-[11px] text-gray-500">${pillar.subtitle}</p>
            </div>
          </div>
        `).join('');
      }
    }

    // 4. Contact & WhatsApp
    if (settings.contact_section) {
      const c = settings.contact_section;
      if (c.badge && document.getElementById('contact-badge')) document.getElementById('contact-badge').textContent = c.badge;
      if (c.title && document.getElementById('contact-title')) document.getElementById('contact-title').textContent = c.title;
      if (c.subtitle && document.getElementById('contact-desc')) document.getElementById('contact-desc').textContent = c.subtitle;
      if (c.whatsappNumber) {
        const cleanNumber = String(c.whatsappNumber).replace(/[^0-9]/g, '');
        const waUrl = `https://wa.me/${cleanNumber}`;
        if (document.getElementById('contact-whatsapp-btn')) {
          document.getElementById('contact-whatsapp-btn').setAttribute('href', waUrl);
        }
        document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
          a.setAttribute('href', waUrl);
        });
      }
      if (c.buttonText && document.getElementById('contact-whatsapp-text')) {
        document.getElementById('contact-whatsapp-text').textContent = c.buttonText;
      }
    }

    // 5. Footer
    if (settings.footer_section) {
      const f = settings.footer_section;
      if (f.description && document.getElementById('footer-desc')) document.getElementById('footer-desc').textContent = f.description;
      if (f.copyright && document.getElementById('footer-copyright')) document.getElementById('footer-copyright').textContent = f.copyright;
    }

    // 6. Social Links (Suivez-nous)
    if (settings.social_links) {
      const s = settings.social_links;
      if (s.facebook && document.getElementById('social-facebook')) document.getElementById('social-facebook').href = s.facebook;
      if (s.instagram && document.getElementById('social-instagram')) document.getElementById('social-instagram').href = s.instagram;
      if (s.tiktok && document.getElementById('social-tiktok')) document.getElementById('social-tiktok').href = s.tiktok;
      if (s.whatsapp && document.getElementById('social-whatsapp')) document.getElementById('social-whatsapp').href = s.whatsapp;
    }

    // 7. Legal Section Cache
    if (settings.legal_section) {
      currentLegalSettings = settings.legal_section;
    }

    // 8. FAQ Section
    if (Array.isArray(settings.faq_section)) {
      renderFaqAccordion(settings.faq_section);
    }

  } catch (err) {
    console.warn('Configuration vitrine par défaut active:', err);
  }
}

// FAQ Accordion Logic
function renderFaqAccordion(faqList) {
  const container = document.getElementById('faq-accordion-container');
  if (!container) return;

  if (!faqList || faqList.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-400 text-xs bg-white rounded-2xl border border-gray-100">
        <p>Les questions fréquentes sont en cours de mise à jour.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = faqList.map((item, index) => {
    const isFirst = index === 0;
    return `
      <div class="faq-item bg-white rounded-2xl border border-gray-200/80 hover:border-emerald-200 shadow-sm transition-all overflow-hidden ${isFirst ? 'border-emerald-300' : ''}" data-faq-id="${item.id || index}">
        <button type="button" class="faq-toggle-btn w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 focus:outline-none transition-colors" aria-expanded="${isFirst}">
          <div class="flex items-center gap-3">
            <span class="w-6 h-6 rounded-full bg-emerald-50 text-[#0d7252] text-xs font-bold flex items-center justify-center shrink-0">
              ${index + 1}
            </span>
            <span class="text-xs sm:text-sm font-bold text-gray-900 faq-question-text leading-snug">
              ${escapeHtml(item.question)}
            </span>
          </div>
          <span class="material-symbols-outlined text-gray-400 text-lg faq-chevron transition-transform duration-300 ${isFirst ? 'rotate-180 text-[#0d7252]' : ''}">
            expand_more
          </span>
        </button>
        <div class="faq-answer-container ${isFirst ? '' : 'hidden'} px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
          <p class="text-xs sm:text-sm text-gray-600 leading-relaxed pl-9 border-t border-gray-100/80 pt-3 whitespace-pre-line">
            ${escapeHtml(item.answer)}
          </p>
        </div>
      </div>
    `;
  }).join('');

  // Wire click events
  container.querySelectorAll('.faq-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.faq-item');
      const answer = parent.querySelector('.faq-answer-container');
      const chevron = parent.querySelector('.faq-chevron');
      const isCurrentlyOpen = !answer.classList.contains('hidden');

      if (isCurrentlyOpen) {
        answer.classList.add('hidden');
        chevron.classList.remove('rotate-180', 'text-[#0d7252]');
        btn.setAttribute('aria-expanded', 'false');
        parent.classList.remove('border-emerald-300', 'bg-emerald-50/20');
      } else {
        answer.classList.remove('hidden');
        chevron.classList.add('rotate-180', 'text-[#0d7252]');
        btn.setAttribute('aria-expanded', 'true');
        parent.classList.add('border-emerald-300', 'bg-emerald-50/20');
      }
    });
  });
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

// Legal Documents Modal Logic
let currentLegalSettings = {
  terms: "Chargement des conditions générales...",
  privacy: "Chargement de la politique de confidentialité..."
};

const legalModalOverlay = document.getElementById('legal-modal-overlay');
const legalModalTitle = document.getElementById('legal-modal-title');
const legalModalBody = document.getElementById('legal-modal-body');
const closeLegalModalBtn = document.getElementById('close-legal-modal-btn');
const legalModalDoneBtn = document.getElementById('legal-modal-done-btn');
const openTermsBtn = document.getElementById('open-terms-btn');
const openPrivacyBtn = document.getElementById('open-privacy-btn');

function openLegalModal(type) {
  if (!legalModalOverlay) return;
  if (type === 'terms') {
    legalModalTitle.textContent = "Conditions Générales de Vente & d'Utilisation";
    legalModalBody.textContent = currentLegalSettings.terms || "Aucune condition générale n'a été rédigée pour le moment.";
  } else {
    legalModalTitle.textContent = "Politique de Confidentialité";
    legalModalBody.textContent = currentLegalSettings.privacy || "Aucune politique de confidentialité n'a été rédigée pour le moment.";
  }
  legalModalOverlay.classList.remove('hidden');
}

function closeLegalModal() {
  if (legalModalOverlay) legalModalOverlay.classList.add('hidden');
}

if (openTermsBtn) openTermsBtn.addEventListener('click', () => openLegalModal('terms'));
if (openPrivacyBtn) openPrivacyBtn.addEventListener('click', () => openLegalModal('privacy'));
if (closeLegalModalBtn) closeLegalModalBtn.addEventListener('click', closeLegalModal);
if (legalModalDoneBtn) legalModalDoneBtn.addEventListener('click', closeLegalModal);
if (legalModalOverlay) {
  legalModalOverlay.addEventListener('click', (e) => {
    if (e.target === legalModalOverlay) closeLegalModal();
  });
}

// 7. Interactive Order Tracking Logic (Chine -> Gabon Logistics)
function setupOrderTracking() {
  const form = document.getElementById('tracking-search-form');
  const input = document.getElementById('tracking-search-input');
  if (!form || !input) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const rawVal = input.value.trim();
    if (!rawVal) return;
    trackOrder(rawVal);
  });
}

async function trackOrder(rawOrderNumber) {
  const loadingEl = document.getElementById('tracking-loading');
  const errorEl = document.getElementById('tracking-error');
  const errorTextEl = document.getElementById('tracking-error-text');
  const resultCardEl = document.getElementById('tracking-result-card');
  const helpWhatsApp = document.getElementById('tracking-help-whatsapp');

  if (!loadingEl || !resultCardEl) return;

  // Format order number (prepend WZ- if only digits entered)
  let orderNumber = rawOrderNumber.trim().toUpperCase();
  if (!orderNumber.startsWith('WZ-') && /^\d+$/.test(orderNumber)) {
    orderNumber = `WZ-${orderNumber}`;
  }

  // Reset UI states
  loadingEl.classList.remove('hidden');
  if (errorEl) errorEl.classList.add('hidden');
  resultCardEl.classList.add('hidden');

  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`);
    loadingEl.classList.add('hidden');

    if (!res.ok) {
      if (errorEl) {
        if (errorTextEl) errorTextEl.textContent = `Aucune commande trouvée sous la référence « ${escapeHtml(orderNumber)} ».`;
        if (helpWhatsApp) {
          helpWhatsApp.href = `https://wa.me/241074001122?text=${encodeURIComponent(`Bonjour WuazeShop, je n'arrive pas à localiser ma commande ${orderNumber} sur le site. Pouvez-vous vérifier pour moi ?`)}`;
        }
        errorEl.classList.remove('hidden');
      }
      return;
    }

    const order = await res.json();
    renderTrackingResult(order);
    resultCardEl.classList.remove('hidden');
  } catch (err) {
    loadingEl.classList.add('hidden');
    if (errorEl) {
      if (errorTextEl) errorTextEl.textContent = 'Erreur réseau lors de la recherche du colis.';
      errorEl.classList.remove('hidden');
    }
  }
}

function getFulfillmentStepInfo(fulfillmentStatus) {
  const status = (fulfillmentStatus || '').toUpperCase();

  if (status === 'DELIVERED') {
    return { stepIndex: 4, label: 'Livré au client', color: 'text-emerald-700 bg-emerald-50' };
  }
  if (status === 'ARRIVED_LIBREVILLE' || status === 'ARRIVED_GABON') {
    return { stepIndex: 3, label: 'Arrivé à Libreville', color: 'text-emerald-700 bg-emerald-50' };
  }
  if (status === 'SHIPPED_GABON' || status === 'IN_TRANSIT') {
    return { stepIndex: 2, label: 'En vol cargo international', color: 'text-blue-700 bg-blue-50' };
  }
  if (status === 'IN_PREPARATION_CHINA' || status === 'PURCHASED_IN_CHINA') {
    return { stepIndex: 1, label: 'En préparation en Chine', color: 'text-purple-700 bg-purple-50' };
  }
  // Default: AWAITING_PROCUREMENT or PENDING_CLEARANCE
  return { stepIndex: 0, label: 'Commande confirmée', color: 'text-emerald-700 bg-emerald-50' };
}

function renderTrackingResult(order) {
  const card = document.getElementById('tracking-result-card');
  if (!card) return;

  const { stepIndex, label: statusLabel, color: statusColor } = getFulfillmentStepInfo(order.fulfillmentStatus);
  const isPaid = order.paymentStatus === 'CONFIRMED_CLEARED';

  const steps = [
    {
      title: 'Commande validée',
      desc: 'Paiement Mobile Money validé & enregistré',
      icon: 'receipt_long'
    },
    {
      title: 'Achat & Préparation en Chine',
      desc: 'Inspection qualité & emballage à Shenzhen',
      icon: 'inventory_2'
    },
    {
      title: 'Fret cargo aérien international',
      desc: 'En vol cargo régulier Chine &rarr; Gabon',
      icon: 'flight_takeoff'
    },
    {
      title: 'Arrivé à Libreville',
      desc: 'Dédouanement et tri à l\'aéroport Léon Mba',
      icon: 'domain'
    },
    {
      title: 'Livraison au quartier',
      desc: 'Remise en main propre par notre livreur',
      icon: 'home_pin'
    }
  ];

  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Récemment';

  const whatsappInquiryUrl = `https://wa.me/241074001122?text=${encodeURIComponent(`Bonjour WuazeShop ! Je consulte le suivi de ma commande ${order.orderNumber} (${order.productTitle}) pour ${order.customerNeighborhood}. Avez-vous une précision sur l'acheminement ?`)}`;

  card.innerHTML = `
    <!-- Top Summary Row -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-gray-100 gap-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-base sm:text-lg font-extrabold text-gray-900">${escapeHtml(order.orderNumber)}</span>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColor} border border-current/20">
            ${statusLabel}
          </span>
        </div>
        <p class="text-xs text-gray-400 mt-0.5">Enregistrée le ${orderDate}</p>
      </div>

      <div class="flex items-center gap-2">
        ${isPaid 
          ? `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-[#0d7252]">
               <span class="material-symbols-outlined text-sm">verified</span>
               <span>Encaissé 100%</span>
             </span>`
          : `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
               <span class="material-symbols-outlined text-sm">hourglass_top</span>
               <span>En attente de paiement</span>
             </span>`
        }
      </div>
    </div>

    <!-- Product & Customer Details Card -->
    <div class="bg-gray-50/80 rounded-2xl p-4 sm:p-5 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
      <div class="space-y-1">
        <span class="text-gray-400 block font-medium">Article commandé :</span>
        <p class="font-bold text-gray-900 text-sm">${escapeHtml(order.productTitle)}</p>
        <p class="text-gray-500">Quantité : <strong class="text-gray-900">${order.quantity}</strong> &bull; Total : <strong class="text-[#0d7252]">${formatFCFA(order.totalAmount)}</strong></p>
      </div>

      <div class="space-y-1 sm:border-l sm:border-gray-200/80 sm:pl-4">
        <span class="text-gray-400 block font-medium">Destination finale :</span>
        <p class="font-bold text-gray-900">${escapeHtml(order.customerName)}</p>
        <p class="text-gray-600 flex items-center gap-1">
          <span class="material-symbols-outlined text-sm text-[#0d7252]">location_on</span>
          <span>${escapeHtml(order.customerNeighborhood)}</span>
        </p>
      </div>
    </div>

    <!-- Step-by-Step Logistics Stepper -->
    <div class="pt-2">
      <h4 class="text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-6 flex items-center gap-1.5">
        <span class="material-symbols-outlined text-base text-[#0d7252]">route</span>
        <span>Acheminement Logistique (Chine &rarr; Gabon)</span>
      </h4>

      <div class="relative pl-6 sm:pl-8 space-y-6 sm:space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
        ${steps.map((step, idx) => {
          const isDone = idx < stepIndex;
          const isCurrent = idx === stepIndex;

          let iconHtml = '';
          let badgeText = '';

          if (isDone) {
            iconHtml = `
              <div class="absolute -left-6 sm:-left-8 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#0d7252] text-white flex items-center justify-center shadow-sm">
                <span class="material-symbols-outlined text-sm sm:text-base">check</span>
              </div>
            `;
          } else if (isCurrent) {
            iconHtml = `
              <div class="absolute -left-6 sm:-left-8 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#0d7252] text-white flex items-center justify-center shadow-lg ring-4 ring-emerald-100 animate-pulse">
                <span class="material-symbols-outlined text-sm sm:text-base">${step.icon}</span>
              </div>
            `;
            badgeText = `<span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-[#0d7252] border border-emerald-200/60 ml-2">Étape actuelle</span>`;
          } else {
            iconHtml = `
              <div class="absolute -left-6 sm:-left-8 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-gray-300 text-gray-400 flex items-center justify-center text-xs font-bold">
                ${idx + 1}
              </div>
            `;
          }

          return `
            <div class="relative">
              ${iconHtml}
              <div class="pl-2">
                <h5 class="text-xs sm:text-sm font-extrabold ${isCurrent ? 'text-[#0d7252]' : (isDone ? 'text-gray-900' : 'text-gray-400')}">
                  ${step.title} ${badgeText}
                </h5>
                <p class="text-[11px] sm:text-xs text-gray-500 mt-0.5">${step.desc}</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- WhatsApp Support Action in Card -->
    <div class="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
      <span class="text-[11px] text-gray-400 text-center sm:text-left">
        Besoin d'une précision sur ce colis ou le vol cargo ?
      </span>
      <a href="${whatsappInquiryUrl}" target="_blank" class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold transition-all shadow-sm shrink-0">
        <span class="material-symbols-outlined text-sm">chat</span>
        <span>Écrire au livreur / support</span>
      </a>
    </div>
  `;
}

// Setup Mobile Hamburger Navigation
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

// Global category filter helper for drawer
window.filterByCategory = function(category) {
  if (category && category !== 'all') {
    window.location.href = `/category/${category}`;
    return;
  }
  currentCategory = 'all';
  if (sectionTitle) sectionTitle.textContent = 'Les meilleures ventes';
  loadProducts('all');
  const productsSection = document.getElementById('products-section');
  if (productsSection) {
    productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Initial boot
loadSiteSettings();
loadProducts('all');
updateCartUi();
setupOrderTracking();
setupHamburgerMenu();

// Check URL param ?track=WZ-XXXXXX
const urlParams = new URLSearchParams(window.location.search);
const trackParam = urlParams.get('track');
if (trackParam) {
  const input = document.getElementById('tracking-search-input');
  if (input) input.value = trackParam;
  trackOrder(trackParam);
  const section = document.getElementById('tracking-section');
  if (section) section.scrollIntoView({ behavior: 'smooth' });
}
