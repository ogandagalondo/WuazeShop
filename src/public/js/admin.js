// WuazeShop Admin CMS & Dashboard Logic (Mobile-First)
let adminToken = sessionStorage.getItem('wuazeshop_admin_token') || null;
let currentOrders = [];
let currentAdminProducts = [];
let currentCategories = [];
let currentCollaborators = [];
let activeOrderFilter = 'all';
let activeCatFilter = 'all';
let activeCollabFilter = 'all';
let selectedOrderForStatus = null;
let currentAdminUser = null;

// DOM Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const adminHeaderActions = document.getElementById('admin-header-actions');
const adminMobileNav = document.getElementById('admin-mobile-nav');

// Header Profile Pill
const adminUserPill = document.getElementById('admin-user-pill');
const adminUserAvatar = document.getElementById('admin-user-avatar');
const adminUserName = document.getElementById('admin-user-name');
const adminUserRole = document.getElementById('admin-user-role');

// Forms & Modals
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const adminLogoutBtn = document.getElementById('admin-logout-btn');

// Tabs
const tabOrdersBtn = document.getElementById('tab-orders-btn');
const tabProductsBtn = document.getElementById('tab-products-btn');
const tabCategoriesBtn = document.getElementById('tab-categories-btn');
const tabCmsBtn = document.getElementById('tab-cms-btn');
const tabTeamBtn = document.getElementById('tab-team-btn');
const tabOrdersContent = document.getElementById('tab-orders-content');
const tabProductsContent = document.getElementById('tab-products-content');
const tabCategoriesContent = document.getElementById('tab-categories-content');
const tabCmsContent = document.getElementById('tab-cms-content');
const tabTeamContent = document.getElementById('tab-team-content');
const tabCategoriesBadge = document.getElementById('tab-categories-badge');
const tabTeamBadge = document.getElementById('tab-team-badge');
const mobileTabOrdersBtn = document.getElementById('mobile-tab-orders-btn');
const mobileTabProductsBtn = document.getElementById('mobile-tab-products-btn');
const mobileTabCategoriesBtn = document.getElementById('mobile-tab-categories-btn');
const mobileTabCmsBtn = document.getElementById('mobile-tab-cms-btn');
const mobileTabTeamBtn = document.getElementById('mobile-tab-team-btn');
const mobileAddProductBtn = document.getElementById('mobile-add-product-btn');

// Team & Collaborators Elements
const openAddCollaboratorBtn = document.getElementById('open-add-collaborator-btn');
const adminCollaboratorsGrid = document.getElementById('admin-collaborators-grid');
const collaboratorModalOverlay = document.getElementById('collaborator-modal-overlay');
const closeCollaboratorModalBtn = document.getElementById('close-collaborator-modal-btn');
const cancelCollaboratorModalBtn = document.getElementById('cancel-collaborator-modal-btn');
const collaboratorForm = document.getElementById('collaborator-form');
const collaboratorModalTitle = document.getElementById('collaborator-modal-title');
const collaboratorModalError = document.getElementById('collaborator-modal-error');
const collaboratorEditId = document.getElementById('collaborator-edit-id');
const collabFullname = document.getElementById('collab-fullname');
const collabEmail = document.getElementById('collab-email');
const collabUsername = document.getElementById('collab-username');
const collabRole = document.getElementById('collab-role');
const collabPhone = document.getElementById('collab-phone');
const permOrders = document.getElementById('perm-orders');
const permProducts = document.getElementById('perm-products');
const permDiscounts = document.getElementById('perm-discounts');
const permCms = document.getElementById('perm-cms');
const generateCollabPasswordBtn = document.getElementById('generate-collab-password-btn');
const collabPassword = document.getElementById('collab-password');
const collabPasswordRequiredLabel = document.getElementById('collab-password-required-label');
const collabPasswordHint = document.getElementById('collab-password-hint');
const collabIsActive = document.getElementById('collab-is-active');
const toggleCollabPasswordBtn = document.getElementById('toggle-collab-password-btn');
const teamSearchInput = document.getElementById('team-search-input');
const teamStatTotal = document.getElementById('team-stat-total');
const teamStatSuperadmin = document.getElementById('team-stat-superadmin');
const teamStatGestionnaires = document.getElementById('team-stat-gestionnaires');
const teamStatAgents = document.getElementById('team-stat-agents');

// Invitation Modal Elements
const collaboratorInviteModal = document.getElementById('collaborator-invite-modal');
const closeInviteModalBtn = document.getElementById('close-invite-modal-btn');
const finishInviteBtn = document.getElementById('finish-invite-btn');
const inviteCollabName = document.getElementById('invite-collab-name');
const inviteCollabRole = document.getElementById('invite-collab-role');
const inviteCollabUrl = document.getElementById('invite-collab-url');
const inviteCollabId = document.getElementById('invite-collab-id');
const inviteCollabPassword = document.getElementById('invite-collab-password');
const copyFullInviteBtn = document.getElementById('copy-full-invite-btn');
const shareWhatsappInviteBtn = document.getElementById('share-whatsapp-invite-btn');
const shareMailInviteBtn = document.getElementById('share-mail-invite-btn');
const copyToast = document.getElementById('copy-toast');
let currentInviteShareText = '';

// Category Management Elements
const openAddCategoryBtn = document.getElementById('open-add-category-btn');
const adminCategoriesGrid = document.getElementById('admin-categories-grid');
const categoryModalOverlay = document.getElementById('category-modal-overlay');
const closeCategoryModalBtn = document.getElementById('close-category-modal-btn');
const cancelCategoryModalBtn = document.getElementById('cancel-category-modal-btn');
const categoryForm = document.getElementById('category-form');
const categoryModalTitle = document.getElementById('category-modal-title');
const categoryEditId = document.getElementById('category-edit-id');
const catFormName = document.getElementById('cat-form-name');
const catFormSlug = document.getElementById('cat-form-slug');
const catFormIcon = document.getElementById('cat-form-icon');
const catIconPreview = document.getElementById('cat-icon-preview');
const catFormDescription = document.getElementById('cat-form-description');
const catFormBanner = document.getElementById('cat-form-banner');

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
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const PRESET_COLOR_LABELS = {
  '#9c9589': 'Titane Naturel',
  '#1e1e1e': 'Noir Sidéral',
  '#293644': 'Bleu Titane',
  '#1e2530': 'Minuit',
  '#d2d4d7': 'Argent',
  '#f0e4d3': 'Or / Starlight',
  '#f97316': 'Orange Alpine',
  '#ffffff': 'Blanc Pur',
  '#10b981': 'Vert Émeraude'
};

function resolveColorLabel(colorStr) {
  if (!colorStr) return 'Couleur';
  const lower = colorStr.toLowerCase().trim();
  if (PRESET_COLOR_LABELS[lower]) return PRESET_COLOR_LABELS[lower];
  if (lower.startsWith('#')) return colorStr.toUpperCase();
  return colorStr.charAt(0).toUpperCase() + colorStr.slice(1);
}

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
      const authData = await res.json();
      currentAdminUser = authData.user || null;
      renderAdminUserProfile();
      showDashboard();
      await loadDashboardData();
    } else {
      sessionStorage.removeItem('wuazeshop_admin_token');
      adminToken = null;
      currentAdminUser = null;
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
    currentAdminUser = data.user || {
      id: data.userId || null,
      email: data.email || identifier,
      fullName: data.fullName || data.full_name || 'Admin',
      role: data.role || 'SUPER_ADMIN',
      username: data.username || identifier
    };
    sessionStorage.setItem('wuazeshop_admin_token', adminToken);
    renderAdminUserProfile();
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
  currentAdminUser = null;
  showLogin();
});

// 3. Tab Switching
function switchTab(tab) {
  const allBtns = [tabOrdersBtn, tabProductsBtn, tabCategoriesBtn, tabCmsBtn, tabTeamBtn].filter(Boolean);
  allBtns.forEach(btn => {
    btn.classList.remove('active', 'bg-[#0d7252]', 'text-white');
    btn.classList.add('text-gray-500');
  });

  if (tabOrdersContent) tabOrdersContent.classList.add('hidden');
  if (tabProductsContent) tabProductsContent.classList.add('hidden');
  if (tabCategoriesContent) tabCategoriesContent.classList.add('hidden');
  if (tabCmsContent) tabCmsContent.classList.add('hidden');
  if (tabTeamContent) tabTeamContent.classList.add('hidden');

  const allMobileBtns = [mobileTabOrdersBtn, mobileTabProductsBtn, mobileTabCategoriesBtn, mobileTabCmsBtn, mobileTabTeamBtn].filter(Boolean);
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
  } else if (tab === 'categories') {
    if (tabCategoriesBtn) {
      tabCategoriesBtn.classList.add('active', 'bg-[#0d7252]', 'text-white');
      tabCategoriesBtn.classList.remove('text-gray-500');
    }
    if (tabCategoriesContent) tabCategoriesContent.classList.remove('hidden');
    if (mobileTabCategoriesBtn) {
      mobileTabCategoriesBtn.classList.add('text-[#0d7252]', 'font-bold');
      mobileTabCategoriesBtn.classList.remove('text-gray-400');
    }
    loadAdminCategories();
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
  } else if (tab === 'team') {
    if (currentAdminUser && currentAdminUser.role !== 'SUPER_ADMIN') {
      switchTab('orders');
      return;
    }
    if (tabTeamBtn) {
      tabTeamBtn.classList.add('active', 'bg-[#0d7252]', 'text-white');
      tabTeamBtn.classList.remove('text-gray-500');
    }
    if (tabTeamContent) tabTeamContent.classList.remove('hidden');
    if (mobileTabTeamBtn) {
      mobileTabTeamBtn.classList.add('text-[#0d7252]', 'font-bold');
      mobileTabTeamBtn.classList.remove('text-gray-400');
    }
    loadCollaborators();
  }
}

tabOrdersBtn.addEventListener('click', () => switchTab('orders'));
tabProductsBtn.addEventListener('click', () => switchTab('products'));
if (tabCategoriesBtn) tabCategoriesBtn.addEventListener('click', () => switchTab('categories'));
if (tabCmsBtn) tabCmsBtn.addEventListener('click', () => switchTab('cms'));
if (tabTeamBtn) tabTeamBtn.addEventListener('click', () => switchTab('team'));
mobileTabOrdersBtn.addEventListener('click', () => switchTab('orders'));
mobileTabProductsBtn.addEventListener('click', () => switchTab('products'));
if (mobileTabCategoriesBtn) mobileTabCategoriesBtn.addEventListener('click', () => switchTab('categories'));
if (mobileTabCmsBtn) mobileTabCmsBtn.addEventListener('click', () => switchTab('cms'));
if (mobileTabTeamBtn) mobileTabTeamBtn.addEventListener('click', () => switchTab('team'));

