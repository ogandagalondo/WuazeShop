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
const tabOrdersContent = document.getElementById('tab-orders-content');
const tabProductsContent = document.getElementById('tab-products-content');
const mobileTabOrdersBtn = document.getElementById('mobile-tab-orders-btn');
const mobileTabProductsBtn = document.getElementById('mobile-tab-products-btn');
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

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
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
  if (tab === 'orders') {
    tabOrdersBtn.classList.add('active');
    tabOrdersBtn.classList.remove('text-outline');
    tabProductsBtn.classList.remove('active');
    tabProductsBtn.classList.add('text-outline');

    tabOrdersContent.classList.remove('hidden');
    tabProductsContent.classList.add('hidden');

    mobileTabOrdersBtn.classList.replace('text-outline', 'text-primary');
    mobileTabOrdersBtn.classList.add('font-bold');
    mobileTabProductsBtn.classList.replace('text-primary', 'text-outline');
    mobileTabProductsBtn.classList.remove('font-bold');
  } else {
    tabProductsBtn.classList.add('active');
    tabProductsBtn.classList.remove('text-outline');
    tabOrdersBtn.classList.remove('active');
    tabOrdersBtn.classList.add('text-outline');

    tabProductsContent.classList.remove('hidden');
    tabOrdersContent.classList.add('hidden');

    mobileTabProductsBtn.classList.replace('text-outline', 'text-primary');
    mobileTabProductsBtn.classList.add('font-bold');
    mobileTabOrdersBtn.classList.replace('text-primary', 'text-outline');
    mobileTabOrdersBtn.classList.remove('font-bold');
  }
}

tabOrdersBtn.addEventListener('click', () => switchTab('orders'));
tabProductsBtn.addEventListener('click', () => switchTab('products'));
mobileTabOrdersBtn.addEventListener('click', () => switchTab('orders'));
mobileTabProductsBtn.addEventListener('click', () => switchTab('products'));

