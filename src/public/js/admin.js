// WuazeShop Admin CMS & Dashboard Logic (Mobile-First)
let adminToken = sessionStorage.getItem('wuazeshop_admin_token') || null;
let currentOrders = [];
let currentAdminProducts = [];
let activeOrderFilter = 'all';
let activeCatFilter = 'all';
let selectedOrderForStatus = null;

// DOM Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const adminHeaderActions = document.getElementById('admin-header-actions');
const adminMobileNav = document.getElementById('admin-mobile-nav');

// Forms & Modals
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const adminLogoutBtn = document.getElementById('admin-logout-btn');

// Tabs
const tabOrdersBtn = document.getElementById('tab-orders-btn');
const tabProductsBtn = document.getElementById('tab-products-btn');
const tabCmsBtn = document.getElementById('tab-cms-btn');
const tabOrdersContent = document.getElementById('tab-orders-content');
const tabProductsContent = document.getElementById('tab-products-content');
const tabCmsContent = document.getElementById('tab-cms-content');
const mobileTabOrdersBtn = document.getElementById('mobile-tab-orders-btn');
const mobileTabProductsBtn = document.getElementById('mobile-tab-products-btn');
const mobileTabCmsBtn = document.getElementById('mobile-tab-cms-btn');
const mobileAddProductBtn = document.getElementById('mobile-add-product-btn');

// Stats
const statTotalRevenue = document.getElementById('stat-total-revenue');
const statClearedCount = document.getElementById('stat-cleared-count');
const statPendingCount = document.getElementById('stat-pending-count');
const statProductsCount = document.getElementById('stat-products-count');
const tabOrdersBadge = document.getElementById('tab-orders-badge');
const tabProductsBadge = document.getElementById('tab-products-badge');

// Product Modal Elements
const openAddProductBtn = document.getElementById('open-add-product-btn');
const productModalOverlay = document.getElementById('product-modal-overlay');
const closeProductModalBtn = document.getElementById('close-product-modal-btn');
const cancelProductModalBtn = document.getElementById('cancel-product-modal-btn');
const productForm = document.getElementById('product-form');
const productModalTitle = document.getElementById('product-modal-title');
const productEditId = document.getElementById('product-edit-id');
const prodDescription = document.getElementById('prod-description');
const prodImageFile = document.getElementById('prod-image-file');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const uploadPreviewContainer = document.getElementById('upload-preview-container');
const uploadPreviewImg = document.getElementById('upload-preview-img');
const uploadFileName = document.getElementById('upload-file-name');
const uploadStatus = document.getElementById('upload-status');
const removeUploadedImageBtn = document.getElementById('remove-uploaded-image-btn');
const toggleUrlInputBtn = document.getElementById('toggle-url-input-btn');
const urlInputContainer = document.getElementById('url-input-container');
const prodImageUrlManual = document.getElementById('prod-image-url-manual');
const prodImageUrl = document.getElementById('prod-image-url');
let isUploadingImage = false;

// Status Modal Elements
const statusModalOverlay = document.getElementById('status-modal-overlay');
const closeStatusModalBtn = document.getElementById('close-status-modal-btn');
const statusOrderNum = document.getElementById('status-order-num');
const statusOrderClient = document.getElementById('status-order-client');
const updateFulfillmentStatus = document.getElementById('update-fulfillment-status');
const updatePaymentStatus = document.getElementById('update-payment-status');
const saveStatusBtn = document.getElementById('save-status-btn');

// Containers
const ordersCardsContainer = document.getElementById('orders-cards-container');
const adminProductsGrid = document.getElementById('admin-products-grid');

// Helpers
function formatFCFA(amount) {
  return new Intl.NumberFormat('fr-FR').format(amount || 0) + ' FCFA';
}

function cleanPhoneForWhatsApp(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '241' + cleaned.slice(1);
  } else if (!cleaned.startsWith('241') && cleaned.length <= 9) {
    cleaned = '241' + cleaned;
  }
  return cleaned;
}

// 1. Initial Auth Check
async function checkAuth() {
  if (!adminToken) {
    showLogin();
    return;
  }

  try {
    const res = await fetch('/api/admin/me', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.ok) {
      showDashboard();
      await loadDashboardData();
    } else {
      sessionStorage.removeItem('wuazeshop_admin_token');
      adminToken = null;
      showLogin();
    }
  } catch (err) {
    console.error('Erreur vérification auth admin:', err);
    showLogin();
  }
}

function showLogin() {
  loginSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
  adminHeaderActions.classList.add('hidden');
  adminMobileNav.classList.add('hidden');
}

function showDashboard() {
  loginSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  adminHeaderActions.classList.remove('hidden');
  adminMobileNav.classList.remove('hidden');
}

// 2. Login Form Submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');

  const emailEl = document.getElementById('login-email') || document.getElementById('login-username');
  const identifier = emailEl ? emailEl.value.trim() : '';
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, username: identifier, password })
    });

    const data = await res.json();
    if (!res.ok) {
      loginError.textContent = data.error || 'Identifiant ou mot de passe incorrect';
      loginError.classList.remove('hidden');
      return;
    }

    adminToken = data.token;
    sessionStorage.setItem('wuazeshop_admin_token', adminToken);
    showDashboard();
    await loadDashboardData();
  } catch (err) {
    loginError.textContent = 'Erreur réseau lors de la connexion';
    loginError.classList.remove('hidden');
  }
});

// Logout
adminLogoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem('wuazeshop_admin_token');
  adminToken = null;
  showLogin();
});