// 4. Load Data
async function loadDashboardData() {
  const tasks = [loadOrders(), loadAdminProducts(), loadAdminCategories(), loadAdminSettings()];
  if (currentAdminUser && currentAdminUser.role === 'SUPER_ADMIN') {
    tasks.push(loadCollaborators());
  }
  await Promise.all(tasks);
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

    const itemsHtml = items.map(item => {
      let titleHtml = escapeHtml(item.title);
      const variantMatch = item.title.match(/\[(.*?)\]/);
      if (variantMatch) {
        const baseTitle = item.title.replace(/\[(.*?)\]/, '').trim();
        titleHtml = `${escapeHtml(baseTitle)} <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#e6f7f0] text-[#0d7252] border border-emerald-200/60 ml-1">Finition : ${escapeHtml(variantMatch[1])}</span>`;
      }
      return `
        <div class="flex items-center justify-between text-xs py-1.5 border-b border-surface-low last:border-0">
          <div class="flex items-center gap-2 truncate">
            <span class="w-5 h-5 rounded bg-surface-low flex items-center justify-center font-bold text-[10px] shrink-0">${item.quantity}x</span>
            <div class="truncate text-on-surface font-medium">${titleHtml}</div>
          </div>
          <span class="font-bold text-on-surface shrink-0 ml-2">${formatFCFA(item.price * item.quantity)}</span>
        </div>
      `;
    }).join('');

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
              <span>${escapeHtml(clientName)}</span>
            </div>
            <div class="flex items-center gap-1.5 text-on-surface-variant">
              <span class="material-symbols-outlined text-outline text-[16px]">location_on</span>
              <span>Quartier : <strong>${escapeHtml(neighborhood)}</strong></span>
            </div>
          </div>

          <div class="flex flex-col sm:items-end justify-between gap-1.5">
            <div class="flex items-center gap-2">
              <span class="text-outline text-[11px]">Contact :</span>
              <a href="tel:${escapeHtml(clientPhone)}" class="font-bold text-on-surface hover:text-primary">${escapeHtml(clientPhone)}</a>
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
            <span class="font-medium text-outline flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-[#0d7252]">flight_takeoff</span>
              <span>Fret Cargo (${order.shippingMethod === 'express' ? 'Colis Rapide 1 sem' : 'Colis Normal 2 sem'} - ${order.totalWeight || 0.4} kg) :</span>
            </span>
            <span class="font-bold text-on-surface">${formatFCFA(order.shippingFee || 0)}</span>
          </div>
          <div class="pt-1 flex justify-between items-center text-xs">
            <span class="font-semibold text-outline">Total Commande (avec fret) :</span>
            <span class="font-black text-sm text-primary">${formatFCFA(totalAmount)}</span>
          </div>
        </div>

        <!-- Card Footer: Fulfillment Status & Action -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div class="flex items-center gap-1.5">
            <span class="text-[11px] text-outline">Expédition :</span>
            <span class="px-2.5 py-1 rounded-xl text-xs ${fulfillmentBadgeClass}">${fulfillmentLabel}</span>
          </div>

          <div class="flex items-center gap-2">
            <a href="/tracking?track=${orderNum}" target="_blank" class="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0d7252] text-xs font-bold border border-emerald-200/60 flex items-center gap-1 transition-colors" title="Consulter la page de suivi public">
              <span class="material-symbols-outlined text-[15px]">route</span>
              <span>Suivi public</span>
            </a>
            <button onclick="openStatusModal('${orderNum}', '${clientName}', '${fulfillmentStatus}', '${paymentStatus}')" class="px-3 py-1.5 rounded-xl bg-surface-low hover:bg-surface-border text-on-surface text-xs font-bold border border-surface-border flex items-center gap-1 transition-colors">
              <span class="material-symbols-outlined text-[15px]">edit</span>
              <span>Mettre à jour statut</span>
            </button>
          </div>
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
    const specsSummary = (prod.specs || []).slice(0, 3).map(s => 
      `<span class="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] text-gray-700 font-medium">${escapeHtml(s)}</span>`
    ).join(' ');

    const colorsDots = (prod.colors || []).map(col => {
      const bg = col.startsWith('#') ? `background-color: ${col};` : 'background-color: #333;';
      return `<span class="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs inline-block" style="${bg}" title="${escapeHtml(col)}"></span>`;
    }).join(' ');

    const hasDiscount = prod.original_price && prod.original_price > prod.price;
    const discountPct = hasDiscount 
      ? Math.round(((prod.original_price - prod.price) / prod.original_price) * 100) 
      : 0;

    const pricingHtml = hasDiscount
      ? `
        <div class="mt-2 flex flex-wrap items-baseline gap-1.5">
          <span class="font-extrabold text-xs sm:text-sm text-[#0d7252]">${formatFCFA(prod.price)}</span>
          <span class="text-[11px] text-gray-400 line-through">${formatFCFA(prod.original_price)}</span>
          <span class="bg-[#10b981] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">-${discountPct}%</span>
        </div>
      `
      : `
        <div class="mt-2 flex items-baseline gap-2">
          <span class="font-extrabold text-xs sm:text-sm text-[#0d7252]">${formatFCFA(prod.price)}</span>
          <span class="text-[10px] text-gray-400 font-medium">Plein tarif</span>
        </div>
      `;

    return `
      <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md transition-all">
        <div class="flex gap-3">
          <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1.5 border border-gray-100">
            <img class="w-full h-full object-contain" src="${prod.image_url}" alt="${prod.title}"/>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1 mb-0.5">
              <span class="uppercase tracking-wider font-extrabold text-[10px] text-[#0d7252]">${escapeHtml(prod.category)}</span>
              ${prod.colors && prod.colors.length > 0 ? `<div class="flex items-center gap-1">${colorsDots}</div>` : ''}
            </div>
            <h4 class="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 leading-snug">${escapeHtml(prod.title)}</h4>
            <div class="text-[10px] text-gray-400 truncate mt-0.5">${prod.description ? escapeHtml(prod.description) : 'Origine Chine Neuf'}</div>
            ${prod.specs && prod.specs.length > 0 ? `<div class="flex flex-wrap gap-1 mt-1.5">${specsSummary}</div>` : ''}
            ${pricingHtml}
          </div>
        </div>

        <div class="pt-2 border-t border-gray-100 flex items-center gap-1.5">
          <button onclick="openQuickDiscountModal(${prod.id})" class="py-1.5 px-2.5 rounded-full ${hasDiscount ? 'bg-emerald-100 text-[#0d7252] border border-emerald-200 font-extrabold' : 'bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-[#0d7252] border border-gray-200'} text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer" title="Gérer la remise / réduction">
            <span class="material-symbols-outlined text-[14px]">local_offer</span>
            <span>${hasDiscount ? `-${discountPct}%` : 'Remise'}</span>
          </button>
          <button onclick="openEditProductModal(${prod.id})" class="flex-1 py-1.5 px-2.5 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-[14px]">edit</span>
            <span>Modifier</span>
          </button>
          <a href="/product/${prod.slug || prod.id}" target="_blank" class="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#0d7252] flex items-center justify-center transition-colors shrink-0" title="Voir la fiche en direct">
            <span class="material-symbols-outlined text-[15px]">visibility</span>
          </a>
          <button onclick="deleteProduct(${prod.id})" class="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-center transition-colors shrink-0 cursor-pointer" title="Archiver le produit">
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

// 8. Add / Edit Product Modal - Multi-Image Gallery Logic
let currentProductImages = [];

function renderProductGallery() {
  const grid = document.getElementById('prod-gallery-grid');
  const countBadge = document.getElementById('gallery-count-badge');
  const hiddenUrl = document.getElementById('prod-image-url');
  
  if (hiddenUrl) {
    hiddenUrl.value = currentProductImages[0] || '';
  }

  if (countBadge) {
    const len = currentProductImages.length;
    countBadge.textContent = `${len} photo${len > 1 ? 's' : ''}`;
  }

  if (!grid) return;

  if (currentProductImages.length === 0) {
    grid.innerHTML = '';
    return;
  }

  grid.innerHTML = currentProductImages.map((url, idx) => {
    const isPrimary = idx === 0;
    return `
      <div class="relative group rounded-2xl border ${isPrimary ? 'border-[#0d7252] ring-2 ring-[#0d7252]/20 bg-emerald-50/20' : 'border-gray-200 bg-white'} p-2 flex flex-col gap-1.5 shadow-2xs transition-all">
        <div class="w-full aspect-square bg-gray-50 rounded-xl overflow-hidden relative border border-gray-100">
          <img src="${escapeHtml(url)}" alt="Angle ${idx + 1}" class="w-full h-full object-cover"/>
          
          <!-- Primary badge vs angle index -->
          ${isPrimary ? `
            <span class="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[#0d7252] text-white text-[9px] font-black uppercase tracking-wider shadow-xs flex items-center gap-0.5">
              <span class="material-symbols-outlined text-[11px]">star</span>
              <span>Principale</span>
            </span>
          ` : `
            <span class="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-bold">
              Angle ${idx + 1}
            </span>
          `}

          <!-- Delete button -->
          <button type="button" onclick="removeProductGalleryImage(${idx})" class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/95 hover:bg-red-50 text-gray-500 hover:text-red-600 shadow-sm flex items-center justify-center transition-colors cursor-pointer border border-gray-200" title="Retirer cette photo">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <!-- Action: Set as primary -->
        ${!isPrimary ? `
          <button type="button" onclick="setMainProductGalleryImage(${idx})" class="w-full py-1 px-2 rounded-lg bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-[#0d7252] border border-gray-200 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-xs">star</span>
            <span>Définir principale</span>
          </button>
        ` : `
          <div class="w-full py-1 px-2 rounded-lg bg-emerald-100/60 text-[#0d7252] text-[10px] font-extrabold text-center">
            ★ Couverture catalogue
          </div>
        `}
      </div>
    `;
  }).join('');
}

window.removeProductGalleryImage = function(index) {
  if (index >= 0 && index < currentProductImages.length) {
    currentProductImages.splice(index, 1);
    renderProductGallery();
  }
};

window.setMainProductGalleryImage = function(index) {
  if (index > 0 && index < currentProductImages.length) {
    const [selected] = currentProductImages.splice(index, 1);
    currentProductImages.unshift(selected);
    renderProductGallery();
  }
};

async function uploadSingleImageFile(file) {
  return new Promise((resolve) => {
    if (file.size > 25 * 1024 * 1024) {
      alert(`Le fichier "${file.name}" dépasse 25 Mo.`);
      return resolve(null);
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            image: e.target.result,
            filename: file.name
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          resolve(data.imageUrl);
        } else {
          alert(`Erreur upload pour "${file.name}": ${data.error || 'Erreur'}`);
          resolve(null);
        }
      } catch (err) {
        console.error('Erreur upload:', err);
        alert(`Erreur réseau pour "${file.name}".`);
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

async function handleMultiImageFiles(fileList) {
  if (!fileList || fileList.length === 0) return;
  const files = Array.from(fileList);
  const spinner = document.getElementById('upload-spinner-container');
  const spinnerText = document.getElementById('upload-spinner-text');
  const placeholder = document.getElementById('upload-placeholder');

  isUploadingImage = true;
  if (spinner) spinner.classList.remove('hidden');
  if (placeholder) placeholder.classList.add('hidden');

  for (let i = 0; i < files.length; i++) {
    if (spinnerText) {
      spinnerText.textContent = `Téléversement image ${i + 1} sur ${files.length}...`;
    }
    const url = await uploadSingleImageFile(files[i]);
    if (url && !currentProductImages.includes(url)) {
      currentProductImages.push(url);
      renderProductGallery();
    }
  }

  isUploadingImage = false;
  if (spinner) spinner.classList.add('hidden');
  if (placeholder) placeholder.classList.remove('hidden');
  if (prodImageFile) prodImageFile.value = '';
}

if (prodImageFile) {
  prodImageFile.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultiImageFiles(e.target.files);
    }
  });
}

function addManualImageUrl() {
  const input = document.getElementById('prod-image-url-manual');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;
  if (!currentProductImages.includes(val)) {
    currentProductImages.push(val);
    renderProductGallery();
  }
  input.value = '';
}

const addImageUrlBtn = document.getElementById('add-image-url-btn');
if (addImageUrlBtn) {
  addImageUrlBtn.addEventListener('click', addManualImageUrl);
}

if (prodImageUrlManual) {
  prodImageUrlManual.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addManualImageUrl();
    }
  });
}

if (toggleUrlInputBtn && urlInputContainer) {
  toggleUrlInputBtn.addEventListener('click', () => {
    urlInputContainer.classList.toggle('hidden');
    if (!urlInputContainer.classList.contains('hidden') && prodImageUrlManual) {
      prodImageUrlManual.focus();
    }
  });
}

// Interactive Technical Specs & Colors Variant Builders
let activeSpecs = [];
let activeColors = [];

window.addSuggestedSpec = function(spec) {
  if (spec && !activeSpecs.includes(spec)) {
    activeSpecs.push(spec);
    renderActiveSpecs();
  }
};

window.removeSpec = function(index) {
  activeSpecs.splice(index, 1);
  renderActiveSpecs();
};

function renderActiveSpecs() {
  const container = document.getElementById('active-specs-container');
  if (!container) return;
  if (activeSpecs.length === 0) {
    container.innerHTML = '<span class="text-[11px] text-gray-400 italic">Aucune spécification ajoutée. Cliquez sur les suggestions ou tapez ci-dessus.</span>';
    return;
  }
  container.innerHTML = activeSpecs.map((spec, idx) => `
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-800 shadow-2xs">
      <span class="material-symbols-outlined text-[#0d7252] text-sm">check_circle</span>
      <span>${escapeHtml(spec)}</span>
      <button type="button" onclick="removeSpec(${idx})" class="text-gray-400 hover:text-red-500 ml-1 p-0.5 rounded-full hover:bg-red-50 transition-colors">
        <span class="material-symbols-outlined text-xs">close</span>
      </button>
    </span>
  `).join('');
}

const addSpecBtn = document.getElementById('add-spec-btn');
const specInputCustom = document.getElementById('spec-input-custom');
if (addSpecBtn && specInputCustom) {
  const doAddSpec = () => {
    const val = specInputCustom.value.trim();
    if (val) {
      addSuggestedSpec(val);
      specInputCustom.value = '';
    }
  };
  addSpecBtn.addEventListener('click', doAddSpec);
  specInputCustom.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doAddSpec();
    }
  });
}

window.addColorPreset = function(hex, name) {
  if (hex && !activeColors.includes(hex)) {
    activeColors.push(hex);
    renderActiveColors();
  }
};

window.removeColor = function(index) {
  activeColors.splice(index, 1);
  renderActiveColors();
};

function renderActiveColors() {
  const container = document.getElementById('active-colors-container');
  if (!container) return;
  if (activeColors.length === 0) {
    container.innerHTML = '<span class="text-[11px] text-gray-400 italic">Aucune couleur sélectionnée. Choisissez parmi la palette rapide ou ajoutez une couleur personnalisée.</span>';
    return;
  }
  container.innerHTML = activeColors.map((col, idx) => {
    const isHex = col.startsWith('#');
    const bgStyle = isHex ? `background-color: ${col};` : 'background-color: #333;';
    const label = resolveColorLabel(col);
    return `
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-800 shadow-2xs">
        <span class="w-3.5 h-3.5 rounded-full border border-black/10 shadow-inner" style="${bgStyle}"></span>
        <span>${escapeHtml(label)}</span>
        <button type="button" onclick="removeColor(${idx})" class="text-gray-400 hover:text-red-500 ml-1 p-0.5 rounded-full hover:bg-red-50 transition-colors">
          <span class="material-symbols-outlined text-xs">close</span>
        </button>
      </span>
    `;
  }).join('');
}

const addCustomColorBtn = document.getElementById('add-custom-color-btn');
const customColorPicker = document.getElementById('custom-color-picker');
const customColorName = document.getElementById('custom-color-name');
if (addCustomColorBtn && customColorPicker && customColorName) {
  addCustomColorBtn.addEventListener('click', () => {
    const hex = customColorPicker.value;
    const nameVal = customColorName.value.trim();
    const finalColor = nameVal || hex;
    if (finalColor && !activeColors.includes(finalColor)) {
      activeColors.push(finalColor);
      renderActiveColors();
      customColorName.value = '';
    }
  });
}

// ==================== PRODUCT MODAL DISCOUNT CALCULATOR ====================
const prodDiscountEnable = document.getElementById('prod-discount-enable');
const prodDiscountFields = document.getElementById('prod-discount-fields');
const prodDiscountToggleLabel = document.getElementById('prod-discount-toggle-label');
const prodDiscountRegular = document.getElementById('prod-discount-regular');
const prodDiscountPercent = document.getElementById('prod-discount-percent');
const prodDiscountFinal = document.getElementById('prod-discount-final');
const prodOriginalPriceHidden = document.getElementById('prod-original-price');

function updateDiscountPreview(regular, finalPrice) {
  const badgePreview = document.getElementById('prod-discount-badge-preview');
  const strikePreview = document.getElementById('prod-discount-strike-preview');
  const pricePreview = document.getElementById('prod-discount-price-preview');
  const savingsPreview = document.getElementById('prod-discount-savings-preview');

  if (regular > 0 && finalPrice > 0 && regular > finalPrice) {
    const pct = Math.round(((regular - finalPrice) / regular) * 100);
    const saving = regular - finalPrice;
    if (badgePreview) badgePreview.textContent = `-${pct}% PROMO`;
    if (strikePreview) strikePreview.textContent = formatFCFA(regular);
    if (pricePreview) pricePreview.textContent = formatFCFA(finalPrice);
    if (savingsPreview) savingsPreview.textContent = `Économie : ${formatFCFA(saving)}`;
    if (prodOriginalPriceHidden) prodOriginalPriceHidden.value = regular;
  }
}

window.applyDiscountPreset = function(pct) {
  if (prodDiscountPercent) {
    prodDiscountPercent.value = pct;
  }
  recalculateProductDiscount('percent');
};

function recalculateProductDiscount(source = 'percent') {
  const basePriceInput = document.getElementById('prod-price');
  let regular = Number(prodDiscountRegular.value) || Number(basePriceInput.value) || 0;
  
  if (regular <= 0) return;
  prodDiscountRegular.value = regular;

  if (source === 'percent') {
    const pct = Number(prodDiscountPercent.value) || 0;
    if (pct > 0 && pct < 100) {
      const finalPrice = Math.round(regular * (1 - (pct / 100)));
      prodDiscountFinal.value = finalPrice;
      updateDiscountPreview(regular, finalPrice);
    }
  } else if (source === 'final') {
    const finalPrice = Number(prodDiscountFinal.value) || 0;
    if (finalPrice > 0 && finalPrice < regular) {
      const pct = Math.round(((regular - finalPrice) / regular) * 100);
      prodDiscountPercent.value = pct;
      updateDiscountPreview(regular, finalPrice);
    }
  } else if (source === 'regular') {
    const pct = Number(prodDiscountPercent.value) || 15;
    prodDiscountPercent.value = pct;
    const finalPrice = Math.round(regular * (1 - (pct / 100)));
    prodDiscountFinal.value = finalPrice;
    updateDiscountPreview(regular, finalPrice);
  }
}

if (prodDiscountEnable) {
  prodDiscountEnable.addEventListener('change', () => {
    if (prodDiscountEnable.checked) {
      prodDiscountFields.classList.remove('hidden');
      prodDiscountToggleLabel.textContent = 'Remise active';
      const basePrice = Number(document.getElementById('prod-price').value) || 0;
      if (!prodDiscountRegular.value && basePrice > 0) {
        prodDiscountRegular.value = basePrice;
      }
      if (!prodDiscountPercent.value) {
        prodDiscountPercent.value = 15;
      }
      recalculateProductDiscount('percent');
    } else {
      cancelProductDiscount();
    }
  });
}

if (prodDiscountRegular) {
  prodDiscountRegular.addEventListener('input', () => recalculateProductDiscount('regular'));
}
if (prodDiscountPercent) {
  prodDiscountPercent.addEventListener('input', () => recalculateProductDiscount('percent'));
}
if (prodDiscountFinal) {
  prodDiscountFinal.addEventListener('input', () => recalculateProductDiscount('final'));
}

window.cancelProductDiscount = function() {
  if (prodDiscountEnable) prodDiscountEnable.checked = false;
  if (prodDiscountFields) prodDiscountFields.classList.add('hidden');
  if (prodDiscountToggleLabel) prodDiscountToggleLabel.textContent = 'Sans remise';
  if (prodDiscountRegular) prodDiscountRegular.value = '';
  if (prodDiscountPercent) prodDiscountPercent.value = '';
  if (prodDiscountFinal) prodDiscountFinal.value = '';
  if (prodOriginalPriceHidden) prodOriginalPriceHidden.value = '';
};

function openProductModal(isEdit = false, productData = null) {
  productForm.reset();
  const productModalError = document.getElementById('product-modal-error');
  if (productModalError) productModalError.classList.add('hidden');
  if (prodImageFile) prodImageFile.value = '';
  prodImageUrl.value = '';
  if (prodImageUrlManual) prodImageUrlManual.value = '';
  if (urlInputContainer) urlInputContainer.classList.add('hidden');
  currentProductImages = [];

  if (isEdit && productData) {
    productModalTitle.textContent = 'Modifier le produit';
    productEditId.value = productData.id;
    document.getElementById('prod-title').value = productData.title;
    if (prodDescription) prodDescription.value = productData.description || '';
    document.getElementById('prod-category').value = productData.category;
    document.getElementById('prod-instock').checked = productData.in_stock === 1;

    // Check discount status
    const hasDiscount = productData.original_price && productData.original_price > productData.price;
    if (hasDiscount) {
      document.getElementById('prod-price').value = productData.original_price;
      if (prodDiscountEnable) prodDiscountEnable.checked = true;
      if (prodDiscountFields) prodDiscountFields.classList.remove('hidden');
      if (prodDiscountToggleLabel) prodDiscountToggleLabel.textContent = 'Remise active';
      if (prodDiscountRegular) prodDiscountRegular.value = productData.original_price;
      if (prodDiscountFinal) prodDiscountFinal.value = productData.price;
      const pct = Math.round(((productData.original_price - productData.price) / productData.original_price) * 100);
      if (prodDiscountPercent) prodDiscountPercent.value = pct;
      updateDiscountPreview(productData.original_price, productData.price);
    } else {
      document.getElementById('prod-price').value = productData.price;
      cancelProductDiscount();
    }
    
    // Initialize active specs & colors
    activeSpecs = Array.isArray(productData.specs) ? [...productData.specs] : [];
    activeColors = Array.isArray(productData.colors) ? [...productData.colors] : [];

    const prodWeightInput = document.getElementById('prod-weight');
    if (prodWeightInput) {
      prodWeightInput.value = (productData.weight !== undefined && productData.weight !== null) ? productData.weight : 0.4;
    }

    // Initialize multi-image gallery
    if (Array.isArray(productData.images) && productData.images.length > 0) {
      currentProductImages = [...productData.images];
    } else if (productData.image_url) {
      currentProductImages = [productData.image_url];
    }
  } else {
    productModalTitle.textContent = 'Ajouter un produit (Import Chine)';
    productEditId.value = '';
    if (prodDescription) prodDescription.value = '';
    const prodWeightInput = document.getElementById('prod-weight');
    if (prodWeightInput) prodWeightInput.value = 0.4;
    document.getElementById('prod-instock').checked = true;
    cancelProductDiscount();
    activeSpecs = [];
    activeColors = [];
    currentProductImages = [];
  }

  // Reset volumetric calculator panel
  const volPanel = document.getElementById('volumetric-calc-panel');
  if (volPanel) volPanel.classList.add('hidden');
  const volBtnText = document.getElementById('volumetric-calc-btn-text');
  if (volBtnText) volBtnText.textContent = 'Calculateur volumétrique';

  renderProductGallery();
  renderActiveSpecs();
  renderActiveColors();
  productModalOverlay.classList.remove('hidden');
}

openAddProductBtn.addEventListener('click', () => openProductModal(false));
mobileAddProductBtn?.addEventListener('click', () => openProductModal(false));
closeProductModalBtn.addEventListener('click', () => productModalOverlay.classList.add('hidden'));
cancelProductModalBtn.addEventListener('click', () => productModalOverlay.classList.add('hidden'));

// Volumetric calculator toggle & live calculation
const toggleVolumetricBtn = document.getElementById('toggle-volumetric-calc-btn');
const volumetricPanel = document.getElementById('volumetric-calc-panel');
const volumetricBtnText = document.getElementById('volumetric-calc-btn-text');
const volLengthInput = document.getElementById('vol-length');
const volWidthInput = document.getElementById('vol-width');
const volHeightInput = document.getElementById('vol-height');
const volCalcResult = document.getElementById('vol-calc-result');
const applyVolumetricBtn = document.getElementById('apply-volumetric-btn');

function updateVolumetricWeight() {
  const l = parseFloat(volLengthInput?.value) || 0;
  const w = parseFloat(volWidthInput?.value) || 0;
  const h = parseFloat(volHeightInput?.value) || 0;
  if (l > 0 && w > 0 && h > 0) {
    const volWeight = Number(((l * w * h) / 5000).toFixed(2));
    if (volCalcResult) volCalcResult.textContent = `Poids calculé : ${volWeight} kg`;
    return volWeight;
  } else {
    if (volCalcResult) volCalcResult.textContent = 'Poids calculé : -- kg';
    return 0;
  }
}

if (toggleVolumetricBtn && volumetricPanel) {
  toggleVolumetricBtn.addEventListener('click', () => {
    volumetricPanel.classList.toggle('hidden');
    const isHidden = volumetricPanel.classList.contains('hidden');
    if (volumetricBtnText) {
      volumetricBtnText.textContent = isHidden ? 'Calculateur volumétrique' : 'Fermer le calculateur';
    }
  });
}

[volLengthInput, volWidthInput, volHeightInput].forEach(inp => {
  inp?.addEventListener('input', updateVolumetricWeight);
});

if (applyVolumetricBtn) {
  applyVolumetricBtn.addEventListener('click', () => {
    const volWeight = updateVolumetricWeight();
    if (volWeight > 0) {
      const prodWeightInput = document.getElementById('prod-weight');
      if (prodWeightInput) prodWeightInput.value = volWeight;
      if (volumetricPanel) volumetricPanel.classList.add('hidden');
      if (volumetricBtnText) volumetricBtnText.textContent = 'Calculateur volumétrique';
    } else {
      alert('Veuillez renseigner les 3 dimensions (Longueur, Largeur, Hauteur en cm).');
    }
  });
}

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

  const productModalError = document.getElementById('product-modal-error');
  const productModalErrorText = document.getElementById('product-modal-error-text');
  const saveProductBtn = document.getElementById('save-product-btn');
  const saveProductBtnText = document.getElementById('save-product-btn-text');

  function showProductError(msg) {
    if (productModalError && productModalErrorText) {
      productModalErrorText.textContent = msg;
      productModalError.classList.remove('hidden');
      productForm.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert(msg);
    }
  }

  if (productModalError) productModalError.classList.add('hidden');

  if (isUploadingImage) {
    showProductError('Veuillez patienter pendant la fin du téléversement de la photo.');
    return;
  }

  const id = productEditId.value;
  const title = document.getElementById('prod-title')?.value.trim();
  const description = prodDescription ? prodDescription.value.trim() : '';
  const category = document.getElementById('prod-category')?.value;
  const inStock = document.getElementById('prod-instock')?.checked;
  const imageUrl = prodImageUrl?.value.trim();
  const specs = [...activeSpecs];
  const colors = [...activeColors];
  const weight = parseFloat(document.getElementById('prod-weight')?.value) || 0.4;

  if (!title) {
    showProductError('Veuillez renseigner le titre du produit (en haut du formulaire).');
    const titleInput = document.getElementById('prod-title');
    if (titleInput) {
      titleInput.focus();
      titleInput.classList.add('border-red-400');
      setTimeout(() => titleInput.classList.remove('border-red-400'), 3000);
    }
    return;
  }

  if (!category) {
    showProductError('Veuillez sélectionner une catégorie pour ce produit.');
    document.getElementById('prod-category')?.focus();
    return;
  }

  // Pricing & Discounts
  const priceInput = document.getElementById('prod-price');
  let price = Number(priceInput?.value);
  let originalPrice = null;

  if (isNaN(price) || price < 500) {
    showProductError('Veuillez saisir un prix de vente normal valide (minimum 500 FCFA, chiffres uniquement).');
    if (priceInput) {
      priceInput.focus();
      priceInput.classList.add('border-red-400');
      setTimeout(() => priceInput.classList.remove('border-red-400'), 3000);
    }
    return;
  }

  if (prodDiscountEnable && prodDiscountEnable.checked) {
    const regularVal = Number(prodDiscountRegular.value) || price;
    const finalVal = Number(prodDiscountFinal.value);
    if (regularVal > 0 && finalVal > 0 && regularVal > finalVal) {
      originalPrice = regularVal;
      price = finalVal;
    }
  }

  if (currentProductImages.length === 0 && !imageUrl) {
    showProductError('Veuillez ajouter au moins une photo pour ce produit (ou renseigner une URL web).');
    return;
  }

  const primaryImage = currentProductImages[0] || imageUrl;
  const imagesList = currentProductImages.length > 0 ? currentProductImages : [imageUrl];

  const payload = { 
    title, 
    description, 
    category, 
    price, 
    originalPrice, 
    imageUrl: primaryImage, 
    images: imagesList, 
    specs, 
    colors, 
    weight,
    inStock 
  };

  if (saveProductBtn) saveProductBtn.disabled = true;
  if (saveProductBtnText) saveProductBtnText.textContent = 'Enregistrement en cours...';

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
      alert(`✓ Le produit "${title}" a été enregistré avec succès dans le catalogue !`);
    } else {
      const errData = await res.json();
      showProductError(`Erreur: ${errData.error || 'Impossible d’enregistrer le produit'}`);
    }
  } catch (err) {
    console.error('Erreur enregistrement produit:', err);
    showProductError('Erreur réseau lors de l’enregistrement');
  } finally {
    if (saveProductBtn) saveProductBtn.disabled = false;
    if (saveProductBtnText) saveProductBtnText.textContent = id ? 'Mettre à jour le produit' : 'Enregistrer le produit';
  }
});

// ==================== CATEGORY / RAYON MANAGEMENT ====================
async function loadAdminCategories() {
  if (!adminToken) return;
  try {
    const res = await fetch('/api/categories');
    if (!res.ok) return;
    currentCategories = await res.json();
    if (tabCategoriesBadge) {
      tabCategoriesBadge.textContent = currentCategories.length;
    }
    renderAdminCategories(currentCategories);
  } catch (err) {
    console.error('Erreur chargement catégories admin:', err);
  }
}

function renderAdminCategories(categories) {
  if (!adminCategoriesGrid) return;
  if (!categories || categories.length === 0) {
    adminCategoriesGrid.innerHTML = `
      <div class="col-span-full text-center py-10 bg-white rounded-2xl border border-gray-100 p-6 text-gray-400">
        <span class="material-symbols-outlined text-4xl mb-2 text-gray-300">category</span>
        <p class="text-xs sm:text-sm font-semibold text-gray-700">Aucun rayon configuré.</p>
      </div>
    `;
    return;
  }

  adminCategoriesGrid.innerHTML = categories.map(cat => {
    const count = cat.productCount || 0;
    const bannerHtml = cat.banner_url ? `
      <div class="w-full h-24 rounded-xl overflow-hidden mb-3 border border-gray-100 bg-gray-50">
        <img src="${escapeHtml(cat.banner_url)}" alt="${escapeHtml(cat.name)}" class="w-full h-full object-cover"/>
      </div>
    ` : '';

    return `
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-3 hover:shadow-md transition-all">
        <div>
          ${bannerHtml}
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2">
              <span class="w-9 h-9 rounded-xl bg-emerald-50 text-[#0d7252] flex items-center justify-center border border-emerald-200/60 shrink-0">
                <span class="material-symbols-outlined text-xl">${escapeHtml(cat.icon || 'category')}</span>
              </span>
              <div>
                <h4 class="text-sm font-extrabold text-gray-900 leading-tight">${escapeHtml(cat.name)}</h4>
                <a href="/category/${escapeHtml(cat.slug)}" target="_blank" class="text-[10px] font-mono text-gray-400 hover:text-[#0d7252] transition-colors flex items-center gap-0.5">
                  <span>/category/${escapeHtml(cat.slug)}</span>
                  <span class="material-symbols-outlined text-[11px]">open_in_new</span>
                </a>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${count > 0 ? 'bg-[#e6f7f0] text-[#0d7252]' : 'bg-gray-100 text-gray-500'}">
              ${count} ${count > 1 ? 'produits' : 'produit'}
            </span>
          </div>

          <p class="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            ${cat.description ? escapeHtml(cat.description) : '<em>Aucune description personnalisée.</em>'}
          </p>
        </div>

        <div class="pt-2 border-t border-gray-100 flex items-center gap-2">
          <a href="/category/${escapeHtml(cat.slug)}" target="_blank" class="py-1.5 px-3 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#0d7252] text-xs font-bold flex items-center justify-center gap-1 transition-colors" title="Voir la page dédiée du rayon">
            <span class="material-symbols-outlined text-[15px]">visibility</span>
            <span class="hidden sm:inline">Voir la page</span>
          </a>
          <button type="button" onclick="window.openEditCategoryModal && window.openEditCategoryModal(${cat.id})" class="flex-1 py-1.5 px-3 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-[15px]">edit</span>
            <span>Modifier</span>
          </button>
          <button type="button" onclick="window.handleDeleteCategory && window.handleDeleteCategory(${cat.id}, '${escapeHtml(cat.name)}', ${count})" class="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer" title="Supprimer ce rayon">
            <span class="material-symbols-outlined text-[17px]">delete</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openAddCategoryModal() {
  if (!categoryForm) return;
  categoryForm.reset();
  if (categoryEditId) categoryEditId.value = '';
  if (categoryModalTitle) categoryModalTitle.textContent = 'Nouveau Rayon';
  if (catIconPreview) {
    catIconPreview.innerHTML = '<span class="material-symbols-outlined text-xl">category</span>';
  }
  if (categoryModalOverlay) categoryModalOverlay.classList.remove('hidden');
}

window.openEditCategoryModal = function(id) {
  const cat = currentCategories.find(c => c.id === id);
  if (!cat || !categoryForm) return;

  categoryForm.reset();
  if (categoryEditId) categoryEditId.value = cat.id;
  if (categoryModalTitle) categoryModalTitle.textContent = `Modifier le Rayon : ${cat.name}`;
  if (catFormName) catFormName.value = cat.name || '';
  if (catFormSlug) catFormSlug.value = cat.slug || '';
  if (catFormIcon) catFormIcon.value = cat.icon || 'category';
  if (catFormDescription) catFormDescription.value = cat.description || '';
  if (catFormBanner) catFormBanner.value = cat.banner_url || '';
  if (catIconPreview) {
    catIconPreview.innerHTML = `<span class="material-symbols-outlined text-xl">${escapeHtml(cat.icon || 'category')}</span>`;
  }

  if (categoryModalOverlay) categoryModalOverlay.classList.remove('hidden');
};

function closeCategoryModal() {
  if (categoryModalOverlay) categoryModalOverlay.classList.add('hidden');
}

window.setCategoryIcon = function(icon) {
  if (catFormIcon) catFormIcon.value = icon;
  if (catIconPreview) {
    catIconPreview.innerHTML = `<span class="material-symbols-outlined text-xl">${escapeHtml(icon)}</span>`;
  }
};

window.handleDeleteCategory = async function(id, name, count) {
  if (count > 0) {
    alert(`Impossible de supprimer le rayon "${name}" car ${count} produit(s) y sont rattachés.\nVeuillez modifier ou supprimer ces produits au préalable.`);
    return;
  }

  if (!confirm(`Confirmez-vous la suppression du rayon "${name}" ?`)) return;

  try {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.ok) {
      await loadAdminCategories();
    } else {
      const err = await res.json();
      alert(`Erreur: ${err.error || 'Impossible de supprimer ce rayon'}`);
    }
  } catch (err) {
    alert('Erreur réseau lors de la suppression.');
  }
};

