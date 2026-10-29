// WuazeShop - Dedicated Product Detail Logic & Variant Selector
const CART_STORAGE_KEY = 'wuazeshop_cart';

let currentProduct = null;
let selectedColor = null;
let quantity = 1;
let cart = loadCartFromStorage();
let currentPendingOrder = null;
let selectedShippingMethod = 'normal';
let cargoSettings = {
  normalRate: 10000,
  normalDelay: '2 semaines',
  expressRate: 13500,
  expressDelay: '1 semaine',
  minWeight: 0.1
};

// DOM Elements
const loadingEl = document.getElementById('product-loading');
const errorEl = document.getElementById('product-error');
const contentEl = document.getElementById('product-content');

// Color Name Resolver
const KNOWN_COLORS = {
  '#9c9589': 'Titane Naturel',
  '#39383b': 'Noir Sidéral',
  '#293644': 'Bleu Titane',
  '#1e2530': 'Minuit / Dark Blue',
  '#d2d4d7': 'Argent / Silver',
  '#f0e4d3': 'Lumière Stellaire / Gold',
  '#1e1e1e': 'Noir Mat / Graphite',
  '#f97316': 'Orange Alpine',
  '#ffffff': 'Blanc Pur'
};

function resolveColorName(colorStr) {
  if (!colorStr) return 'Standard';
  const lower = colorStr.toLowerCase().trim();
  if (KNOWN_COLORS[lower]) return KNOWN_COLORS[lower];
  if (lower.startsWith('#')) return `Finition (${colorStr})`;
  return colorStr.charAt(0).toUpperCase() + colorStr.slice(1);
}

function formatFCFA(amount) {
  return new Intl.NumberFormat('fr-FR').format(amount) + '\u00A0FCFA';
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

// 1. Resolve Product Identifier from URL
function getProductIdentifierFromUrl() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts.length >= 2 && pathParts[0] === 'product') {
    return pathParts[1];
  }

  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('slug') || urlParams.get('id') || 'iphone-15-pro-max-256gb';
}

// 2. Fetch and Hydrate Product
async function loadProductDetails() {
  const identifier = getProductIdentifierFromUrl();
  if (!identifier) {
    showError();
    return;
  }

  try {
    const res = await fetch(`/api/products/${identifier}`);
    if (!res.ok) {
      showError();
      return;
    }

    currentProduct = await res.json();
    renderProductPage(currentProduct);
    loadRelatedProducts(currentProduct.category, currentProduct.id);
  } catch (err) {
    console.error('Erreur chargement produit:', err);
    showError();
  }
}

function showError() {
  if (loadingEl) loadingEl.classList.add('hidden');
  if (contentEl) contentEl.classList.add('hidden');
  if (errorEl) errorEl.classList.remove('hidden');
}

// ==================== MULTI-ANGLE PRODUCT GALLERY CONTROLLER ====================
let currentGalleryImages = [];
let activeGalleryIndex = 0;

function setupProductGallery(product) {
  let images = [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    images = product.images.filter(Boolean);
  }
  if (images.length === 0 && product.image_url) {
    images = [product.image_url];
  }
  currentGalleryImages = images;
  activeGalleryIndex = 0;

  renderGalleryState();
}

function showGalleryImage(index, animate = true) {
  if (currentGalleryImages.length === 0) return;
  if (index < 0) {
    index = currentGalleryImages.length - 1;
  } else if (index >= currentGalleryImages.length) {
    index = 0;
  }
  activeGalleryIndex = index;

  const detailImg = document.getElementById('detail-image');
  if (detailImg) {
    if (animate) {
      detailImg.style.opacity = '0.3';
      detailImg.style.transform = 'scale(0.98)';
      setTimeout(() => {
        detailImg.src = currentGalleryImages[activeGalleryIndex];
        detailImg.style.opacity = '1';
        detailImg.style.transform = '';
      }, 120);
    } else {
      detailImg.src = currentGalleryImages[activeGalleryIndex];
    }
  }

  // Update Dots
  const dotsContainer = document.getElementById('gallery-dots-container');
  if (dotsContainer) {
    const dots = dotsContainer.querySelectorAll('.gallery-dot span');
    dots.forEach((dotSpan, idx) => {
      if (idx === activeGalleryIndex) {
        dotSpan.className = 'w-5 h-1.5 rounded-full bg-[#0d7252] shadow-2xs transition-all duration-300 inline-block';
      } else {
        dotSpan.className = 'w-2 h-2 rounded-full bg-gray-300 hover:bg-gray-400 transition-all duration-300 inline-block';
      }
    });
  }
}