// 3. Tab Switching
function switchTab(tab) {
  const allBtns = [tabOrdersBtn, tabProductsBtn, tabCmsBtn].filter(Boolean);
  allBtns.forEach(btn => {
    btn.classList.remove('active', 'bg-[#0d7252]', 'text-white');
    btn.classList.add('text-gray-500');
  });

  if (tabOrdersContent) tabOrdersContent.classList.add('hidden');
  if (tabProductsContent) tabProductsContent.classList.add('hidden');
  if (tabCmsContent) tabCmsContent.classList.add('hidden');

  const allMobileBtns = [mobileTabOrdersBtn, mobileTabProductsBtn, mobileTabCmsBtn].filter(Boolean);
  allMobileBtns.forEach(btn => {
    btn.classList.remove('text-[#0d7252]', 'font-bold');
    btn.classList.add('text-gray-400');
  });

  if (tab === 'orders') {
    tabOrdersBtn.classList.add('active', 'bg-[#0d7252]', 'text-white');
    tabOrdersBtn.classList.remove('text-gray-500');
    tabOrdersContent.classList.remove('hidden');
    if (mobileTabOrdersBtn) {
      mobileTabOrdersBtn.classList.add('text-[#0d7252]', 'font-bold');
      mobileTabOrdersBtn.classList.remove('text-gray-400');
    }
  } else if (tab === 'products') {
    tabProductsBtn.classList.add('active', 'bg-[#0d7252]', 'text-white');
    tabProductsBtn.classList.remove('text-gray-500');
    tabProductsContent.classList.remove('hidden');
    if (mobileTabProductsBtn) {
      mobileTabProductsBtn.classList.add('text-[#0d7252]', 'font-bold');
      mobileTabProductsBtn.classList.remove('text-gray-400');
    }
  } else if (tab === 'cms') {
    if (tabCmsBtn) {
      tabCmsBtn.classList.add('active', 'bg-[#0d7252]', 'text-white');
      tabCmsBtn.classList.remove('text-gray-500');
    }
    if (tabCmsContent) tabCmsContent.classList.remove('hidden');
    if (mobileTabCmsBtn) {
      mobileTabCmsBtn.classList.add('text-[#0d7252]', 'font-bold');
      mobileTabCmsBtn.classList.remove('text-gray-400');
    }
    loadAdminSettings();
  }
}

tabOrdersBtn.addEventListener('click', () => switchTab('orders'));
tabProductsBtn.addEventListener('click', () => switchTab('products'));
if (tabCmsBtn) tabCmsBtn.addEventListener('click', () => switchTab('cms'));
mobileTabOrdersBtn.addEventListener('click', () => switchTab('orders'));
mobileTabProductsBtn.addEventListener('click', () => switchTab('products'));
if (mobileTabCmsBtn) mobileTabCmsBtn.addEventListener('click', () => switchTab('cms'));

// 4. Load Data
async function loadDashboardData() {
  await Promise.all([loadOrders(), loadAdminProducts(), loadAdminSettings()]);
}

async function loadOrders() {
  try {
    const res = await fetch('/api/admin/orders', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.ok) {
      currentOrders = await res.json();
      updateStats();
      renderOrders();
    }
  } catch (err) {
    console.error('Erreur chargement commandes:', err);
  }
}

async function loadAdminProducts() {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      currentAdminProducts = await res.json();
      updateStats();
      renderAdminProducts();
    }
  } catch (err) {
    console.error('Erreur chargement produits admin:', err);
  }
}

function updateStats() {
  const clearedOrders = currentOrders.filter(o => (o.paymentStatus || o.payment_status) === 'CONFIRMED_CLEARED');
  const pendingOrders = currentOrders.filter(o => (o.paymentStatus || o.payment_status) === 'PENDING_PAYMENT');
  const totalRevenue = clearedOrders.reduce((sum, o) => sum + (o.totalAmount || o.total_amount || 0), 0);

  statTotalRevenue.textContent = formatFCFA(totalRevenue);
  statClearedCount.textContent = clearedOrders.length;
  statPendingCount.textContent = pendingOrders.length;
  statProductsCount.textContent = currentAdminProducts.length;

  tabOrdersBadge.textContent = currentOrders.length;
  tabProductsBadge.textContent = currentAdminProducts.length;
}