async function handleCategoryFormSubmit(e) {
  e.preventDefault();

  const id = categoryEditId.value;
  const name = catFormName.value.trim();
  const slug = catFormSlug.value.trim().toLowerCase();
  const icon = catFormIcon.value.trim() || 'category';
  const description = catFormDescription.value.trim();
  const banner_url = catFormBanner.value.trim() || null;

  if (!name || !slug) {
    alert('Veuillez renseigner le nom et le slug du rayon.');
    return;
  }

  const payload = { name, slug, icon, description, banner_url };

  try {
    const url = id ? `/api/admin/categories/${id}` : '/api/admin/categories';
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
      closeCategoryModal();
      await loadAdminCategories();
    } else {
      const errData = await res.json();
      alert(`Erreur: ${errData.error || 'Impossible d’enregistrer le rayon'}`);
    }
  } catch (err) {
    alert('Erreur réseau lors de l’enregistrement du rayon.');
  }
}

if (openAddCategoryBtn) openAddCategoryBtn.addEventListener('click', openAddCategoryModal);
if (closeCategoryModalBtn) closeCategoryModalBtn.addEventListener('click', closeCategoryModal);
if (cancelCategoryModalBtn) cancelCategoryModalBtn.addEventListener('click', closeCategoryModal);
if (categoryModalOverlay) {
  categoryModalOverlay.addEventListener('click', (e) => {
    if (e.target === categoryModalOverlay) closeCategoryModal();
  });
}
if (categoryForm) categoryForm.addEventListener('submit', handleCategoryFormSubmit);
if (catFormIcon) {
  catFormIcon.addEventListener('input', () => {
    window.setCategoryIcon(catFormIcon.value.trim() || 'category');
  });
}

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

    // 0. Announcement Bar (Ruban Défilant)
    if (currentCmsSettings.announcement_bar) {
      const ab = currentCmsSettings.announcement_bar;
      if (document.getElementById('cms-announcement-enabled')) {
        document.getElementById('cms-announcement-enabled').checked = ab.enabled !== false;
      }
      if (document.getElementById('cms-announcement-text')) {
        document.getElementById('cms-announcement-text').value = ab.text || '';
      }
      if (document.getElementById('cms-announcement-subtext')) {
        document.getElementById('cms-announcement-subtext').value = ab.secondaryText || '';
      }
    }

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
      if (document.getElementById('cms-hero-prop4-title')) document.getElementById('cms-hero-prop4-title').value = h.prop4Title || '';
      if (document.getElementById('cms-hero-prop4-sub')) document.getElementById('cms-hero-prop4-sub').value = h.prop4Sub || '';
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

    // 9. About Page Section
    if (currentCmsSettings.about_section) {
      const a = currentCmsSettings.about_section;
      if (document.getElementById('cms-about-badge')) document.getElementById('cms-about-badge').value = a.badge || '';
      if (document.getElementById('cms-about-title')) document.getElementById('cms-about-title').value = a.title || '';
      if (document.getElementById('cms-about-subtitle')) document.getElementById('cms-about-subtitle').value = a.subtitle || '';
      if (document.getElementById('cms-about-story-title')) document.getElementById('cms-about-story-title').value = a.storyTitle || '';
      if (document.getElementById('cms-about-story-p1')) document.getElementById('cms-about-story-p1').value = a.storyParagraph1 || '';
      if (document.getElementById('cms-about-story-p2')) document.getElementById('cms-about-story-p2').value = a.storyParagraph2 || '';
      if (document.getElementById('cms-about-story-p3')) document.getElementById('cms-about-story-p3').value = a.storyParagraph3 || '';
      if (document.getElementById('cms-about-mission-title')) document.getElementById('cms-about-mission-title').value = a.missionTitle || '';
      if (document.getElementById('cms-about-mission-text')) document.getElementById('cms-about-mission-text').value = a.missionText || '';
      if (document.getElementById('cms-about-stat1-num')) document.getElementById('cms-about-stat1-num').value = a.stat1Number || '';
      if (document.getElementById('cms-about-stat1-label')) document.getElementById('cms-about-stat1-label').value = a.stat1Label || '';
      if (document.getElementById('cms-about-stat2-num')) document.getElementById('cms-about-stat2-num').value = a.stat2Number || '';
      if (document.getElementById('cms-about-stat2-label')) document.getElementById('cms-about-stat2-label').value = a.stat2Label || '';
      if (document.getElementById('cms-about-stat3-num')) document.getElementById('cms-about-stat3-num').value = a.stat3Number || '';
      if (document.getElementById('cms-about-stat3-label')) document.getElementById('cms-about-stat3-label').value = a.stat3Label || '';
      if (document.getElementById('cms-about-stat4-num')) document.getElementById('cms-about-stat4-num').value = a.stat4Number || '';
      if (document.getElementById('cms-about-stat4-label')) document.getElementById('cms-about-stat4-label').value = a.stat4Label || '';
    }

    // 10. Cargo Rates & Transit Settings
    if (currentCmsSettings.cargo_settings) {
      const c = currentCmsSettings.cargo_settings;
      if (document.getElementById('cms-cargo-normal-rate')) document.getElementById('cms-cargo-normal-rate').value = c.normalRate ?? 10000;
      if (document.getElementById('cms-cargo-normal-delay')) document.getElementById('cms-cargo-normal-delay').value = c.normalDelay || '2 semaines';
      if (document.getElementById('cms-cargo-express-rate')) document.getElementById('cms-cargo-express-rate').value = c.expressRate ?? 13500;
      if (document.getElementById('cms-cargo-express-delay')) document.getElementById('cms-cargo-express-delay').value = c.expressDelay || '1 semaine';
      if (document.getElementById('cms-cargo-min-weight')) document.getElementById('cms-cargo-min-weight').value = c.minWeight ?? 0.1;
    }

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
document.getElementById('save-cms-announcement-btn')?.addEventListener('click', () => {
  const payload = {
    enabled: document.getElementById('cms-announcement-enabled') ? document.getElementById('cms-announcement-enabled').checked : true,
    text: document.getElementById('cms-announcement-text')?.value.trim() || '🇨🇳 Import direct usine Shenzhen → 🇬🇦 Gabon | Fret cargo aérien au poids exact (10 000 FCFA/kg) | Airtel, Moov & Carte Bancaire',
    secondaryText: document.getElementById('cms-announcement-subtext')?.value.trim() || ''
  };
  saveCmsSection('announcement_bar', payload, 'cms-announcement-saved');
});