function renderGalleryState() {
  const dotsContainer = document.getElementById('gallery-dots-container');
  const hasMultiple = currentGalleryImages.length > 1;

  if (dotsContainer) {
    if (hasMultiple) {
      dotsContainer.innerHTML = `
        <div class="inline-flex items-center gap-1 bg-white/85 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xs border border-white/80">
          ${currentGalleryImages.map((_, idx) => `
            <button 
              type="button" 
              aria-label="Angle ${idx + 1}"
              onclick="event.stopPropagation(); showGalleryImage(${idx})"
              class="gallery-dot p-1 flex items-center justify-center cursor-pointer transition-all border-0 bg-transparent outline-none focus:outline-none focus:ring-0 active:outline-none"
            >
              <span class="${idx === activeGalleryIndex ? 'w-5 h-1.5 rounded-full bg-[#0d7252] shadow-2xs' : 'w-2 h-2 rounded-full bg-gray-300 hover:bg-gray-400'} transition-all duration-300 inline-block"></span>
            </button>
          `).join('')}
        </div>
      `;
      dotsContainer.classList.remove('hidden');
    } else {
      dotsContainer.innerHTML = '';
      dotsContainer.classList.add('hidden');
    }
  }

  showGalleryImage(0, false);
}

window.showGalleryImage = showGalleryImage;
window.nextGalleryImage = () => showGalleryImage(activeGalleryIndex + 1);
window.prevGalleryImage = () => showGalleryImage(activeGalleryIndex - 1);

let galleryEventsInitialized = false;
function initGalleryEventListeners() {
  if (galleryEventsInitialized) return;
  galleryEventsInitialized = true;

  const galleryCard = document.getElementById('gallery-card');

  window.addEventListener('keydown', (e) => {
    if (currentGalleryImages.length <= 1) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'ArrowLeft') window.prevGalleryImage();
    else if (e.key === 'ArrowRight') window.nextGalleryImage();
  });

  if (galleryCard) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    galleryCard.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    galleryCard.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
        if (diffX < 0) {
          window.nextGalleryImage();
        } else {
          window.prevGalleryImage();
        }
      }
    }, { passive: true });

    // Click on card to advance image if multiple exist and click was not on a dot
    galleryCard.addEventListener('click', (e) => {
      if (currentGalleryImages.length <= 1) return;
      if (e.target.closest('#gallery-dots-container')) return;
      window.nextGalleryImage();
    });
  }
}