// 5. Render Orders (Cards Mobile-First)
function renderOrders() {
  let filtered = currentOrders;

  // Filter pill
  if (activeOrderFilter === 'CLEARED') {
    filtered = filtered.filter(o => (o.paymentStatus || o.payment_status) === 'CONFIRMED_CLEARED');
  } else if (activeOrderFilter === 'PENDING') {
    filtered = filtered.filter(o => (o.paymentStatus || o.payment_status) === 'PENDING_PAYMENT');
  } else if (activeOrderFilter === 'SHIPPED') {
    filtered = filtered.filter(o => ['IN_PREPARATION_CHINA', 'SHIPPED_GABON', 'ARRIVED_LIBREVILLE'].includes(o.fulfillmentStatus || o.fulfillment_status));
  }

  // Search input
  const query = document.getElementById('orders-search-input')?.value.toLowerCase().trim();
  if (query) {
    filtered = filtered.filter(o => {
      const orderNum = (o.orderNumber || o.order_number || '').toLowerCase();
      const clientName = (o.customerName || o.customer_name || '').toLowerCase();
      const phone = (o.customerPhone || o.customer_phone || '').toLowerCase();
      const hood = (o.customerNeighborhood || o.customer_neighborhood || '').toLowerCase();
      return orderNum.includes(query) || clientName.includes(query) || phone.includes(query) || hood.includes(query);
    });
  }

  if (filtered.length === 0) {
    ordersCardsContainer.innerHTML = `
      <div class="text-center py-10 bg-surface rounded-2xl border border-surface-border p-6 text-outline">
        <span class="material-symbols-outlined text-4xl mb-2 text-outline">inbox</span>
        <p class="text-xs sm:text-sm font-semibold text-on-surface">Aucune commande ne correspond aux critères.</p>
      </div>
    `;
    return;
  }

  ordersCardsContainer.innerHTML = filtered.map(order => {
    const orderNum = order.orderNumber || order.order_number;
    const clientName = order.customerName || order.customer_name;
    const clientPhone = order.customerPhone || order.customer_phone;
    const neighborhood = order.customerNeighborhood || order.customer_neighborhood || 'Libreville';
    const paymentStatus = order.paymentStatus || order.payment_status;
    const fulfillmentStatus = order.fulfillmentStatus || order.fulfillment_status;
    const totalAmount = order.totalAmount || order.total_amount || 0;
    const createdAt = order.createdAt || order.created_at;

    const isCleared = paymentStatus === 'CONFIRMED_CLEARED';
    const isPending = paymentStatus === 'PENDING_PAYMENT' || paymentStatus === 'PENDING';
    
    // Payment badge
    let paymentBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">${paymentStatus}</span>`;
    if (isCleared) {
      paymentBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#d1fae5] text-[#065f46] flex items-center gap-1">
        <span class="material-symbols-outlined text-[13px]">check_circle</span>
        ENCAISSÉ 100%
      </span>`;
    } else if (isPending) {
      paymentBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 flex items-center gap-1 border border-amber-200">
        <span class="material-symbols-outlined text-[13px]">hourglass_top</span>
        En attente Mobile Money
      </span>`;
    }

    // Fulfillment label
    let fulfillmentLabel = 'En attente confirmation';
    let fulfillmentBadgeClass = 'bg-surface-low text-outline';
    if (fulfillmentStatus === 'IN_PREPARATION_CHINA') {
      fulfillmentLabel = '🇨🇳 En préparation Chine';
      fulfillmentBadgeClass = 'bg-blue-50 text-blue-700 border border-blue-200 font-bold';
    } else if (fulfillmentStatus === 'SHIPPED_GABON') {
      fulfillmentLabel = '✈️ En vol vers Gabon';
      fulfillmentBadgeClass = 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold';
    } else if (fulfillmentStatus === 'ARRIVED_LIBREVILLE') {
      fulfillmentLabel = '🇬🇦 Arrivé Libreville';
      fulfillmentBadgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold';
    } else if (fulfillmentStatus === 'DELIVERED') {
      fulfillmentLabel = '✅ Livré au client';
      fulfillmentBadgeClass = 'bg-green-100 text-green-800 font-bold';
    }

    // Items list
    const items = order.items && order.items.length > 0 
      ? order.items 
      : [{
          quantity: order.quantity || 1,
          title: order.productTitle || order.product_title || 'Article commandé',
          price: totalAmount / (order.quantity || 1)
        }];

    const itemsHtml = items.map(item => `
      <div class="flex items-center justify-between text-xs py-1 border-b border-surface-low last:border-0">
        <div class="flex items-center gap-2 truncate">
          <span class="w-5 h-5 rounded bg-surface-low flex items-center justify-center font-bold text-[10px] shrink-0">${item.quantity}x</span>
          <span class="truncate text-on-surface">${item.title}</span>
        </div>
        <span class="font-bold text-on-surface shrink-0 ml-2">${formatFCFA(item.price * item.quantity)}</span>
      </div>
    `).join('');

    // WhatsApp Direct Link
    const cleanPhone = cleanPhoneForWhatsApp(clientPhone);
    const waMessage = `Bonjour ${clientName}, c'est l'équipe WuazeShop concernant votre commande ${orderNum} (${formatFCFA(totalAmount)}). Statut actuel : ${fulfillmentLabel}.`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

    return `
      <div class="bg-surface rounded-2xl p-4 sm:p-5 border border-surface-border shadow-sm space-y-3 transition-all hover:shadow-md">
        <!-- Card Header: Order Number & Payment Badge -->
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-surface-low">
          <div class="flex items-center gap-2">
            <span class="font-black text-sm text-primary tracking-tight">${orderNum}</span>
            <span class="text-[10px] text-outline">${new Date(createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div>${paymentBadge}</div>
        </div>

        <!-- Customer Info & Neighborhood -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div class="space-y-1">
            <div class="flex items-center gap-1.5 font-bold text-on-surface">
              <span class="material-symbols-outlined text-outline text-[16px]">person</span>
              <span>${clientName}</span>
            </div>
            <div class="flex items-center gap-1.5 text-on-surface-variant">
              <span class="material-symbols-outlined text-outline text-[16px]">location_on</span>
              <span>Quartier : <strong>${neighborhood}</strong></span>
            </div>
          </div>

          <div class="flex flex-col sm:items-end justify-between gap-1.5">
            <div class="flex items-center gap-2">
              <span class="text-outline text-[11px]">Contact :</span>
              <a href="tel:${clientPhone}" class="font-bold text-on-surface hover:text-primary">${clientPhone}</a>
            </div>
            <a href="${waUrl}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-[11px] font-bold shadow-sm transition-all w-fit">
              <span class="material-symbols-outlined text-[15px]">chat</span>
              <span>Ouvrir WhatsApp</span>
            </a>
          </div>
        </div>

        <!-- Ordered Items Box -->
        <div class="bg-surface-low rounded-xl p-2.5 sm:p-3 border border-surface-border">
          <div class="text-[10px] uppercase font-bold text-outline mb-1">Articles commandés :</div>
          ${itemsHtml}
          <div class="pt-2 mt-1 border-t border-surface-border flex justify-between items-center text-xs">
            <span class="font-semibold text-outline">Total Commande :</span>
            <span class="font-black text-sm text-primary">${formatFCFA(totalAmount)}</span>
          </div>
        </div>

        <!-- Card Footer: Fulfillment Status & Action -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div class="flex items-center gap-1.5">
            <span class="text-[11px] text-outline">Expédition :</span>
            <span class="px-2.5 py-1 rounded-xl text-xs ${fulfillmentBadgeClass}">${fulfillmentLabel}</span>
          </div>

          <button onclick="openStatusModal('${orderNum}', '${clientName}', '${fulfillmentStatus}', '${paymentStatus}')" class="px-3 py-1.5 rounded-xl bg-surface-low hover:bg-surface-border text-on-surface text-xs font-bold border border-surface-border flex items-center gap-1 transition-colors">
            <span class="material-symbols-outlined text-[15px]">edit</span>
            <span>Mettre à jour statut</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Order Filter Pills
document.querySelectorAll('.order-filter-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.order-filter-pill').forEach(b => {
      b.classList.remove('active', 'bg-[#0d7252]', 'text-white');
      b.classList.add('bg-gray-100', 'text-gray-600');
    });
    
    btn.classList.add('active', 'bg-[#0d7252]', 'text-white');
    btn.classList.remove('bg-gray-100', 'text-gray-600');
    
    activeOrderFilter = btn.getAttribute('data-order-filter');
    renderOrders();
  });
});

document.getElementById('orders-search-input')?.addEventListener('input', () => {
  renderOrders();
});

// 6. Status Modal Logic
window.openStatusModal = function(orderNum, clientName, currentFulfillment, currentPayment) {
  selectedOrderForStatus = orderNum;
  statusOrderNum.textContent = orderNum;
  statusOrderClient.textContent = clientName;
  updateFulfillmentStatus.value = currentFulfillment || 'PENDING_CLEARANCE';
  updatePaymentStatus.value = currentPayment || 'PENDING_PAYMENT';
  statusModalOverlay.classList.remove('hidden');
};

closeStatusModalBtn.addEventListener('click', () => {
  statusModalOverlay.classList.add('hidden');
});

saveStatusBtn.addEventListener('click', async () => {
  if (!selectedOrderForStatus) return;

  const fulfillmentStatus = updateFulfillmentStatus.value;
  const paymentStatus = updatePaymentStatus.value;

  try {
    const res = await fetch(`/api/admin/orders/${selectedOrderForStatus}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ fulfillmentStatus, paymentStatus })
    });

    if (res.ok) {
      statusModalOverlay.classList.add('hidden');
      await loadOrders();
    } else {
      alert('Erreur lors de la mise à jour du statut.');
    }
  } catch (err) {
    console.error('Erreur save status:', err);
    alert('Erreur réseau lors de la mise à jour.');
  }
});