// 4. Load Data
async function loadDashboardData() {
  await Promise.all([loadOrders(), loadAdminProducts()]);
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
  const clearedOrders = currentOrders.filter(o => o.payment_status === 'CONFIRMED_CLEARED');
  const pendingOrders = currentOrders.filter(o => o.payment_status === 'PENDING_PAYMENT');
  const totalRevenue = clearedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

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
    filtered = filtered.filter(o => o.payment_status === 'CONFIRMED_CLEARED');
  } else if (activeOrderFilter === 'PENDING') {
    filtered = filtered.filter(o => o.payment_status === 'PENDING_PAYMENT');
  } else if (activeOrderFilter === 'SHIPPED') {
    filtered = filtered.filter(o => ['IN_PREPARATION_CHINA', 'SHIPPED_GABON', 'ARRIVED_LIBREVILLE'].includes(o.fulfillment_status));
  }

  // Search input
  const query = document.getElementById('orders-search-input')?.value.toLowerCase().trim();
  if (query) {
    filtered = filtered.filter(o => 
      o.order_number.toLowerCase().includes(query) ||
      o.customer_name.toLowerCase().includes(query) ||
      o.customer_phone.toLowerCase().includes(query) ||
      (o.customer_neighborhood && o.customer_neighborhood.toLowerCase().includes(query))
    );
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
    const isCleared = order.payment_status === 'CONFIRMED_CLEARED';
    const isPending = order.payment_status === 'PENDING_PAYMENT';
    
    // Payment badge
    let paymentBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">${order.payment_status}</span>`;
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
    if (order.fulfillment_status === 'IN_PREPARATION_CHINA') {
      fulfillmentLabel = '🇨🇳 En préparation Chine';
      fulfillmentBadgeClass = 'bg-blue-50 text-blue-700 border border-blue-200 font-bold';
    } else if (order.fulfillment_status === 'SHIPPED_GABON') {
      fulfillmentLabel = '✈️ En vol vers Gabon';
      fulfillmentBadgeClass = 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold';
    } else if (order.fulfillment_status === 'ARRIVED_LIBREVILLE') {
      fulfillmentLabel = '🇬🇦 Arrivé Libreville';
      fulfillmentBadgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold';
    } else if (order.fulfillment_status === 'DELIVERED') {
      fulfillmentLabel = '✅ Livré au client';
      fulfillmentBadgeClass = 'bg-green-100 text-green-800 font-bold';
    }

    // Items list
    const itemsHtml = (order.items || []).map(item => `
      <div class="flex items-center justify-between text-xs py-1 border-b border-surface-low last:border-0">
        <div class="flex items-center gap-2 truncate">
          <span class="w-5 h-5 rounded bg-surface-low flex items-center justify-center font-bold text-[10px] shrink-0">${item.quantity}x</span>
          <span class="truncate text-on-surface">${item.title}</span>
        </div>
        <span class="font-bold text-on-surface shrink-0 ml-2">${formatFCFA(item.price * item.quantity)}</span>
      </div>
    `).join('');

    // WhatsApp Direct Link
    const cleanPhone = cleanPhoneForWhatsApp(order.customer_phone);
    const waMessage = `Bonjour ${order.customer_name}, c'est l'équipe WuazeShop concernant votre commande ${order.order_number} (${formatFCFA(order.total_amount)}). Statut actuel : ${fulfillmentLabel}.`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

    return `
      <div class="bg-surface rounded-2xl p-4 sm:p-5 border border-surface-border shadow-sm space-y-3 transition-all hover:shadow-md">
        <!-- Card Header: Order Number & Payment Badge -->
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-surface-low">
          <div class="flex items-center gap-2">
            <span class="font-black text-sm text-primary tracking-tight">${order.order_number}</span>
            <span class="text-[10px] text-outline">${new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div>${paymentBadge}</div>
        </div>

        <!-- Customer Info & Neighborhood -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div class="space-y-1">
            <div class="flex items-center gap-1.5 font-bold text-on-surface">
              <span class="material-symbols-outlined text-outline text-[16px]">person</span>
              <span>${order.customer_name}</span>
            </div>
            <div class="flex items-center gap-1.5 text-on-surface-variant">
              <span class="material-symbols-outlined text-outline text-[16px]">location_on</span>
              <span>Quartier : <strong>${order.customer_neighborhood || 'Libreville'}</strong></span>
            </div>
          </div>

          <div class="flex flex-col sm:items-end justify-between gap-1.5">
            <div class="flex items-center gap-2">
              <span class="text-outline text-[11px]">Contact :</span>
              <a href="tel:${order.customer_phone}" class="font-bold text-on-surface hover:text-primary">${order.customer_phone}</a>
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
            <span class="font-black text-sm text-primary">${formatFCFA(order.total_amount)}</span>
          </div>
        </div>

        <!-- Card Footer: Fulfillment Status & Action -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div class="flex items-center gap-1.5">
            <span class="text-[11px] text-outline">Expédition :</span>
            <span class="px-2.5 py-1 rounded-xl text-xs ${fulfillmentBadgeClass}">${fulfillmentLabel}</span>
          </div>

          <button onclick="openStatusModal('${order.order_number}', '${order.customer_name}', '${order.fulfillment_status}', '${order.payment_status}')" class="px-3 py-1.5 rounded-xl bg-surface-low hover:bg-surface-border text-on-surface text-xs font-bold border border-surface-border flex items-center gap-1 transition-colors">
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
    document.querySelectorAll('.order-filter-pill').forEach(b => b.classList.remove('active', 'bg-primary-container', 'text-white'));
    document.querySelectorAll('.order-filter-pill').forEach(b => b.classList.add('bg-surface-low', 'text-on-surface-variant'));
    
    btn.classList.add('active', 'bg-primary-container', 'text-white');
    btn.classList.remove('bg-surface-low', 'text-on-surface-variant');
    
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
      <div class="bg-surface rounded-2xl p-3.5 sm:p-4 border border-surface-border shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md transition-all">
        <div class="flex gap-3">
          <div class="w-16 h-16 sm:w-20 sm:h-20 bg-surface-low rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1">
            <img class="w-full h-full object-contain" src="${prod.image_url}" alt="${prod.title}"/>
          </div>
          <div class="flex-1 min-w-0">
            <span class="uppercase tracking-wider font-bold text-[9px] text-secondary">${prod.category}</span>
            <h4 class="text-xs sm:text-sm font-bold text-on-surface line-clamp-2 leading-snug">${prod.title}</h4>
            <div class="text-[10px] text-outline truncate mt-0.5">${specsSummary || 'Origine Chine Neuf'}</div>
            <div class="mt-1 font-black text-xs sm:text-sm text-primary">${formatFCFA(prod.price)}</div>
          </div>
        </div>

        <div class="pt-2 border-t border-surface-low flex gap-2">
          <button onclick="openEditProductModal(${prod.id})" class="flex-1 py-1.5 px-2 rounded-xl bg-surface-low hover:bg-surface-border text-on-surface text-xs font-bold flex items-center justify-center gap-1 transition-colors">
            <span class="material-symbols-outlined text-[15px]">edit</span>
            <span>Modifier</span>
          </button>
          <button onclick="deleteProduct(${prod.id})" class="py-1.5 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#b91c1c] text-xs font-bold flex items-center justify-center transition-colors" title="Archiver le produit">
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
    document.querySelectorAll('.admin-cat-pill').forEach(b => b.classList.remove('active', 'bg-primary-container', 'text-white'));
    document.querySelectorAll('.admin-cat-pill').forEach(b => b.classList.add('bg-surface-low', 'text-on-surface-variant'));

    btn.classList.add('active', 'bg-primary-container', 'text-white');
    btn.classList.remove('bg-surface-low', 'text-on-surface-variant');

    activeCatFilter = btn.getAttribute('data-cat-filter');
    renderAdminProducts();
  });
});

document.getElementById('admin-product-search-input')?.addEventListener('input', () => {
  renderAdminProducts();
});

// 8. Add / Edit Product Modal Logic
function openProductModal(isEdit = false, productData = null) {
  productForm.reset();
  if (isEdit && productData) {
    productModalTitle.textContent = 'Modifier le produit';
    productEditId.value = productData.id;
    document.getElementById('prod-title').value = productData.title;
    document.getElementById('prod-category').value = productData.category;
    document.getElementById('prod-price').value = productData.price;
    document.getElementById('prod-original-price').value = productData.original_price || '';
    document.getElementById('prod-instock').checked = productData.in_stock === 1;
    document.getElementById('prod-image-url').value = productData.image_url;
    document.getElementById('prod-specs').value = (productData.specs || []).join(', ');
    document.getElementById('prod-colors').value = (productData.colors || []).join(', ');
  } else {
    productModalTitle.textContent = 'Ajouter un produit (Import Chine)';
    productEditId.value = '';
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

  const id = productEditId.value;
  const title = document.getElementById('prod-title').value.trim();
  const category = document.getElementById('prod-category').value;
  const price = Number(document.getElementById('prod-price').value);
  const originalPriceVal = document.getElementById('prod-original-price').value;
  const originalPrice = originalPriceVal ? Number(originalPriceVal) : null;
  const inStock = document.getElementById('prod-instock').checked;
  const imageUrl = document.getElementById('prod-image-url').value.trim();
  const specsRaw = document.getElementById('prod-specs').value;
  const specs = specsRaw ? specsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const colorsRaw = document.getElementById('prod-colors').value;
  const colors = colorsRaw ? colorsRaw.split(',').map(c => c.trim()).filter(Boolean) : [];

  const payload = { title, category, price, originalPrice, imageUrl, specs, colors, inStock };

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

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});