document.getElementById('save-cms-cargo-btn')?.addEventListener('click', () => {
  const payload = {
    normalRate: Number(document.getElementById('cms-cargo-normal-rate')?.value) || 10000,
    normalDelay: document.getElementById('cms-cargo-normal-delay')?.value.trim() || '2 semaines',
    expressRate: Number(document.getElementById('cms-cargo-express-rate')?.value) || 13500,
    expressDelay: document.getElementById('cms-cargo-express-delay')?.value.trim() || '1 semaine',
    minWeight: parseFloat(document.getElementById('cms-cargo-min-weight')?.value) || 0.1
  };
  saveCmsSection('cargo_settings', payload, 'cms-cargo-saved');
});

document.getElementById('save-cms-hero-btn')?.addEventListener('click', () => {
  const payload = {
    badge: document.getElementById('cms-hero-badge')?.value.trim() || '✦ Nouveauté',
    title: document.getElementById('cms-hero-title')?.value.trim() || 'La technologie\nà portée de main',
    subtitle: document.getElementById('cms-hero-subtitle')?.value.trim() || '',
    ctaText: document.getElementById('cms-hero-cta-text')?.value.trim() || 'Découvrir',
    ctaLink: document.getElementById('cms-hero-cta-link')?.value.trim() || '/categories',
    imageUrl: document.getElementById('cms-hero-img-url')?.value.trim() || '/images/hero-devices.jpg',
    prop1Title: document.getElementById('cms-hero-prop1-title')?.value.trim() || 'Livraison rapide',
    prop1Sub: document.getElementById('cms-hero-prop1-sub')?.value.trim() || 'en 24/48h',
    prop2Title: document.getElementById('cms-hero-prop2-title')?.value.trim() || 'Paiement sécurisé',
    prop2Sub: document.getElementById('cms-hero-prop2-sub')?.value.trim() || '100% fiable',
    prop3Title: document.getElementById('cms-hero-prop3-title')?.value.trim() || 'Service client',
    prop3Sub: document.getElementById('cms-hero-prop3-sub')?.value.trim() || 'dédié 7j/7',
    prop4Title: document.getElementById('cms-hero-prop4-title')?.value.trim() || '100% Original',
    prop4Sub: document.getElementById('cms-hero-prop4-sub')?.value.trim() || 'Garantie certifiée'
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
    buttonText: document.getElementById('cms-contact-btn-text')?.value.trim() || 'Écrivez-nous sur WhatsApp'
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

document.getElementById('save-cms-about-btn')?.addEventListener('click', () => {
  const payload = {
    badge: document.getElementById('cms-about-badge')?.value.trim() || 'Circuit Court Shenzhen - Gabon',
    title: document.getElementById('cms-about-title')?.value.trim() || 'Vos équipements high-tech livrés au Gabon sans marge intermédiaire',
    subtitle: document.getElementById('cms-about-subtitle')?.value.trim() || '',
    storyTitle: document.getElementById('cms-about-story-title')?.value.trim() || 'Pourquoi WuazeShop existe',
    storyParagraph1: document.getElementById('cms-about-story-p1')?.value.trim() || '',
    storyParagraph2: document.getElementById('cms-about-story-p2')?.value.trim() || '',
    storyParagraph3: document.getElementById('cms-about-story-p3')?.value.trim() || '',
    missionTitle: document.getElementById('cms-about-mission-title')?.value.trim() || 'Nos engagements de service',
    missionText: document.getElementById('cms-about-mission-text')?.value.trim() || '',
    stat1Number: document.getElementById('cms-about-stat1-num')?.value.trim() || '100%',
    stat1Label: document.getElementById('cms-about-stat1-label')?.value.trim() || 'Appareils neufs sous blister d\'origine',
    stat2Number: document.getElementById('cms-about-stat2-num')?.value.trim() || '1-2 sem',
    stat2Label: document.getElementById('cms-about-stat2-label')?.value.trim() || 'Délai moyen selon formule cargo',
    stat3Number: document.getElementById('cms-about-stat3-num')?.value.trim() || '1 An',
    stat3Label: document.getElementById('cms-about-stat3-label')?.value.trim() || 'Garantie constructeur appliquée',
    stat4Number: document.getElementById('cms-about-stat4-num')?.value.trim() || '0 FCFA',
    stat4Label: document.getElementById('cms-about-stat4-label')?.value.trim() || 'Frais cachés à l\'arrivée'
  };
  saveCmsSection('about_section', payload, 'cms-about-saved');
});

// ==================== QUICK DISCOUNT MODAL LOGIC ====================
let quickDiscountProduct = null;
const quickDiscountModalOverlay = document.getElementById('quick-discount-modal-overlay');
const closeQuickDiscountModalBtn = document.getElementById('close-quick-discount-modal-btn');
const cancelQuickDiscountBtn = document.getElementById('cancel-quick-discount-btn');
const saveQuickDiscountBtn = document.getElementById('save-quick-discount-btn');
const quickDiscountRemoveBtn = document.getElementById('quick-discount-remove-btn');

window.openQuickDiscountModal = function(productId) {
  quickDiscountProduct = currentAdminProducts.find(p => p.id === productId);
  if (!quickDiscountProduct) return;

  document.getElementById('quick-discount-prod-id').value = quickDiscountProduct.id;
  document.getElementById('quick-discount-prod-title').textContent = quickDiscountProduct.title;
  document.getElementById('quick-discount-prod-img').src = quickDiscountProduct.image_url;

  const hasDiscount = quickDiscountProduct.original_price && quickDiscountProduct.original_price > quickDiscountProduct.price;
  const basePrice = hasDiscount ? quickDiscountProduct.original_price : quickDiscountProduct.price;
  
  document.getElementById('quick-discount-prod-current-price').textContent = formatFCFA(basePrice);
  const badgeEl = document.getElementById('quick-discount-current-badge');
  if (hasDiscount) {
    const currentPct = Math.round(((quickDiscountProduct.original_price - quickDiscountProduct.price) / quickDiscountProduct.original_price) * 100);
    badgeEl.textContent = `Promo active (-${currentPct}%)`;
    badgeEl.classList.remove('hidden');
    setQuickDiscountPct(currentPct);
  } else {
    badgeEl.classList.add('hidden');
    setQuickDiscountPct(15);
  }

  if (quickDiscountModalOverlay) quickDiscountModalOverlay.classList.remove('hidden');
};

function updateQuickDiscountPreview(basePrice, finalPrice) {
  const strikeEl = document.getElementById('quick-preview-strike');
  const finalEl = document.getElementById('quick-preview-final');
  const savingsEl = document.getElementById('quick-preview-savings');

  if (strikeEl) strikeEl.textContent = formatFCFA(basePrice);
  if (finalEl) finalEl.textContent = formatFCFA(finalPrice);
  const saving = basePrice - finalPrice;
  if (savingsEl) savingsEl.textContent = `Économie : ${formatFCFA(saving)}`;
}

window.setQuickDiscountPct = function(pct) {
  if (!quickDiscountProduct) return;
  const pctInput = document.getElementById('quick-discount-pct-input');
  const priceInput = document.getElementById('quick-discount-price-input');
  
  if (pctInput) pctInput.value = pct;
  const hasDiscount = quickDiscountProduct.original_price && quickDiscountProduct.original_price > quickDiscountProduct.price;
  const basePrice = hasDiscount ? quickDiscountProduct.original_price : quickDiscountProduct.price;
  
  const finalPrice = Math.round(basePrice * (1 - (pct / 100)));
  if (priceInput) priceInput.value = finalPrice;

  updateQuickDiscountPreview(basePrice, finalPrice);
};

document.getElementById('quick-discount-pct-input')?.addEventListener('input', (e) => {
  if (!quickDiscountProduct) return;
  const pct = Number(e.target.value) || 0;
  const hasDiscount = quickDiscountProduct.original_price && quickDiscountProduct.original_price > quickDiscountProduct.price;
  const basePrice = hasDiscount ? quickDiscountProduct.original_price : quickDiscountProduct.price;
  
  if (pct > 0 && pct < 100) {
    const finalPrice = Math.round(basePrice * (1 - (pct / 100)));
    const priceInput = document.getElementById('quick-discount-price-input');
    if (priceInput) priceInput.value = finalPrice;
    updateQuickDiscountPreview(basePrice, finalPrice);
  }
});

document.getElementById('quick-discount-price-input')?.addEventListener('input', (e) => {
  if (!quickDiscountProduct) return;
  const finalPrice = Number(e.target.value) || 0;
  const hasDiscount = quickDiscountProduct.original_price && quickDiscountProduct.original_price > quickDiscountProduct.price;
  const basePrice = hasDiscount ? quickDiscountProduct.original_price : quickDiscountProduct.price;
  
  if (finalPrice > 0 && finalPrice < basePrice) {
    const pct = Math.round(((basePrice - finalPrice) / basePrice) * 100);
    const pctInput = document.getElementById('quick-discount-pct-input');
    if (pctInput) pctInput.value = pct;
    updateQuickDiscountPreview(basePrice, finalPrice);
  }
});

if (closeQuickDiscountModalBtn) {
  closeQuickDiscountModalBtn.addEventListener('click', () => quickDiscountModalOverlay?.classList.add('hidden'));
}
if (cancelQuickDiscountBtn) {
  cancelQuickDiscountBtn.addEventListener('click', () => quickDiscountModalOverlay?.classList.add('hidden'));
}

if (saveQuickDiscountBtn) {
  saveQuickDiscountBtn.addEventListener('click', async () => {
    if (!quickDiscountProduct) return;
    const pct = Number(document.getElementById('quick-discount-pct-input')?.value);
    const finalPrice = Number(document.getElementById('quick-discount-price-input')?.value);
    const hasDiscount = quickDiscountProduct.original_price && quickDiscountProduct.original_price > quickDiscountProduct.price;
    const basePrice = hasDiscount ? quickDiscountProduct.original_price : quickDiscountProduct.price;

    try {
      const res = await fetch(`/api/admin/products/${quickDiscountProduct.id}/discount`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          discountPercent: pct,
          discountedPrice: finalPrice,
          originalPrice: basePrice
        })
      });

      if (res.ok) {
        quickDiscountModalOverlay?.classList.add('hidden');
        await loadAdminProducts();
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur lors de l’application de la remise');
      }
    } catch (e) {
      console.error(e);
      alert('Erreur réseau');
    }
  });
}