// 7. Render Admin Products
function renderAdminProducts() {
  let filtered = currentAdminProducts;

  if (activeCatFilter !== 'all') {
    filtered = filtered.filter(p => p.category === activeCatFilter);
  }

  const query = document.getElementById('admin-product-search-input')?.value.toLowerCase().trim();
  if (query) {
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.category.toLowerCase().includes(query)
    );
  }

  if (filtered.length === 0) {
    adminProductsGrid.innerHTML = `
      <div class="col-span-full text-center py-10 bg-surface rounded-2xl border border-surface-border p-6 text-outline">
        <span class="material-symbols-outlined text-4xl mb-2 text-outline">category</span>
        <p class="text-xs sm:text-sm font-semibold text-on-surface">Aucun article ne correspond à votre filtre.</p>
      </div>
    `;
    return;
  }

  adminProductsGrid.innerHTML = filtered.map(prod => {
    const specsSummary = (prod.specs || []).slice(0, 2).join(' • ');
    return `
      <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md transition-all">
        <div class="flex gap-3">
          <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1.5 border border-gray-100">
            <img class="w-full h-full object-contain" src="${prod.image_url}" alt="${prod.title}"/>
          </div>
          <div class="flex-1 min-w-0">
            <span class="uppercase tracking-wider font-extrabold text-[10px] text-[#0d7252] block mb-0.5">${prod.category}</span>
            <h4 class="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 leading-snug">${prod.title}</h4>
            <div class="text-[10px] text-gray-400 truncate mt-0.5">${prod.description ? prod.description : (specsSummary || 'Origine Chine Neuf')}</div>
            <div class="mt-1.5 font-extrabold text-xs sm:text-sm text-[#0d7252]">${formatFCFA(prod.price)}</div>
          </div>
        </div>

        <div class="pt-2 border-t border-gray-100 flex gap-2">
          <button onclick="openEditProductModal(${prod.id})" class="flex-1 py-1.5 px-3 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors">
            <span class="material-symbols-outlined text-[15px]">edit</span>
            <span>Modifier</span>
          </button>
          <button onclick="deleteProduct(${prod.id})" class="py-1.5 px-3 rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center transition-colors" title="Archiver le produit">
            <span class="material-symbols-outlined text-[15px]">delete</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Category Filter Pills
document.querySelectorAll('.admin-cat-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-cat-pill').forEach(b => {
      b.classList.remove('active', 'bg-[#0d7252]', 'text-white');
      b.classList.add('bg-gray-100', 'text-gray-600');
    });

    btn.classList.add('active', 'bg-[#0d7252]', 'text-white');
    btn.classList.remove('bg-gray-100', 'text-gray-600');

    activeCatFilter = btn.getAttribute('data-cat-filter');
    renderAdminProducts();
  });
});

document.getElementById('admin-product-search-input')?.addEventListener('input', () => {
  renderAdminProducts();
});

// 8. Add / Edit Product Modal Logic
async function handleImageFileSelection(file) {
  if (!file) return;

  if (file.size > 25 * 1024 * 1024) {
    alert('Le fichier est trop volumineux (maximum 25 Mo).');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    uploadPreviewImg.src = base64Data;
    uploadFileName.textContent = file.name;
    uploadStatus.innerHTML = `
      <span class="material-symbols-outlined text-[13px] text-blue-600 animate-spin">sync</span>
      <span class="text-blue-600">Téléversement en cours...</span>
    `;
    uploadPlaceholder.classList.add('hidden');
    uploadPreviewContainer.classList.remove('hidden');

    try {
      isUploadingImage = true;
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          image: base64Data,
          filename: file.name
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        prodImageUrl.value = data.imageUrl;
        prodImageUrlManual.value = data.imageUrl;
        uploadStatus.innerHTML = `
          <span class="material-symbols-outlined text-[13px] text-green-600">check_circle</span>
          <span class="text-green-700">Photo prête et enregistrée</span>
        `;
      } else {
        uploadStatus.innerHTML = `
          <span class="material-symbols-outlined text-[13px] text-red-500">error</span>
          <span class="text-red-600">Échec envoi (${data.error || 'Erreur'})</span>
        `;
        alert(`Erreur lors du téléversement: ${data.error || 'Erreur inconnue'}`);
      }
    } catch (err) {
      console.error('Erreur upload:', err);
      uploadStatus.innerHTML = `
        <span class="material-symbols-outlined text-[13px] text-red-500">error</span>
        <span class="text-red-600">Erreur réseau</span>
      `;
      alert('Erreur réseau lors du téléversement de la photo.');
    } finally {
      isUploadingImage = false;
    }
  };
  reader.readAsDataURL(file);
}

if (prodImageFile) {
  prodImageFile.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      handleImageFileSelection(file);
    }
  });
}

if (removeUploadedImageBtn) {
  removeUploadedImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (prodImageFile) prodImageFile.value = '';
    prodImageUrl.value = '';
    prodImageUrlManual.value = '';
    uploadPreviewImg.src = '';
    uploadPreviewContainer.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
  });
}

if (toggleUrlInputBtn && urlInputContainer) {
  toggleUrlInputBtn.addEventListener('click', () => {
    urlInputContainer.classList.toggle('hidden');
    if (!urlInputContainer.classList.contains('hidden')) {
      prodImageUrlManual.focus();
    }
  });
}

if (prodImageUrlManual) {
  prodImageUrlManual.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    prodImageUrl.value = val;
    if (val) {
      uploadPreviewImg.src = val;
      uploadFileName.textContent = 'Image URL externe';
      uploadStatus.innerHTML = `
        <span class="material-symbols-outlined text-[13px] text-green-600">link</span>
        <span class="text-green-700">Lien web configuré</span>
      `;
      uploadPlaceholder.classList.add('hidden');
      uploadPreviewContainer.classList.remove('hidden');
    } else {
      uploadPreviewContainer.classList.add('hidden');
      uploadPlaceholder.classList.remove('hidden');
    }
  });
}

function openProductModal(isEdit = false, productData = null) {
  productForm.reset();
  if (prodImageFile) prodImageFile.value = '';
  prodImageUrl.value = '';
  prodImageUrlManual.value = '';
  uploadPreviewImg.src = '';
  uploadPreviewContainer.classList.add('hidden');
  uploadPlaceholder.classList.remove('hidden');
  if (urlInputContainer) urlInputContainer.classList.add('hidden');

  if (isEdit && productData) {
    productModalTitle.textContent = 'Modifier le produit';
    productEditId.value = productData.id;
    document.getElementById('prod-title').value = productData.title;
    if (prodDescription) prodDescription.value = productData.description || '';
    document.getElementById('prod-category').value = productData.category;
    document.getElementById('prod-price').value = productData.price;
    document.getElementById('prod-original-price').value = productData.original_price || '';
    document.getElementById('prod-instock').checked = productData.in_stock === 1;
    document.getElementById('prod-specs').value = (productData.specs || []).join(', ');
    document.getElementById('prod-colors').value = (productData.colors || []).join(', ');

    if (productData.image_url) {
      prodImageUrl.value = productData.image_url;
      prodImageUrlManual.value = productData.image_url;
      uploadPreviewImg.src = productData.image_url;
      uploadFileName.textContent = productData.title || 'Photo produit';
      uploadStatus.innerHTML = `
        <span class="material-symbols-outlined text-[13px] text-green-600">check_circle</span>
        <span class="text-green-700">Photo actuelle du produit</span>
      `;
      uploadPlaceholder.classList.add('hidden');
      uploadPreviewContainer.classList.remove('hidden');
    }
  } else {
    productModalTitle.textContent = 'Ajouter un produit (Import Chine)';
    productEditId.value = '';
    if (prodDescription) prodDescription.value = '';
    document.getElementById('prod-instock').checked = true;
  }
  productModalOverlay.classList.remove('hidden');
}

openAddProductBtn.addEventListener('click', () => openProductModal(false));
mobileAddProductBtn?.addEventListener('click', () => openProductModal(false));
closeProductModalBtn.addEventListener('click', () => productModalOverlay.classList.add('hidden'));
cancelProductModalBtn.addEventListener('click', () => productModalOverlay.classList.add('hidden'));

window.openEditProductModal = function(productId) {
  const product = currentAdminProducts.find(p => p.id === productId);
  if (product) openProductModal(true, product);
};

// Delete / Archive Product
window.deleteProduct = async function(productId) {
  if (!confirm('Confirmez-vous le retrait de ce produit du catalogue ?')) return;

  try {
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.ok) {
      await loadAdminProducts();
    } else {
      alert('Impossible d’archiver le produit.');
    }
  } catch (err) {
    console.error('Erreur suppression produit:', err);
    alert('Erreur réseau.');
  }
};

// Product Form Submit
productForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (isUploadingImage) {
    alert('Veuillez patienter pendant la fin du téléversement de la photo.');
    return;
  }

  const id = productEditId.value;
  const title = document.getElementById('prod-title').value.trim();
  const description = prodDescription ? prodDescription.value.trim() : '';
  const category = document.getElementById('prod-category').value;
  const price = Number(document.getElementById('prod-price').value);
  const originalPriceVal = document.getElementById('prod-original-price').value;
  const originalPrice = originalPriceVal ? Number(originalPriceVal) : null;
  const inStock = document.getElementById('prod-instock').checked;
  const imageUrl = prodImageUrl.value.trim();
  const specsRaw = document.getElementById('prod-specs').value;
  const specs = specsRaw ? specsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const colorsRaw = document.getElementById('prod-colors').value;
  const colors = colorsRaw ? colorsRaw.split(',').map(c => c.trim()).filter(Boolean) : [];

  if (!imageUrl) {
    alert('Veuillez téléverser une photo ou renseigner une URL pour ce produit.');
    return;
  }

  const payload = { title, description, category, price, originalPrice, imageUrl, specs, colors, inStock };

  try {
    const url = id ? `/api/admin/products/${id}` : '/api/admin/products';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      productModalOverlay.classList.add('hidden');
      await loadAdminProducts();
    } else {
      const errData = await res.json();
      alert(`Erreur: ${errData.error || 'Impossible d’enregistrer le produit'}`);
    }
  } catch (err) {
    console.error('Erreur enregistrement produit:', err);
    alert('Erreur réseau lors de l’enregistrement');
  }
});

// 9. CMS Vitrine Management Logic
let currentCmsSettings = {};

function flashCmsSaved(indicatorId) {
  const el = document.getElementById(indicatorId);
  if (!el) return;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3500);
}

async function loadAdminSettings() {
  if (!adminToken) return;
  try {
    const res = await fetch('/api/admin/settings', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!res.ok) return;
    currentCmsSettings = await res.json();

    // 1. Hero
    if (currentCmsSettings.hero_section) {
      const h = currentCmsSettings.hero_section;
      if (document.getElementById('cms-hero-badge')) document.getElementById('cms-hero-badge').value = h.badge || '';
      if (document.getElementById('cms-hero-title')) document.getElementById('cms-hero-title').value = h.title || '';
      if (document.getElementById('cms-hero-subtitle')) document.getElementById('cms-hero-subtitle').value = h.subtitle || '';
      if (document.getElementById('cms-hero-cta-text')) document.getElementById('cms-hero-cta-text').value = h.ctaText || '';
      if (document.getElementById('cms-hero-cta-link')) document.getElementById('cms-hero-cta-link').value = h.ctaLink || '';
      if (document.getElementById('cms-hero-img-url')) document.getElementById('cms-hero-img-url').value = h.imageUrl || '';
      if (document.getElementById('cms-hero-preview-img') && h.imageUrl) document.getElementById('cms-hero-preview-img').src = h.imageUrl;
      if (document.getElementById('cms-hero-prop1-title')) document.getElementById('cms-hero-prop1-title').value = h.prop1Title || '';
      if (document.getElementById('cms-hero-prop1-sub')) document.getElementById('cms-hero-prop1-sub').value = h.prop1Sub || '';
      if (document.getElementById('cms-hero-prop2-title')) document.getElementById('cms-hero-prop2-title').value = h.prop2Title || '';
      if (document.getElementById('cms-hero-prop2-sub')) document.getElementById('cms-hero-prop2-sub').value = h.prop2Sub || '';
      if (document.getElementById('cms-hero-prop3-title')) document.getElementById('cms-hero-prop3-title').value = h.prop3Title || '';
      if (document.getElementById('cms-hero-prop3-sub')) document.getElementById('cms-hero-prop3-sub').value = h.prop3Sub || '';
    }

    // 2. Promo
    if (currentCmsSettings.promo_section) {
      const p = currentCmsSettings.promo_section;
      if (document.getElementById('cms-promo-badge')) document.getElementById('cms-promo-badge').value = p.badge || '';
      if (document.getElementById('cms-promo-title')) document.getElementById('cms-promo-title').value = p.title || '';
      if (document.getElementById('cms-promo-subtitle')) document.getElementById('cms-promo-subtitle').value = p.subtitle || '';
      if (document.getElementById('cms-promo-desc')) document.getElementById('cms-promo-desc').value = p.description || '';
      if (document.getElementById('cms-promo-cta-text')) document.getElementById('cms-promo-cta-text').value = p.ctaText || '';
      if (document.getElementById('cms-promo-cta-link')) document.getElementById('cms-promo-cta-link').value = p.ctaLink || '';
      if (document.getElementById('cms-promo-img-url')) document.getElementById('cms-promo-img-url').value = p.imageUrl || '';
      if (document.getElementById('cms-promo-preview-img') && p.imageUrl) document.getElementById('cms-promo-preview-img').src = p.imageUrl;
    }

    // 3. Trust Pillars
    if (Array.isArray(currentCmsSettings.trust_pillars) && currentCmsSettings.trust_pillars.length >= 4) {
      const tp = currentCmsSettings.trust_pillars;
      for (let i = 0; i < 4; i++) {
        const item = tp[i];
        if (document.getElementById(`cms-pillar${i+1}-icon`)) document.getElementById(`cms-pillar${i+1}-icon`).value = item.icon || '';
        if (document.getElementById(`cms-pillar${i+1}-title`)) document.getElementById(`cms-pillar${i+1}-title`).value = item.title || '';
        if (document.getElementById(`cms-pillar${i+1}-sub`)) document.getElementById(`cms-pillar${i+1}-sub`).value = item.subtitle || '';
      }
    }

    // 4. Contact
    if (currentCmsSettings.contact_section) {
      const c = currentCmsSettings.contact_section;
      if (document.getElementById('cms-contact-badge')) document.getElementById('cms-contact-badge').value = c.badge || '';
      if (document.getElementById('cms-contact-title')) document.getElementById('cms-contact-title').value = c.title || '';
      if (document.getElementById('cms-contact-desc')) document.getElementById('cms-contact-desc').value = c.subtitle || '';
      if (document.getElementById('cms-contact-phone')) document.getElementById('cms-contact-phone').value = c.whatsappNumber || '';
      if (document.getElementById('cms-contact-btn-text')) document.getElementById('cms-contact-btn-text').value = c.buttonText || '';
    }

    // 5. Footer
    if (currentCmsSettings.footer_section) {
      const f = currentCmsSettings.footer_section;
      if (document.getElementById('cms-footer-desc')) document.getElementById('cms-footer-desc').value = f.description || '';
      if (document.getElementById('cms-footer-copyright')) document.getElementById('cms-footer-copyright').value = f.copyright || '';
    }

    // 6. Social Links
    if (currentCmsSettings.social_links) {
      const s = currentCmsSettings.social_links;
      if (document.getElementById('cms-social-facebook')) document.getElementById('cms-social-facebook').value = s.facebook || '';
      if (document.getElementById('cms-social-instagram')) document.getElementById('cms-social-instagram').value = s.instagram || '';
      if (document.getElementById('cms-social-tiktok')) document.getElementById('cms-social-tiktok').value = s.tiktok || '';
      if (document.getElementById('cms-social-whatsapp')) document.getElementById('cms-social-whatsapp').value = s.whatsapp || '';
    }

    // 7. Legal Section
    if (currentCmsSettings.legal_section) {
      const l = currentCmsSettings.legal_section;
      if (document.getElementById('cms-legal-terms')) document.getElementById('cms-legal-terms').value = l.terms || '';
      if (document.getElementById('cms-legal-privacy')) document.getElementById('cms-legal-privacy').value = l.privacy || '';
    }

    // 8. FAQ Section
    if (Array.isArray(currentCmsSettings.faq_section)) {
      adminFaqItems = JSON.parse(JSON.stringify(currentCmsSettings.faq_section));
    } else {
      adminFaqItems = [];
    }
    renderAdminFaqList();

  } catch (err) {
    console.error('Erreur chargement réglages CMS admin:', err);
  }
}

async function saveCmsSection(key, payload, indicatorId) {
  try {
    const res = await fetch(`/api/admin/settings/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      flashCmsSaved(indicatorId);
    } else {
      const err = await res.json();
      alert(`Erreur: ${err.error || 'Impossible d’enregistrer la section'}`);
    }
  } catch (err) {
    console.error('Erreur save CMS:', err);
    alert('Erreur réseau lors de l’enregistrement');
  }
}