function renderProductPage(product) {
  if (loadingEl) loadingEl.classList.add('hidden');
  if (errorEl) errorEl.classList.add('hidden');
  if (contentEl) contentEl.classList.remove('hidden');

  // Page title & Meta
  document.title = `${product.title} - WuazeShop Gabon`;
  const metaDesc = document.getElementById('meta-desc');
  if (metaDesc && product.description) {
    metaDesc.content = `${product.title} au Gabon. ${product.description.slice(0, 140)}... Prix : ${formatFCFA(product.price)}.`;
  }

  // Breadcrumbs
  const bcCat = document.getElementById('breadcrumb-category');
  if (bcCat) {
    bcCat.textContent = product.category;
    bcCat.href = `/category/${product.category}`;
  }
  const bcProd = document.getElementById('breadcrumb-product');
  if (bcProd) bcProd.textContent = product.title;

  // Multi-Angle Interactive Gallery
  setupProductGallery(product);
  initGalleryEventListeners();

  const discountText = calculateDiscountPercent(product.price, product.original_price);
  const discountBadge = document.getElementById('detail-discount-badge');
  const savingPill = document.getElementById('detail-saving-pill');

  if (discountText) {
    if (discountBadge) {
      discountBadge.textContent = `${discountText} OFF`;
      discountBadge.classList.remove('hidden');
    }
    if (savingPill) {
      const saving = product.original_price - product.price;
      savingPill.textContent = `Économisez ${formatFCFA(saving)}`;
      savingPill.classList.remove('hidden');
    }
  } else {
    if (discountBadge) discountBadge.classList.add('hidden');
    if (savingPill) savingPill.classList.add('hidden');
  }

  // Category & Title
  const catBadge = document.getElementById('detail-category-badge');
  if (catBadge) catBadge.textContent = product.category;

  const titleEl = document.getElementById('detail-title');
  if (titleEl) titleEl.textContent = product.title;

  // Quick Spec Pills (Huel style highlights directly below title)
  const quickSpecsEl = document.getElementById('detail-quick-specs');
  if (quickSpecsEl) {
    if (Array.isArray(product.specs) && product.specs.length > 0) {
      const topSpecs = product.specs.slice(0, 3);
      quickSpecsEl.innerHTML = topSpecs.map(spec => `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100/90 border border-gray-200/60 text-gray-700 text-[11px] sm:text-xs font-semibold">
          <span class="material-symbols-outlined text-[13px] text-[#0d7252]">bolt</span>
          <span>${spec}</span>
        </span>
      `).join('');
      quickSpecsEl.classList.remove('hidden');
    } else {
      quickSpecsEl.classList.add('hidden');
    }
  }

  // Prices
  const priceEl = document.getElementById('detail-price');
  if (priceEl) priceEl.textContent = formatFCFA(product.price);

  const mobileStickyPrice = document.getElementById('mobile-sticky-price');
  if (mobileStickyPrice) mobileStickyPrice.textContent = formatFCFA(product.price);

  // Cargo Shipping Box Estimations
  const pWeight = product.weight || 0.4;
  const weightBadge = document.getElementById('detail-product-weight-badge');
  if (weightBadge) weightBadge.textContent = `Poids: ${pWeight} kg`;

  const normalCargoEl = document.getElementById('detail-cargo-normal-price');
  if (normalCargoEl) {
    const normalFee = Math.max(1000, Math.round(pWeight * (cargoSettings.normalRate || 10000)));
    normalCargoEl.textContent = formatFCFA(normalFee);
  }

  const expressCargoEl = document.getElementById('detail-cargo-express-price');
  if (expressCargoEl) {
    const expressFee = Math.max(1000, Math.round(pWeight * (cargoSettings.expressRate || 13500)));
    expressCargoEl.textContent = formatFCFA(expressFee);
  }

  // Description
  const descEl = document.getElementById('detail-description');
  if (descEl) {
    descEl.textContent = product.description || "Article haut de gamme importé directement d'usines partenaires certifiées en Chine avec expédition cargo rapide et sécurisée vers Libreville, Gabon.";
  }

  // Technical Characteristics / Specs
  const specsSection = document.getElementById('detail-specs-section');
  const specsContainer = document.getElementById('detail-specs-container');

  if (Array.isArray(product.specs) && product.specs.length > 0) {
    if (specsSection) specsSection.classList.remove('hidden');
    if (specsContainer) {
      specsContainer.innerHTML = product.specs.map(spec => `
        <div class="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-800">
          <span class="w-4 h-4 rounded-full bg-emerald-100 text-[#0d7252] flex items-center justify-center text-[10px] font-black shrink-0">✓</span>
          <span class="font-medium text-xs leading-tight">${spec}</span>
        </div>
      `).join('');
    }
  } else {
    if (specsSection) specsSection.classList.add('hidden');
  }

  // Colors / Finishes Variant Selector
  setupColorVariants(product);

  // Update WhatsApp Button Link
  updateWhatsAppInquiryLink();
}

function setupColorVariants(product) {
  const colorsSection = document.getElementById('detail-colors-section');
  const colorsContainer = document.getElementById('detail-colors-container');
  const colorNameLabel = document.getElementById('detail-selected-color-name');

  const colors = Array.isArray(product.colors) && product.colors.length > 0
    ? product.colors
    : ['#1e1e1e'];

  selectedColor = colors[0];
  if (colorNameLabel) colorNameLabel.textContent = resolveColorName(selectedColor);

  colorsContainer.innerHTML = colors.map((col, idx) => {
    const isHex = col.startsWith('#');
    const bgStyle = isHex ? `background-color: ${col};` : 'background-color: #333;';
    const isActive = idx === 0 ? 'active' : '';
    const colorLabel = resolveColorName(col);

    return `
      <button 
        type="button"
        onclick="selectColorVariant('${col}', this)"
        class="color-swatch ${isActive} relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-transform"
        style="${bgStyle}"
        title="${colorLabel}"
      >
        <span class="swatch-check material-symbols-outlined text-white text-sm drop-shadow ${idx === 0 ? '' : 'hidden'}">check</span>
      </button>
    `;
  }).join('');
}

