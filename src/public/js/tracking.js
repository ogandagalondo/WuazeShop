// WuazeShop Dedicated Parcel Tracking Logic
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

let cart = loadCartFromStorage();

function formatFCFA(amount) {
  return new Intl.NumberFormat('fr-FR').format(Math.max(0, amount || 0)) + ' FCFA';
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

// Cart Drawer UI
function updateCartUi() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const cartBadgeCount = document.getElementById('cart-badge-count');
  const mobileCartBadge = document.getElementById('mobile-cart-badge');
  const cartBadgeTotal = document.getElementById('cart-badge-total');
  const cartSubtotalDisplay = document.getElementById('cart-subtotal-display');
  const cartItemsContainer = document.getElementById('cart-items-container');

  if (cartBadgeCount) cartBadgeCount.textContent = totalItems;
  if (mobileCartBadge) mobileCartBadge.textContent = totalItems;
  if (cartBadgeTotal) cartBadgeTotal.textContent = formatFCFA(subtotal);
  if (cartSubtotalDisplay) cartSubtotalDisplay.textContent = formatFCFA(subtotal);

  const cartFooterContainer = document.getElementById('cart-footer-container');

  if (cartItemsContainer) {
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
    } else {
      if (cartFooterContainer) cartFooterContainer.classList.remove('hidden');
      cartItemsContainer.innerHTML = cart.map((item, index) => `
        <div class="flex items-center gap-3.5 p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-colors">
          <div class="w-14 h-14 bg-white rounded-xl p-1.5 flex items-center justify-center border border-gray-100 shrink-0">
            <img src="${item.product.image_url}" alt="${item.product.title}" class="max-h-full max-w-full object-contain"/>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-bold text-gray-900 truncate">${escapeHtml(item.product.title)}</h4>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-xs font-extrabold text-[#0d7252]">${formatFCFA(item.product.price)}</span>
            </div>
            <div class="flex items-center gap-2 mt-2">
              <div class="flex items-center border border-gray-200 bg-white rounded-lg">
                <button onclick="changeQuantity(${index}, -1)" class="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-l-lg">-</button>
                <span class="px-2 text-xs font-extrabold text-gray-800">${item.quantity}</span>
                <button onclick="changeQuantity(${index}, 1)" class="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-r-lg">+</button>
              </div>
              <button onclick="changeQuantity(${index}, -${item.quantity})" class="text-gray-400 hover:text-red-500 text-xs ml-auto transition-colors">
                <span class="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }
  }
}

window.changeQuantity = function(index, delta) {
  if (!cart[index]) return;
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  saveCartToStorage();
  updateCartUi();
};

function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (drawer && overlay) {
    overlay.classList.remove('hidden');
    drawer.classList.remove('drawer-closed');
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (drawer && overlay) {
    drawer.classList.add('drawer-closed');
    setTimeout(() => overlay.classList.add('hidden'), 250);
  }
}

// 2. Order Tracking Search & Display
async function trackOrder(orderNumber) {
  const cleanOrderNumber = (orderNumber || '').trim().toUpperCase();
  if (!cleanOrderNumber) return;

  const loading = document.getElementById('tracking-loading');
  const errorBox = document.getElementById('tracking-error');
  const errorText = document.getElementById('tracking-error-text');
  const card = document.getElementById('tracking-result-card');

  if (loading) loading.classList.remove('hidden');
  if (errorBox) errorBox.classList.add('hidden');
  if (card) card.classList.add('hidden');

  try {
    const res = await fetch(`/api/orders/${cleanOrderNumber}`);
    if (loading) loading.classList.add('hidden');

    if (!res.ok) {
      if (errorBox) {
        if (errorText) errorText.textContent = `La commande "${cleanOrderNumber}" est introuvable.`;
        errorBox.classList.remove('hidden');
      }
      return;
    }

    const order = await res.json();
    renderTrackingResult(order);
  } catch (err) {
    console.error('Erreur suivi colis:', err);
    if (loading) loading.classList.add('hidden');
    if (errorBox) {
      if (errorText) errorText.textContent = 'Impossible de contacter le serveur de suivi pour le moment.';
      errorBox.classList.remove('hidden');
    }
  }
}

function renderTrackingResult(order) {
  const card = document.getElementById('tracking-result-card');
  if (!card) return;

  const isPaid = order.paymentStatus === 'PAID';
  const statusLabels = {
    'PENDING': 'Enregistrée (Attente règlement)',
    'PAID': 'Payée • Transmise à Shenzhen',
    'PROCESSING': 'Contrôle & Préparation usine',
    'SHIPPED': 'En vol cargo international',
    'CUSTOMS_CLEARED': 'Dédouané à Libreville',
    'OUT_FOR_DELIVERY': 'En cours de livraison au quartier',
    'DELIVERED': 'Livré en main propre',
    'CANCELLED': 'Annulée'
  };

  const statusColors = {
    'PENDING': 'bg-amber-50 text-amber-800 border-amber-200',
    'PAID': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'PROCESSING': 'bg-blue-50 text-blue-800 border-blue-200',
    'SHIPPED': 'bg-purple-50 text-purple-800 border-purple-200',
    'CUSTOMS_CLEARED': 'bg-teal-50 text-teal-800 border-teal-200',
    'OUT_FOR_DELIVERY': 'bg-emerald-50 text-[#0d7252] border-emerald-200 font-black',
    'DELIVERED': 'bg-emerald-100 text-[#0d7252] border-emerald-300 font-black',
    'CANCELLED': 'bg-red-50 text-red-800 border-red-200'
  };

  const statusLabel = statusLabels[order.fulfillmentStatus || order.status] || order.status;
  const statusColor = statusColors[order.fulfillmentStatus || order.status] || 'bg-gray-100 text-gray-800 border-gray-200';

  let stepIndex = 0;
  const status = (order.fulfillmentStatus || order.status || '').toUpperCase();
  if (status === 'PAID') stepIndex = 1;
  else if (status === 'PROCESSING') stepIndex = 2;
  else if (status === 'SHIPPED') stepIndex = 3;
  else if (status === 'CUSTOMS_CLEARED') stepIndex = 4;
  else if (status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED') stepIndex = 5;

  const steps = [
    {
      title: 'Commande Enregistrée',
      desc: 'Validation et confirmation du paiement Mobile Money',
      icon: 'receipt_long'
    },
    {
      title: 'Achat & Contrôle Qualité à Shenzhen',
      desc: 'Inspection d\'usine et scellement d\'origine',
      icon: 'inventory_2'
    },
    {
      title: 'Fret Aérien International',
      desc: 'Transit cargo aérien sécurisé Shenzhen → Libreville',
      icon: 'flight_takeoff'
    },
    {
      title: 'Arrivée à Libreville & Dédouanement',
      desc: 'Formalités douanières complètes prises en charge',
      icon: 'domain'
    },
    {
      title: 'Livraison au Quartier / Retrait Point Relais',
      desc: 'Remise en main propre par coursier ou retrait à Glass',
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

  const whatsappInquiryUrl = `https://wa.me/241074001122?text=${encodeURIComponent(`Bonjour WuazeShop Gabon, je consulte le suivi de ma commande ${order.orderNumber} (${order.productTitle}) pour livraison à ${order.customerNeighborhood}. Pouvez-vous me donner l'état d'avancement du vol cargo ?`)}`;

  card.innerHTML = `
    <!-- Top Summary Row -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-gray-100 gap-3">
      <div>
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-base sm:text-lg font-black text-gray-900 tracking-tight">${escapeHtml(order.orderNumber)}</span>
          <span class="px-3 py-1 rounded-full text-xs font-extrabold ${statusColor} border">
            ${statusLabel}
          </span>
        </div>
        <p class="text-xs text-gray-400 mt-1">Enregistrée le ${orderDate}</p>
      </div>

      <div class="flex items-center gap-2">
        ${isPaid 
          ? `<span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#e6f7f0] text-[#0d7252] border border-emerald-200">
               <span class="material-symbols-outlined text-sm">verified</span>
               <span>Paiement validé</span>
             </span>`
          : `<span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
               <span class="material-symbols-outlined text-sm">hourglass_top</span>
               <span>En attente de règlement</span>
             </span>`
        }
      </div>
    </div>

    <!-- Product & Customer Details Card -->
    <div class="bg-gray-50/90 rounded-2xl p-4 sm:p-5 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
      <div class="space-y-1.5">
        <span class="text-gray-400 block font-semibold uppercase tracking-wider text-[10px]">Article Commandé :</span>
        <p class="font-extrabold text-gray-900 text-sm leading-snug">${escapeHtml(order.productTitle)}</p>
        <p class="text-gray-600">
          Quantité : <strong class="text-gray-900">${order.quantity}</strong> &bull; Total réglé : <strong class="text-[#0d7252] font-black">${formatFCFA(order.totalAmount)}</strong>
        </p>
        <p class="text-gray-500">Moyen : <strong>${order.paymentMethod || 'Mobile Money Gabon'}</strong></p>
      </div>

      <div class="space-y-1.5 sm:border-l sm:border-gray-200 sm:pl-4">
        <span class="text-gray-400 block font-semibold uppercase tracking-wider text-[10px]">Destinataire &amp; Lieu de Livraison :</span>
        <p class="font-extrabold text-gray-900 text-sm">${escapeHtml(order.customerName)}</p>
        <p class="text-gray-600 flex items-center gap-1">
          <span class="material-symbols-outlined text-sm text-[#0d7252]">location_on</span>
          <span>${escapeHtml(order.customerNeighborhood || 'Libreville, Gabon')}</span>
        </p>
        <p class="text-gray-500 flex items-center gap-1">
          <span class="material-symbols-outlined text-sm text-gray-400">call</span>
          <span>${escapeHtml(order.customerPhone || 'N/A')}</span>
        </p>
      </div>
    </div>

    <!-- Step-by-Step Logistics Stepper -->
    <div class="pt-2">
      <div class="flex items-center justify-between mb-5">
        <h4 class="text-xs uppercase font-extrabold tracking-wider text-gray-400 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-base text-[#0d7252]">route</span>
          <span>Acheminement Logistique (Shenzhen &rarr; Libreville)</span>
        </h4>
        <span class="text-[10px] font-bold text-[#0d7252] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          Délai : 1 à 2 semaines selon formule
        </span>
      </div>

      <div class="relative pl-6 sm:pl-8 space-y-6 sm:space-y-7 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
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
    <div class="pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="text-center sm:text-left">
        <span class="text-xs font-bold text-gray-800 block">Une question sur ce colis ou le dédouanement ?</span>
        <span class="text-[11px] text-gray-400">Notre équipe logistique à Libreville vous répond directement.</span>
      </div>
      <a href="${whatsappInquiryUrl}" target="_blank" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold transition-all shadow-md active:scale-95 shrink-0">
        <span class="material-symbols-outlined text-base">chat</span>
        <span>Contacter notre conseiller WhatsApp</span>
      </a>
    </div>
  `;

  card.classList.remove('hidden');
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  updateCartUi();
  setupHamburgerMenu();
  syncTrackingSettings();

  const cartToggleBtn = document.getElementById('cart-toggle-btn');
  const mobileCartBtn = document.getElementById('mobile-cart-btn');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');

  if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCartDrawer);
  if (mobileCartBtn) mobileCartBtn.addEventListener('click', openCartDrawer);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);
  if (cartDrawerOverlay) cartDrawerOverlay.addEventListener('click', closeCartDrawer);

  document.addEventListener('click', (e) => {
    const link = e.target.closest('.continue-shopping-action');
    if (link) {
      closeCartDrawer();
    }
  });

  const searchForm = document.getElementById('tracking-search-form');
  const searchInput = document.getElementById('tracking-search-input');

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      trackOrder(searchInput.value);
    });
  }

  // Check URL query params ?ref=WZ-XXXXXX or ?track=WZ-XXXXXX
  const urlParams = new URLSearchParams(window.location.search);
  const ref = urlParams.get('ref') || urlParams.get('track');
  if (ref && searchInput) {
    searchInput.value = ref;
    trackOrder(ref);
  }
});

async function syncTrackingSettings() {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const settings = await res.json();
      if (settings.announcement_bar) {
        const ab = settings.announcement_bar;
        const bar = document.getElementById('top-announcement-bar');
        if (bar) {
          if (ab.enabled === false) {
            bar.classList.add('hidden');
          } else {
            bar.classList.remove('hidden');
            const t1 = ab.text || '🇨🇳 Import direct usine Shenzhen → 🇬🇦 Gabon | Fret cargo aérien inclus | Paiement sécurisé Mobile Money';
            const t2 = ab.secondaryText || t1;
            document.querySelectorAll('.top-announcement-text-1').forEach(el => el.textContent = t1);
            document.querySelectorAll('.top-announcement-text-2').forEach(el => el.textContent = t2);
          }
        }
      }
    }
  } catch (_) {}
}