function setupCmsImageUpload(fileInputId, previewImgId, urlInputId, statusId) {
  const fileInput = document.getElementById(fileInputId);
  const previewImg = document.getElementById(previewImgId);
  const urlInput = document.getElementById(urlInputId);
  const statusEl = document.getElementById(statusId);

  if (!fileInput) return;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (maximum 25 Mo).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Data = ev.target.result;
      if (previewImg) previewImg.src = base64Data;
      if (statusEl) statusEl.textContent = 'Téléversement en cours...';

      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({ image: base64Data, filename: file.name })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (urlInput) urlInput.value = data.imageUrl;
          if (statusEl) statusEl.textContent = '✓ Photo prête et enregistrée';
        } else {
          if (statusEl) statusEl.textContent = 'Échec téléversement';
          alert('Erreur téléversement: ' + (data.error || 'Erreur inconnue'));
        }
      } catch (err) {
        if (statusEl) statusEl.textContent = 'Erreur réseau';
        alert('Erreur réseau lors de l’envoi de l’image');
      }
    };
    reader.readAsDataURL(file);
  });

  if (urlInput && previewImg) {
    urlInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) previewImg.src = val;
    });
  }
}

// Wire CMS Image Uploads
setupCmsImageUpload('cms-hero-file-input', 'cms-hero-preview-img', 'cms-hero-img-url', 'cms-hero-upload-status');
setupCmsImageUpload('cms-promo-file-input', 'cms-promo-preview-img', 'cms-promo-img-url', null);