window.selectColorVariant = function(colorStr, btnEl) {
  selectedColor = colorStr;
  
  // Update UI active state
  document.querySelectorAll('.color-swatch').forEach(btn => {
    btn.classList.remove('active');
    const check = btn.querySelector('.swatch-check');
    if (check) check.classList.add('hidden');
  });

  if (btnEl) {
    btnEl.classList.add('active');
    const check = btnEl.querySelector('.swatch-check');
    if (check) check.classList.remove('hidden');
  }

  const colorNameLabel = document.getElementById('detail-selected-color-name');
  if (colorNameLabel) colorNameLabel.textContent = resolveColorName(selectedColor);

  updateWhatsAppInquiryLink();
};

function updateWhatsAppInquiryLink() {
  if (!currentProduct) return;

  const colorName = resolveColorName(selectedColor);
  const text = `Bonjour WuazeShop ! Je souhaite passer commande / avoir des conseils pour l'article : ${currentProduct.title} en finition ${colorName} (${formatFCFA(currentProduct.price)}). Est-il disponible pour expédition immédiate vers Libreville ?`;
  const whatsappUrl = `https://wa.me/241074001122?text=${encodeURIComponent(text)}`;

  const btn = document.getElementById('btn-whatsapp-inquiry');
  if (btn) btn.href = whatsappUrl;

  const mobileWaBtn = document.getElementById('mobile-sticky-whatsapp-btn');
  if (mobileWaBtn) mobileWaBtn.href = whatsappUrl;
}

// 3. 'Vous pourriez aussi aimer' Suggestions Section
async function loadRelatedProducts(category, currentId) {
  const container = document.getElementById('related-products-grid');
  if (!container) return;

  try {
    const res = await fetch(`/api/products?category=${category}`);
    let products = [];
    if (res.ok) {
      products = await res.json();
    }
    let related = products.filter(p => p.id !== currentId);

    // If fewer than 4 products in this category, supplement with top products from the rest of the catalogue
    if (related.length < 4) {
      const allRes = await fetch('/api/products');
      if (allRes.ok) {
        const allProducts = await allRes.json();
        const extras = allProducts.filter(p => p.id !== currentId && !related.some(r => r.id === p.id));
        related = [...related, ...extras];
      }
    }

    related = related.slice(0, 4);

    if (related.length === 0) {
      if (container.parentElement) container.parentElement.classList.add('hidden');
      return;
    }

    if (container.parentElement) container.parentElement.classList.remove('hidden');

    container.innerHTML = related.map(p => {
      const discount = calculateDiscountPercent(p.price, p.original_price);
      return `
        <article class="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-200/70 transition-all duration-300 flex flex-col justify-between border border-gray-150 p-3 sm:p-4 relative">
          <a href="/product/${p.slug || p.id}" class="aspect-square w-full rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center mb-2.5 bg-gray-50 group-hover:bg-gray-100 transition-colors relative block">
            ${discount ? `
              <span class="absolute top-2 left-2 z-10 bg-[#10b981] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs">
                ${discount}
              </span>
            ` : ''}
            <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="${p.image_url}" alt="${p.title}" loading="lazy"/>
          </a>
          <div class="space-y-1.5 flex-1 flex flex-col justify-between">
            <div>
              <span class="text-[9px] uppercase font-bold text-gray-400 tracking-wider">${p.category}</span>
              <a href="/product/${p.slug || p.id}" class="block group-hover:text-[#0d7252] transition-colors">
                <h4 class="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 leading-snug">${p.title}</h4>
              </a>
            </div>
            <div class="pt-1 flex items-baseline justify-between gap-2 border-t border-gray-100">
              <span class="text-xs sm:text-sm font-black text-[#0d7252]">${formatFCFA(p.price)}</span>
              ${p.original_price ? `<span class="text-[10px] text-gray-400 line-through">${formatFCFA(p.original_price)}</span>` : ''}
            </div>
          </div>
        </article>
      `;
    }).join('');
  } catch (e) {
    console.warn('Erreur chargement articles suggérés:', e);
  }
}