if (quickDiscountRemoveBtn) {
  quickDiscountRemoveBtn.addEventListener('click', async () => {
    if (!quickDiscountProduct) return;
    if (!confirm(`Supprimer la remise sur "${quickDiscountProduct.title}" et revenir au prix normal ?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${quickDiscountProduct.id}/discount`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ action: 'remove' })
      });

      if (res.ok) {
        quickDiscountModalOverlay?.classList.add('hidden');
        await loadAdminProducts();
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur lors de la suppression de la remise');
      }
    } catch (e) {
      console.error(e);
      alert('Erreur réseau');
    }
  });
}

// ==================== BATCH DISCOUNT MODAL LOGIC ====================
const batchDiscountModalOverlay = document.getElementById('batch-discount-modal-overlay');
const openBatchDiscountBtn = document.getElementById('open-batch-discount-btn');
const closeBatchDiscountModalBtn = document.getElementById('close-batch-discount-modal-btn');
const cancelBatchDiscountBtn = document.getElementById('cancel-batch-discount-btn');
const submitBatchDiscountBtn = document.getElementById('submit-batch-discount-btn');
const batchDiscountRemoveAllBtn = document.getElementById('batch-discount-remove-all-btn');
const batchDiscountPctInput = document.getElementById('batch-discount-pct-input');
const batchDiscountCategory = document.getElementById('batch-discount-category');