// Wire CMS Save Buttons
document.getElementById('save-cms-hero-btn')?.addEventListener('click', () => {
  const payload = {
    badge: document.getElementById('cms-hero-badge')?.value.trim() || '✦ Nouveauté',
    title: document.getElementById('cms-hero-title')?.value.trim() || 'La technologie\nà portée de main',
    subtitle: document.getElementById('cms-hero-subtitle')?.value.trim() || '',
    ctaText: document.getElementById('cms-hero-cta-text')?.value.trim() || 'Découvrir la collection',
    ctaLink: document.getElementById('cms-hero-cta-link')?.value.trim() || '#products-section',
    imageUrl: document.getElementById('cms-hero-img-url')?.value.trim() || '/images/hero-devices.jpg',
    prop1Title: document.getElementById('cms-hero-prop1-title')?.value.trim() || 'Livraison rapide',
    prop1Sub: document.getElementById('cms-hero-prop1-sub')?.value.trim() || 'en 24/48h',
    prop2Title: document.getElementById('cms-hero-prop2-title')?.value.trim() || 'Paiement sécurisé',
    prop2Sub: document.getElementById('cms-hero-prop2-sub')?.value.trim() || '100% fiable',
    prop3Title: document.getElementById('cms-hero-prop3-title')?.value.trim() || 'Service client',
    prop3Sub: document.getElementById('cms-hero-prop3-sub')?.value.trim() || 'dédié 7j/7'
  };
  saveCmsSection('hero_section', payload, 'cms-hero-saved');
});