// 4. Quantity Stepper
const qtyMinusBtn = document.getElementById('qty-minus');
const qtyPlusBtn = document.getElementById('qty-plus');
const qtyDisplay = document.getElementById('qty-display');

if (qtyMinusBtn && qtyPlusBtn && qtyDisplay) {
  qtyMinusBtn.addEventListener('click', () => {
    if (quantity > 1) {
      quantity -= 1;
      qtyDisplay.textContent = quantity;
    }
  });

  qtyPlusBtn.addEventListener('click', () => {
    if (quantity < 10) {
      quantity += 1;
      qtyDisplay.textContent = quantity;
    }
  });
}

// 5. Cart Operations
function updateCartUi() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalWeight = cart.reduce((sum, item) => sum + (item.product.weight || 0.4) * item.quantity, 0);
  const roundedWeight = Math.round(totalWeight * 10) / 10;
  
  const rate = selectedShippingMethod === 'express' ? (cargoSettings.expressRate || 13500) : (cargoSettings.normalRate || 10000);
  const effectiveWeight = Math.max(cargoSettings.minWeight || 0.1, totalWeight);
  const shippingFee = cart.length > 0 ? Math.round(effectiveWeight * rate) : 0;
  const grandTotal = subtotal + shippingFee;

  const cartBadgeCount = document.getElementById('cart-badge-count');
  const mobileCartBadge = document.getElementById('mobile-cart-badge');
  const cartBadgeTotal = document.getElementById('cart-badge-total');
  const cartSubtotalDisplay = document.getElementById('cart-subtotal-display');
  const cartShippingFeeDisplay = document.getElementById('cart-shipping-fee-display');
  const cartTotalDisplay = document.getElementById('cart-total-display');
  const cartTotalWeightBadge = document.getElementById('cart-total-weight-badge');
  const checkoutTotalDisplay = document.getElementById('checkout-total-display');
  const checkoutShippingSummary = document.getElementById('checkout-shipping-summary');
  const cartItemsContainer = document.getElementById('cart-items-container');

  if (cartBadgeCount) cartBadgeCount.textContent = totalItems;
  if (mobileCartBadge) mobileCartBadge.textContent = totalItems;
  if (cartBadgeTotal) cartBadgeTotal.textContent = formatFCFA(grandTotal);
  if (cartSubtotalDisplay) cartSubtotalDisplay.textContent = formatFCFA(subtotal);
  if (cartShippingFeeDisplay) cartShippingFeeDisplay.textContent = formatFCFA(shippingFee);
  if (cartTotalDisplay) cartTotalDisplay.textContent = formatFCFA(grandTotal);
  if (cartTotalWeightBadge) cartTotalWeightBadge.textContent = `${roundedWeight} kg`;
  if (checkoutTotalDisplay) checkoutTotalDisplay.textContent = formatFCFA(grandTotal);
  if (checkoutShippingSummary) {
    const isExp = selectedShippingMethod === 'express';
    checkoutShippingSummary.textContent = `${isExp ? 'Colis Rapide' : 'Colis Normal'} (${isExp ? cargoSettings.expressDelay : cargoSettings.normalDelay} - ${formatFCFA(shippingFee)})`;
  }

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
        ${item.product.selectedColor ? `<p class="text-[10px] text-gray-500">Couleur : ${resolveColorName(item.product.selectedColor)}</p>` : ''}
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

const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
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

// Add to Cart Button
const btnAddToCart = document.getElementById('btn-add-to-cart');
const mobileStickyAddBtn = document.getElementById('mobile-sticky-add-btn');

function handleAddToCart() {
  if (!currentProduct) return;

  const colorName = resolveColorName(selectedColor);
  const productToAdd = {
    ...currentProduct,
    selectedColor: colorName
  };

  const existingIndex = cart.findIndex(item => 
    item.product.id === productToAdd.id && 
    item.product.selectedColor === productToAdd.selectedColor
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({ product: productToAdd, quantity });
  }

  saveCartToStorage();
  updateCartUi();
  openCartDrawer();
}