if (openBatchDiscountBtn) {
  openBatchDiscountBtn.addEventListener('click', () => {
    if (activeCatFilter && activeCatFilter !== 'all' && batchDiscountCategory) {
      batchDiscountCategory.value = activeCatFilter;
    }
    setBatchDiscountPct(15);
    if (batchDiscountModalOverlay) batchDiscountModalOverlay.classList.remove('hidden');
  });
}

window.setBatchDiscountPct = function(pct) {
  if (batchDiscountPctInput) batchDiscountPctInput.value = pct;
};

if (closeBatchDiscountModalBtn) {
  closeBatchDiscountModalBtn.addEventListener('click', () => batchDiscountModalOverlay?.classList.add('hidden'));
}
if (cancelBatchDiscountBtn) {
  cancelBatchDiscountBtn.addEventListener('click', () => batchDiscountModalOverlay?.classList.add('hidden'));
}

if (submitBatchDiscountBtn) {
  submitBatchDiscountBtn.addEventListener('click', async () => {
    const category = batchDiscountCategory?.value || 'all';
    const discountPercent = Number(batchDiscountPctInput?.value);

    if (!discountPercent || discountPercent <= 0 || discountPercent >= 100) {
      alert('Veuillez saisir un pourcentage valide (entre 1% et 99%).');
      return;
    }

    const catName = batchDiscountCategory ? batchDiscountCategory.options[batchDiscountCategory.selectedIndex].text : 'les articles';
    if (!confirm(`Confirmez-vous l'application d'une remise de -${discountPercent}% sur ${catName} ?`)) {
      return;
    }

    try {
      submitBatchDiscountBtn.disabled = true;
      submitBatchDiscountBtn.textContent = 'Application en cours...';

      const res = await fetch('/api/admin/products/batch-discount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ category, discountPercent })
      });

      const data = await res.json();
      if (res.ok) {
        batchDiscountModalOverlay?.classList.add('hidden');
        alert(data.message || 'Remises appliquées avec succès !');
        await loadAdminProducts();
      } else {
        alert(data.error || 'Erreur lors de l’opération');
      }
    } catch (e) {
      console.error(e);
      alert('Erreur réseau');
    } finally {
      submitBatchDiscountBtn.disabled = false;
      submitBatchDiscountBtn.innerHTML = '<span class="material-symbols-outlined text-sm">bolt</span><span>Appliquer l\'opération</span>';
    }
  });
}

if (batchDiscountRemoveAllBtn) {
  batchDiscountRemoveAllBtn.addEventListener('click', async () => {
    const category = batchDiscountCategory?.value || 'all';
    const catName = batchDiscountCategory ? batchDiscountCategory.options[batchDiscountCategory.selectedIndex].text : 'la sélection';

    if (!confirm(`Voulez-vous réinitialiser et retirer TOUTES les remises sur ${catName} ? Tous les articles reviendront à leur prix normal.`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/products/batch-discount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ category, action: 'remove' })
      });

      const data = await res.json();
      if (res.ok) {
        batchDiscountModalOverlay?.classList.add('hidden');
        alert(data.message || 'Toutes les remises ont été réinitialisées.');
        await loadAdminProducts();
      } else {
        alert(data.error || 'Erreur');
      }
    } catch (e) {
      console.error(e);
      alert('Erreur réseau');
    }
  });
}

// ==================== COLLABORATOR MANAGEMENT ====================