document.getElementById('save-cms-promo-btn')?.addEventListener('click', () => {
  const payload = {
    badge: document.getElementById('cms-promo-badge')?.value.trim() || 'Offre spéciale',
    title: document.getElementById('cms-promo-title')?.value.trim() || 'Jusqu\'à -20%',
    subtitle: document.getElementById('cms-promo-subtitle')?.value.trim() || 'sur une sélection de produits',
    description: document.getElementById('cms-promo-desc')?.value.trim() || '',
    ctaText: document.getElementById('cms-promo-cta-text')?.value.trim() || 'Voir l\'offre',
    ctaLink: document.getElementById('cms-promo-cta-link')?.value.trim() || '#products-section',
    imageUrl: document.getElementById('cms-promo-img-url')?.value.trim() || '/images/promo-banner.jpg'
  };
  saveCmsSection('promo_section', payload, 'cms-promo-saved');
});

document.getElementById('save-cms-pillars-btn')?.addEventListener('click', () => {
  const payload = [1, 2, 3, 4].map(idx => ({
    icon: document.getElementById(`cms-pillar${idx}-icon`)?.value.trim() || 'verified',
    title: document.getElementById(`cms-pillar${idx}-title`)?.value.trim() || '',
    subtitle: document.getElementById(`cms-pillar${idx}-sub`)?.value.trim() || ''
  }));
  saveCmsSection('trust_pillars', payload, 'cms-pillars-saved');
});