if (btnAddToCart) btnAddToCart.addEventListener('click', handleAddToCart);
if (mobileStickyAddBtn) mobileStickyAddBtn.addEventListener('click', handleAddToCart);

// Buy Now Button
const btnBuyNow = document.getElementById('btn-buy-now');
const checkoutModalOverlay = document.getElementById('checkout-modal-overlay');
const closeCheckoutBtn = document.getElementById('close-checkout-btn');

if (btnBuyNow) {
  btnBuyNow.addEventListener('click', () => {
    if (!currentProduct) return;

    const colorName = resolveColorName(selectedColor);
    const productToAdd = {
      ...currentProduct,
      selectedColor: colorName
    };

    // Set cart to this single item for immediate purchase or append
    cart = [{ product: productToAdd, quantity }];
    saveCartToStorage();
    updateCartUi();

    if (checkoutModalOverlay) checkoutModalOverlay.classList.remove('hidden');
  });
}

const openCheckoutModalBtn = document.getElementById('open-checkout-modal-btn');
if (openCheckoutModalBtn) {
  openCheckoutModalBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Votre panier est vide !');
      return;
    }
    closeCartDrawer();
    if (checkoutModalOverlay) checkoutModalOverlay.classList.remove('hidden');
  });
}

if (closeCheckoutBtn) {
  closeCheckoutBtn.addEventListener('click', () => {
    if (checkoutModalOverlay) checkoutModalOverlay.classList.add('hidden');
  });
}

// 6. Checkout & Payment Flow
const checkoutForm = document.getElementById('checkout-form');
const simulatorModalOverlay = document.getElementById('simulator-modal-overlay');

// Wire shipping method radio buttons in cart drawer
document.querySelectorAll('input[name="cartShippingMethod"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    selectedShippingMethod = e.target.value;
    updateCartUi();
  });
});

// Wire payment method selection to toggle credit card fields
document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const cardFields = document.getElementById('credit-card-fields');
    if (!cardFields) return;
    if (e.target.value === 'CREDIT_CARD') {
      cardFields.classList.remove('hidden');
    } else {
      cardFields.classList.add('hidden');
    }
  });
});

if (checkoutForm) {
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert('Votre panier est vide !');
      return;
    }

    const firstItem = cart[0];
    const colorTag = firstItem.product.selectedColor ? ` [${firstItem.product.selectedColor}]` : '';
    const productTitleWithVariant = `${firstItem.product.title}${colorTag}`;
    const paymentMethod = checkoutForm.querySelector('input[name="paymentMethod"]:checked')?.value || 'AIRTEL_MONEY';

    if (paymentMethod === 'CREDIT_CARD') {
      const cardNumber = document.getElementById('card-number')?.value.trim();
      const cardExpiry = document.getElementById('card-expiry')?.value.trim();
      const cardCvv = document.getElementById('card-cvv')?.value.trim();
      if (!cardNumber || !cardExpiry || !cardCvv) {
        alert('Veuillez renseigner toutes les informations de votre Carte Bancaire.');
        return;
      }
    }

    const orderData = {
      customerName: document.getElementById('checkout-name').value,
      customerPhone: document.getElementById('checkout-phone').value,
      customerNeighborhood: document.getElementById('checkout-neighborhood').value,
      productId: firstItem.product.id,
      productTitle: productTitleWithVariant,
      quantity: firstItem.quantity,
      shippingMethod: selectedShippingMethod,
      paymentMethod
    };

    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erreur lors de la commande.');
        return;
      }

      currentPendingOrder = data;

      // Close checkout modal & open simulator modal
      if (checkoutModalOverlay) checkoutModalOverlay.classList.add('hidden');
      
      document.getElementById('sim-order-number').textContent = data.orderNumber;
      document.getElementById('sim-amount').textContent = formatFCFA(data.totalAmount);
      if (simulatorModalOverlay) simulatorModalOverlay.classList.remove('hidden');

    } catch (err) {
      console.error(err);
      alert('Erreur réseau lors de la commande.');
    }
  });
}