function renderAdminUserProfile() {
  if (!currentAdminUser) return;
  const name = currentAdminUser.fullName || currentAdminUser.full_name || currentAdminUser.username || currentAdminUser.email || 'Admin';
  const role = currentAdminUser.role || 'SUPER_ADMIN';

  if (adminUserName) adminUserName.textContent = name;
  if (adminUserRole) {
    adminUserRole.textContent = role;
    if (role === 'SUPER_ADMIN') {
      adminUserRole.className = 'text-[9px] font-black uppercase text-purple-700';
    } else if (role === 'GESTIONNAIRE') {
      adminUserRole.className = 'text-[9px] font-black uppercase text-[#0d7252]';
    } else {
      adminUserRole.className = 'text-[9px] font-black uppercase text-blue-700';
    }
  }
  if (adminUserAvatar) {
    const initial = (name.trim()[0] || 'A').toUpperCase();
    adminUserAvatar.textContent = initial;
    if (role === 'SUPER_ADMIN') {
      adminUserAvatar.className = 'w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center uppercase shadow-2xs';
    } else if (role === 'GESTIONNAIRE') {
      adminUserAvatar.className = 'w-7 h-7 rounded-full bg-emerald-100 text-[#0d7252] font-black text-xs flex items-center justify-center uppercase shadow-2xs';
    } else {
      adminUserAvatar.className = 'w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center uppercase shadow-2xs';
    }
  }

  // Protection d'accès : Seul le SUPER_ADMIN (fondateur) peut gérer l'équipe & les collaborateurs
  const isSuperAdmin = role === 'SUPER_ADMIN';
  if (tabTeamBtn) {
    if (isSuperAdmin) {
      tabTeamBtn.classList.remove('hidden');
    } else {
      tabTeamBtn.classList.add('hidden');
    }
  }
  if (mobileTabTeamBtn) {
    if (isSuperAdmin) {
      mobileTabTeamBtn.classList.remove('hidden');
    } else {
      mobileTabTeamBtn.classList.add('hidden');
    }
  }

  // Si l'utilisateur connecté n'est pas Super Admin et qu'il est sur l'onglet équipe, le rediriger
  if (!isSuperAdmin && tabTeamContent && !tabTeamContent.classList.contains('hidden')) {
    switchTab('orders');
  }

  // Restrictions spécifiques pour l'Agent Logistique
  const openBatchDiscountBtn = document.getElementById('open-batch-discount-btn');
  if (role === 'AGENT') {
    if (tabCmsBtn) tabCmsBtn.classList.add('hidden');
    if (mobileTabCmsBtn) mobileTabCmsBtn.classList.add('hidden');
    if (openBatchDiscountBtn) openBatchDiscountBtn.classList.add('hidden');
  } else {
    if (tabCmsBtn) tabCmsBtn.classList.remove('hidden');
    if (mobileTabCmsBtn) mobileTabCmsBtn.classList.remove('hidden');
    if (openBatchDiscountBtn) openBatchDiscountBtn.classList.remove('hidden');
  }
}

async function loadCollaborators() {
  if (!adminToken) return;
  try {
    const res = await fetch('/api/admin/collaborators', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.ok) {
      currentCollaborators = await res.json();
      updateTeamStats();
      renderCollaborators();
    } else if (res.status === 401) {
      sessionStorage.removeItem('wuazeshop_admin_token');
      adminToken = null;
      currentAdminUser = null;
      showLogin();
    }
  } catch (err) {
    console.error('Erreur chargement collaborateurs:', err);
  }
}

function updateTeamStats() {
  const total = currentCollaborators.length;
  const superadmins = currentCollaborators.filter(c => c.role === 'SUPER_ADMIN').length;
  const gestionnaires = currentCollaborators.filter(c => c.role === 'GESTIONNAIRE').length;
  const agents = currentCollaborators.filter(c => c.role === 'AGENT').length;

  if (tabTeamBadge) tabTeamBadge.textContent = total;
  if (teamStatTotal) teamStatTotal.textContent = total;
  if (teamStatSuperadmin) teamStatSuperadmin.textContent = superadmins;
  if (teamStatGestionnaires) teamStatGestionnaires.textContent = gestionnaires;
  if (teamStatAgents) teamStatAgents.textContent = agents;
}

function renderCollaborators() {
  if (!adminCollaboratorsGrid) return;

  const query = (teamSearchInput?.value || '').trim().toLowerCase();

  const filtered = currentCollaborators.filter(collab => {
    // Role filter
    if (activeCollabFilter !== 'all' && collab.role !== activeCollabFilter) {
      return false;
    }
    // Search query
    if (query) {
      const name = (collab.full_name || '').toLowerCase();
      const email = (collab.email || '').toLowerCase();
      const user = (collab.username || '').toLowerCase();
      return name.includes(query) || email.includes(query) || user.includes(query);
    }
    return true;
  });

  if (filtered.length === 0) {
    adminCollaboratorsGrid.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-3">
        <div class="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto">
          <span class="material-symbols-outlined text-3xl">group_off</span>
        </div>
        <h4 class="font-bold text-gray-800 text-sm">Aucun collaborateur trouvé</h4>
        <p class="text-xs text-gray-500 max-w-sm mx-auto">
          Aucun membre de l'équipe ne correspond aux critères sélectionnés. Vous pouvez ajouter un nouveau collaborateur avec le bouton ci-dessus.
        </p>
      </div>
    `;
    return;
  }

  adminCollaboratorsGrid.innerHTML = filtered.map(collab => {
    const isCurrent = currentAdminUser && (currentAdminUser.id === collab.id || currentAdminUser.userId === collab.id);
    const roleConfig = {
      SUPER_ADMIN: {
        label: 'Super Admin',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
        avatarClass: 'bg-purple-100 text-purple-700',
        icon: 'military_tech'
      },
      GESTIONNAIRE: {
        label: 'Gestionnaire',
        badgeClass: 'bg-emerald-100 text-[#0d7252] border-emerald-200',
        avatarClass: 'bg-emerald-100 text-[#0d7252]',
        icon: 'store'
      },
      AGENT: {
        label: 'Agent Logistique',
        badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
        avatarClass: 'bg-blue-100 text-blue-700',
        icon: 'local_shipping'
      }
    }[collab.role] || {
      label: collab.role,
      badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
      avatarClass: 'bg-gray-100 text-gray-700',
      icon: 'person'
    };

    const initial = (collab.full_name || collab.username || collab.email || 'A')[0].toUpperCase();
    const isActive = Boolean(collab.is_active);
    const formattedLastLogin = collab.last_login_at 
      ? new Date(collab.last_login_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : 'Jamais connecté';
    const formattedCreated = collab.created_at
      ? new Date(collab.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Récemment';

    let permsList = [];
    try {
      permsList = typeof collab.permissions === 'string' ? JSON.parse(collab.permissions) : (collab.permissions || []);
    } catch(e) { permsList = []; }

    const permLabels = {
      orders: 'Commandes',
      products: 'Catalogue',
      discounts: 'Remises',
      cms: 'Vitrine CMS'
    };

    return `
      <div class="bg-white rounded-3xl p-5 border border-gray-100/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
        <div>
          <!-- Top Row: Avatar + Role Badge + Current User Pill -->
          <div class="flex items-start justify-between gap-3 mb-3.5">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl ${roleConfig.avatarClass} font-black text-lg flex items-center justify-center uppercase shadow-2xs shrink-0">
                ${initial}
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <h4 class="font-extrabold text-gray-900 text-sm leading-tight">${escapeHtml(collab.full_name || collab.username)}</h4>
                  ${isCurrent ? `<span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-gray-900 text-white">Vous</span>` : ''}
                </div>
                <span class="text-[11px] text-gray-400 font-medium">@${escapeHtml(collab.username || 'user')}</span>
              </div>
            </div>

            <!-- Role Badge -->
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${roleConfig.badgeClass} shrink-0">
              <span class="material-symbols-outlined text-xs">${roleConfig.icon}</span>
              <span>${roleConfig.label}</span>
            </span>
          </div>

          <!-- Contact Details -->
          <div class="space-y-2 py-2.5 border-y border-gray-100/80 text-xs">
            <div class="flex items-center gap-2 text-gray-600 truncate">
              <span class="material-symbols-outlined text-gray-400 text-base shrink-0">mail</span>
              <span class="truncate font-medium">${escapeHtml(collab.email)}</span>
            </div>
            ${collab.phone ? `
            <div class="flex items-center gap-2 text-gray-600 truncate">
              <span class="material-symbols-outlined text-[#25D366] text-base shrink-0">chat</span>
              <span class="truncate font-medium">${escapeHtml(collab.phone)}</span>
            </div>
            ` : ''}

            <!-- Permissions / Modules autorisés -->
            ${permsList && permsList.length > 0 ? `
            <div class="pt-1">
              <span class="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">Accès autorisés :</span>
              <div class="flex flex-wrap gap-1">
                ${permsList.map(p => `
                  <span class="px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-100 flex items-center gap-0.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    <span>${escapeHtml(permLabels[p] || p)}</span>
                  </span>
                `).join('')}
              </div>
            </div>
            ` : ''}

            <div class="flex items-center justify-between text-[11px] text-gray-400 pt-1">
              <div class="flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">history</span>
                <span>${formattedLastLogin}</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">calendar_today</span>
                <span>${formattedCreated}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Actions Row: Status Toggle & Buttons -->
        <div class="mt-4 pt-3 flex items-center justify-between gap-2">
          <!-- Active Status Badge & Toggle -->
          <button 
            type="button" 
            onclick="toggleCollaboratorStatus(${collab.id}, ${isActive})"
            ${isCurrent ? 'disabled title="Vous ne pouvez pas modifier votre propre statut"' : 'title="Cliquer pour activer/désactiver le compte"'}
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
              isActive 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100' 
                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
            } ${isCurrent ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}"
          >
            <span class="w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}"></span>
            <span>${isActive ? 'Actif' : 'Désactivé'}</span>
          </button>

          <!-- Action Buttons: Resend Invite, Edit, Delete -->
          <div class="flex items-center gap-1.5">
            <button 
              type="button" 
              onclick="resendInvite(${collab.id})"
              class="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#0d7252] flex items-center justify-center transition-colors cursor-pointer border border-emerald-200/70 shadow-2xs" 
              title="Partager / Renvoyer le lien et les identifiants d'accès"
            >
              <span class="material-symbols-outlined text-sm">share</span>
            </button>
            <button 
              type="button" 
              onclick="editCollaboratorById(${collab.id})"
              class="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors cursor-pointer border border-gray-200/60" 
              title="Modifier les informations ou permissions"
            >
              <span class="material-symbols-outlined text-sm">edit</span>
            </button>
            <button 
              type="button" 
              onclick="deleteCollaborator(${collab.id}, '${escapeHtml(collab.full_name || collab.username)}')"
              ${isCurrent ? 'disabled title="Vous ne pouvez pas supprimer votre propre compte"' : 'title="Supprimer ce collaborateur"'}
              class="w-8 h-8 rounded-full ${
                isCurrent 
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                  : 'bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer border border-red-100'
              } flex items-center justify-center transition-colors"
            >
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>

      </div>
    `;
  }).join('');
}

function generateSecurePassword() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%';
  let pass = 'Wuaze#';
  for (let i = 0; i < 3; i++) {
    pass += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  for (let i = 0; i < 2; i++) {
    pass += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return pass;
}

function applyRolePermissionsPreset(role) {
  if (role === 'SUPER_ADMIN') {
    if (permOrders) permOrders.checked = true;
    if (permProducts) permProducts.checked = true;
    if (permDiscounts) permDiscounts.checked = true;
    if (permCms) permCms.checked = true;
  } else if (role === 'AGENT') {
    if (permOrders) permOrders.checked = true;
    if (permProducts) permProducts.checked = false;
    if (permDiscounts) permDiscounts.checked = false;
    if (permCms) permCms.checked = false;
  } else {
    // GESTIONNAIRE
    if (permOrders) permOrders.checked = true;
    if (permProducts) permProducts.checked = true;
    if (permDiscounts) permDiscounts.checked = true;
    if (permCms) permCms.checked = false;
  }
}

function openCollaboratorModal(collab = null) {
  if (!collaboratorModalOverlay) return;
  if (collaboratorModalError) collaboratorModalError.classList.add('hidden');

  if (collab) {
    if (collaboratorModalTitle) collaboratorModalTitle.textContent = 'Modifier le Collaborateur';
    if (collaboratorEditId) collaboratorEditId.value = collab.id;
    if (collabFullname) collabFullname.value = collab.full_name || '';
    if (collabEmail) collabEmail.value = collab.email || '';
    if (collabPhone) collabPhone.value = collab.phone || '';
    if (collabUsername) collabUsername.value = collab.username || '';
    if (collabRole) collabRole.value = collab.role || 'GESTIONNAIRE';

    let perms = [];
    try {
      perms = typeof collab.permissions === 'string' ? JSON.parse(collab.permissions) : (collab.permissions || []);
    } catch(e) { perms = []; }

    if (perms.length > 0) {
      if (permOrders) permOrders.checked = perms.includes('orders');
      if (permProducts) permProducts.checked = perms.includes('products');
      if (permDiscounts) permDiscounts.checked = perms.includes('discounts');
      if (permCms) permCms.checked = perms.includes('cms');
    } else {
      applyRolePermissionsPreset(collab.role || 'GESTIONNAIRE');
    }

    if (collabPassword) {
      collabPassword.value = '';
      collabPassword.required = false;
    }
    if (collabPasswordRequiredLabel) collabPasswordRequiredLabel.classList.add('hidden');
    if (collabPasswordHint) collabPasswordHint.classList.remove('hidden');
    if (collabIsActive) collabIsActive.checked = Boolean(collab.is_active);
  } else {
    if (collaboratorModalTitle) collaboratorModalTitle.textContent = 'Nouveau Collaborateur';
    if (collaboratorEditId) collaboratorEditId.value = '';
    if (collabFullname) collabFullname.value = '';
    if (collabEmail) collabEmail.value = '';
    if (collabPhone) collabPhone.value = '';
    if (collabUsername) collabUsername.value = '';
    if (collabRole) collabRole.value = 'GESTIONNAIRE';
    applyRolePermissionsPreset('GESTIONNAIRE');

    const autoPass = generateSecurePassword();
    if (collabPassword) {
      collabPassword.value = autoPass;
      collabPassword.type = 'text';
      collabPassword.required = true;
    }
    if (toggleCollabPasswordBtn) {
      toggleCollabPasswordBtn.innerHTML = '<span class="material-symbols-outlined text-lg">visibility_off</span>';
    }
    if (collabPasswordRequiredLabel) collabPasswordRequiredLabel.classList.remove('hidden');
    if (collabPasswordHint) collabPasswordHint.classList.add('hidden');
    if (collabIsActive) collabIsActive.checked = true;
  }

  collaboratorModalOverlay.classList.remove('hidden');
}

window.openCollaboratorModal = openCollaboratorModal;

function closeCollaboratorModal() {
  if (!collaboratorModalOverlay) return;
  collaboratorModalOverlay.classList.add('hidden');
  if (collaboratorModalError) collaboratorModalError.classList.add('hidden');
}

window.closeCollaboratorModal = closeCollaboratorModal;

function showInviteModal(invitation, collabName, collabRole) {
  if (!collaboratorInviteModal || !invitation) return;

  const roleLabels = {
    SUPER_ADMIN: 'Super Administrateur',
    GESTIONNAIRE: 'Gestionnaire',
    AGENT: 'Agent Logistique'
  };

  if (inviteCollabName) inviteCollabName.textContent = collabName || 'Collaborateur';
  if (inviteCollabRole) inviteCollabRole.textContent = roleLabels[collabRole] || collabRole || 'Membre de l\'équipe';
  if (inviteCollabUrl) inviteCollabUrl.textContent = invitation.inviteUrl || `${window.location.origin}/admin.html`;
  if (inviteCollabId) inviteCollabId.textContent = invitation.loginId || '';
  if (inviteCollabPassword) inviteCollabPassword.textContent = invitation.tempPassword || '***';

  currentInviteShareText = invitation.fullShareText || '';

  if (shareWhatsappInviteBtn) {
    shareWhatsappInviteBtn.href = invitation.directWhatsAppUrl || '#';
  }
  if (shareMailInviteBtn) {
    shareMailInviteBtn.href = invitation.mailtoUrl || '#';
  }

  if (copyToast) copyToast.classList.add('hidden');
  collaboratorInviteModal.classList.remove('hidden');
}

function closeInviteModal() {
  if (collaboratorInviteModal) {
    collaboratorInviteModal.classList.add('hidden');
  }
}

window.copyInviteElement = async function(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const text = (el.textContent || el.innerText || '').trim();
  try {
    await navigator.clipboard.writeText(text);
    if (copyToast) {
      copyToast.textContent = `✓ Copié : "${text.slice(0, 32)}${text.length > 32 ? '...' : ''}"`;
      copyToast.classList.remove('hidden');
      setTimeout(() => copyToast.classList.add('hidden'), 3000);
    }
  } catch(e) {
    console.error('Clipboard copy error', e);
  }
};

window.resendInvite = async function(collabId) {
  if (!adminToken) return;
  try {
    const res = await fetch(`/api/admin/collaborators/${collabId}/resend-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const data = await res.json();
    if (res.ok && data.invitation) {
      const collab = currentCollaborators.find(c => c.id === collabId);
      showInviteModal(data.invitation, collab?.full_name || collab?.username, collab?.role);
    } else {
      alert(data.error || 'Impossible de générer l\'invitation.');
    }
  } catch (err) {
    console.error('Erreur renvoi invitation:', err);
    alert('Erreur réseau');
  }
};