document.getElementById('save-cms-contact-btn')?.addEventListener('click', () => {
  const phone = document.getElementById('cms-contact-phone')?.value.trim() || '241074001122';
  const payload = {
    badge: document.getElementById('cms-contact-badge')?.value.trim() || 'Assistance WhatsApp Directe',
    title: document.getElementById('cms-contact-title')?.value.trim() || 'Une question sur un produit ou son expédition ?',
    subtitle: document.getElementById('cms-contact-desc')?.value.trim() || '',
    whatsappNumber: phone,
    whatsappDisplay: '(+241) 074 00 11 22',
    buttonText: document.getElementById('cms-contact-btn-text')?.value.trim() || 'Écrire sur WhatsApp'
  };
  saveCmsSection('contact_section', payload, 'cms-contact-saved');
});

document.getElementById('save-cms-footer-btn')?.addEventListener('click', () => {
  const payload = {
    slogan: 'High-Tech Gabon & Chine',
    description: document.getElementById('cms-footer-desc')?.value.trim() || '',
    copyright: document.getElementById('cms-footer-copyright')?.value.trim() || '© 2026 WuazeShop. Tous droits réservés.'
  };
  saveCmsSection('footer_section', payload, 'cms-footer-saved');
});

document.getElementById('save-cms-social-btn')?.addEventListener('click', () => {
  const payload = {
    facebook: document.getElementById('cms-social-facebook')?.value.trim() || '',
    instagram: document.getElementById('cms-social-instagram')?.value.trim() || '',
    tiktok: document.getElementById('cms-social-tiktok')?.value.trim() || '',
    whatsapp: document.getElementById('cms-social-whatsapp')?.value.trim() || ''
  };
  saveCmsSection('social_links', payload, 'cms-social-saved');
});

document.getElementById('save-cms-legal-btn')?.addEventListener('click', () => {
  const payload = {
    terms: document.getElementById('cms-legal-terms')?.value.trim() || '',
    privacy: document.getElementById('cms-legal-privacy')?.value.trim() || ''
  };
  saveCmsSection('legal_section', payload, 'cms-legal-saved');
});

// FAQ Management Logic in Admin
let adminFaqItems = [];

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function syncFaqFromInputs() {
  const container = document.getElementById('admin-faq-list');
  if (!container) return;
  const itemEls = container.querySelectorAll('.admin-faq-item');
  adminFaqItems = Array.from(itemEls).map(el => {
    const id = el.getAttribute('data-faq-id') || ('faq_' + Date.now());
    const q = el.querySelector('.admin-faq-question')?.value.trim() || '';
    const a = el.querySelector('.admin-faq-answer')?.value.trim() || '';
    return { id, question: q, answer: a };
  });
}

function renderAdminFaqList() {
  const container = document.getElementById('admin-faq-list');
  if (!container) return;

  if (adminFaqItems.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <span class="material-symbols-outlined text-3xl mb-1 text-gray-300">quiz</span>
        <p class="text-xs font-bold text-gray-600">Aucune question dans la FAQ pour le moment.</p>
        <p class="text-[10px] text-gray-400 mt-0.5">Cliquez sur « + Ajouter une question » ci-dessus pour en créer une.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = adminFaqItems.map((item, idx) => `
    <div class="admin-faq-item bg-gray-50/80 rounded-2xl p-4 border border-gray-200 space-y-3 transition-all" data-faq-id="${item.id || ('faq_' + idx)}">
      <div class="flex items-center justify-between pb-2 border-b border-gray-200/60">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-lg bg-[#0d7252] text-white text-xs font-bold flex items-center justify-center">
            ${idx + 1}
          </span>
          <span class="text-xs font-bold text-gray-800">Question ${idx + 1}</span>
        </div>
        <button type="button" class="delete-faq-btn p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" data-idx="${idx}" title="Supprimer cette question">
          <span class="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>

      <div>
        <label class="block font-bold text-[11px] text-gray-600 mb-1">Question posée</label>
        <input type="text" class="admin-faq-question w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#0d7252]" placeholder="Ex: Quels sont les délais d'acheminement ?" value="${escapeHtml(item.question)}"/>
      </div>

      <div>
        <label class="block font-bold text-[11px] text-gray-600 mb-1">Réponse détaillée</label>
        <textarea rows="3" class="admin-faq-answer w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 leading-relaxed focus:outline-none focus:border-[#0d7252] resize-y" placeholder="Rédigez la réponse ici...">${escapeHtml(item.answer)}</textarea>
      </div>
    </div>
  `).join('');

  // Wire delete buttons
  container.querySelectorAll('.delete-faq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      syncFaqFromInputs();
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      adminFaqItems.splice(idx, 1);
      renderAdminFaqList();
    });
  });
}

document.getElementById('add-faq-item-btn')?.addEventListener('click', () => {
  syncFaqFromInputs();
  adminFaqItems.push({
    id: 'faq_' + Date.now(),
    question: '',
    answer: ''
  });
  renderAdminFaqList();
  const inputs = document.querySelectorAll('.admin-faq-question');
  if (inputs.length > 0) inputs[inputs.length - 1].focus();
});

document.getElementById('save-cms-faq-btn')?.addEventListener('click', () => {
  syncFaqFromInputs();
  const payload = adminFaqItems.filter(item => item.question.trim().length > 0 || item.answer.trim().length > 0);
  saveCmsSection('faq_section', payload, 'cms-faq-saved');
});

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});