// Simulator Confirmation
const simConfirmBtn = document.getElementById('sim-confirm-btn');
const simCloseBtn = document.getElementById('sim-close-btn');
const successModalOverlay = document.getElementById('success-modal-overlay');

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
        if (simulatorModalOverlay) simulatorModalOverlay.classList.add('hidden');

        // Empty cart
        cart = [];
        saveCartToStorage();
        updateCartUi();

        // Show success modal
        document.getElementById('success-order-num').textContent = currentPendingOrder.orderNumber;
        
        const isExp = currentPendingOrder.shippingMethod === 'express';
        const shippingLabel = isExp ? 'Colis Rapide (1 sem)' : 'Colis Normal (2 sem)';
        const paymentLabel = currentPendingOrder.paymentMethod === 'CREDIT_CARD' ? 'Carte Bancaire' : (currentPendingOrder.paymentMethod === 'MOOV_MONEY' ? 'Moov Money' : 'Airtel Money');
        const whatsappMsg = `Bonjour WuazeShop ! Je viens de régler ${formatFCFA(currentPendingOrder.totalAmount)} par ${paymentLabel} pour la commande ${currentPendingOrder.orderNumber} (${currentPendingOrder.productTitle} — Fret ${shippingLabel}). Mon quartier est ${currentPendingOrder.customerNeighborhood}. Merci de me confirmer la prise en compte pour l'achat en Chine !`;
        document.getElementById('success-whatsapp-link').href = `https://wa.me/241074001122?text=${encodeURIComponent(whatsappMsg)}`;

        if (successModalOverlay) successModalOverlay.classList.remove('hidden');
      }
    } catch (err) {
      alert('Erreur lors de la confirmation simulée.');
    }
  });
}

if (simCloseBtn) {
  simCloseBtn.addEventListener('click', () => {
    if (simulatorModalOverlay) simulatorModalOverlay.classList.add('hidden');
  });
}

const successDoneBtn = document.getElementById('success-done-btn');
if (successDoneBtn) {
  successDoneBtn.addEventListener('click', () => {
    if (successModalOverlay) successModalOverlay.classList.add('hidden');
  });
}

// Search bar in header
const searchInput = document.getElementById('product-search-input');
if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      window.location.href = `/?search=${encodeURIComponent(e.target.value.trim())}`;
    }
  });
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

// Sync dynamic WhatsApp number from CMS settings
async function syncWhatsAppLinks() {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const settings = await res.json();
      if (settings.contact_section?.whatsappNumber) {
        const clean = String(settings.contact_section.whatsappNumber).replace(/[^0-9]/g, '');
        if (clean) {
          document.querySelectorAll('a[href*="wa.me"]').forEach(a => a.href = `https://wa.me/${clean}`);
        }
      }
      if (settings.cargo_settings) {
        cargoSettings = { ...cargoSettings, ...settings.cargo_settings };
        if (currentProduct) {
          const pWeight = currentProduct.weight || 0.4;
          const normalCargoEl = document.getElementById('detail-cargo-normal-price');
          if (normalCargoEl) normalCargoEl.textContent = formatFCFA(Math.max(1000, Math.round(pWeight * (cargoSettings.normalRate || 10000))));
          const expressCargoEl = document.getElementById('detail-cargo-express-price');
          if (expressCargoEl) expressCargoEl.textContent = formatFCFA(Math.max(1000, Math.round(pWeight * (cargoSettings.expressRate || 13500))));
        }
        updateCartUi();
      }
      if (settings.announcement_bar) {
        const ab = settings.announcement_bar;
        const bar = document.getElementById('top-announcement-bar');
        if (bar) {
          if (ab.enabled === false) {
            bar.classList.add('hidden');
          } else {
            bar.classList.remove('hidden');
            const t1 = ab.text || '🇨🇳 Import direct usine Shenzhen → 🇬🇦 Gabon | Fret cargo aérien au poids exact (10 000 FCFA/kg) | Airtel, Moov & Carte Bancaire';
            const t2 = ab.secondaryText || t1;
            document.querySelectorAll('.top-announcement-text-1').forEach(el => el.textContent = t1);
            document.querySelectorAll('.top-announcement-text-2').forEach(el => el.textContent = t2);
          }
        }
      }
    }
  } catch (_) {}
}

// Initial Boot
updateCartUi();
loadProductDetails();
setupHamburgerMenu();
syncWhatsAppLinks();