window.editCollaboratorById = function(id) {
  const collab = currentCollaborators.find(c => c.id === id);
  if (collab) {
    openCollaboratorModal(collab);
  }
};

window.toggleCollaboratorStatus = async function(id, currentStatus) {
  if (!adminToken) return;
  const isCurrent = currentAdminUser && (currentAdminUser.id === id || currentAdminUser.userId === id);
  if (isCurrent && currentStatus) {
    alert('Vous ne pouvez pas désactiver votre propre compte.');
    return;
  }

  try {
    const res = await fetch(`/api/admin/collaborators/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isActive: !currentStatus })
    });
    const data = await res.json();
    if (res.ok) {
      await loadCollaborators();
    } else {
      alert(data.error || 'Erreur lors du changement de statut');
    }
  } catch (err) {
    console.error('Erreur toggle statut:', err);
    alert('Erreur réseau');
  }
};

window.deleteCollaborator = async function(id, name) {
  if (!adminToken) return;
  const isCurrent = currentAdminUser && (currentAdminUser.id === id || currentAdminUser.userId === id);
  if (isCurrent) {
    alert('Vous ne pouvez pas supprimer votre propre compte.');
    return;
  }

  if (!confirm(`Confirmez-vous la suppression définitive du compte de "${name}" ?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/admin/collaborators/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const data = await res.json();
    if (res.ok) {
      await loadCollaborators();
    } else {
      alert(data.error || 'Erreur lors de la suppression');
    }
  } catch (err) {
    console.error('Erreur suppression collaborateur:', err);
    alert('Erreur réseau');
  }
};

if (collaboratorForm) {
  collaboratorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (collaboratorModalError) collaboratorModalError.classList.add('hidden');

    const editId = collaboratorEditId?.value;
    const fullName = collabFullname?.value.trim();
    const email = collabEmail?.value.trim();
    const phone = collabPhone?.value.trim() || undefined;
    const username = collabUsername?.value.trim() || undefined;
    const role = collabRole?.value || 'GESTIONNAIRE';
    const password = collabPassword?.value;
    const isActive = collabIsActive ? collabIsActive.checked : true;

    const permissions = [];
    if (permOrders?.checked) permissions.push('orders');
    if (permProducts?.checked) permissions.push('products');
    if (permDiscounts?.checked) permissions.push('discounts');
    if (permCms?.checked) permissions.push('cms');

    if (!fullName || !email) {
      if (collaboratorModalError) {
        collaboratorModalError.textContent = 'Nom complet et email sont requis';
        collaboratorModalError.classList.remove('hidden');
      }
      return;
    }

    if (!editId && (!password || password.length < 6)) {
      if (collaboratorModalError) {
        collaboratorModalError.textContent = 'Le mot de passe doit comporter au moins 6 caractères';
        collaboratorModalError.classList.remove('hidden');
      }
      return;
    }

    const payload = {
      fullName,
      email,
      phone,
      username,
      role,
      permissions,
      isActive,
      password: password && password.length >= 6 ? password : undefined
    };

    try {
      const url = editId ? `/api/admin/collaborators/${editId}` : '/api/admin/collaborators';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        if (collaboratorModalError) {
          collaboratorModalError.textContent = data.error || 'Erreur lors de l\'enregistrement';
          collaboratorModalError.classList.remove('hidden');
        }
        return;
      }

      closeCollaboratorModal();
      await loadCollaborators();

      if (!editId && data.invitation) {
        showInviteModal(data.invitation, fullName, role);
      }
    } catch (err) {
      if (collaboratorModalError) {
        collaboratorModalError.textContent = 'Erreur réseau lors de l\'enregistrement';
        collaboratorModalError.classList.remove('hidden');
      }
    }
  });
}

if (collabRole) {
  collabRole.addEventListener('change', () => {
    applyRolePermissionsPreset(collabRole.value);
  });
}

if (generateCollabPasswordBtn && collabPassword) {
  generateCollabPasswordBtn.addEventListener('click', () => {
    collabPassword.value = generateSecurePassword();
    collabPassword.type = 'text';
    if (toggleCollabPasswordBtn) {
      toggleCollabPasswordBtn.innerHTML = '<span class="material-symbols-outlined text-lg">visibility_off</span>';
    }
  });
}

if (closeInviteModalBtn) {
  closeInviteModalBtn.addEventListener('click', closeInviteModal);
}
if (finishInviteBtn) {
  finishInviteBtn.addEventListener('click', closeInviteModal);
}
if (copyFullInviteBtn) {
  copyFullInviteBtn.addEventListener('click', async () => {
    if (!currentInviteShareText) return;
    try {
      await navigator.clipboard.writeText(currentInviteShareText);
      if (copyToast) {
        copyToast.textContent = '✓ Message complet avec lien et identifiants copié !';
        copyToast.classList.remove('hidden');
        setTimeout(() => copyToast.classList.add('hidden'), 3500);
      }
    } catch(e) {
      console.error(e);
    }
  });
}

if (openAddCollaboratorBtn) {
  openAddCollaboratorBtn.addEventListener('click', () => openCollaboratorModal(null));
}
if (closeCollaboratorModalBtn) {
  closeCollaboratorModalBtn.addEventListener('click', closeCollaboratorModal);
}
if (cancelCollaboratorModalBtn) {
  cancelCollaboratorModalBtn.addEventListener('click', closeCollaboratorModal);
}
if (toggleCollabPasswordBtn && collabPassword) {
  toggleCollabPasswordBtn.addEventListener('click', () => {
    const isPass = collabPassword.type === 'password';
    collabPassword.type = isPass ? 'text' : 'password';
    toggleCollabPasswordBtn.innerHTML = `<span class="material-symbols-outlined text-lg">${isPass ? 'visibility_off' : 'visibility'}</span>`;
  });
}
if (teamSearchInput) {
  teamSearchInput.addEventListener('input', () => renderCollaborators());
}
const collabFilterPills = document.querySelectorAll('.collab-filter-pill');
collabFilterPills.forEach(pill => {
  pill.addEventListener('click', () => {
    collabFilterPills.forEach(p => {
      p.classList.remove('active', 'bg-[#0d7252]', 'text-white');
      p.classList.add('bg-gray-100', 'text-gray-600');
    });
    pill.classList.add('active', 'bg-[#0d7252]', 'text-white');
    pill.classList.remove('bg-gray-100', 'text-gray-600');
    activeCollabFilter = pill.getAttribute('data-collab-filter') || 'all';
    renderCollaborators();
  });
});

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});

