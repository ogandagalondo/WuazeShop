// WuazeShop Client Store Logic - Mobile-First & Stitch Fidelity
let allProducts = [];
let currentCategory = 'all';
let cart = []; // [{ product, quantity }]
let currentPendingOrder = null;

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const sectionTitle = document.getElementById('section-title');
const categoryPills = document.querySelectorAll('.cat-pill');
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
    productsGrid.innerHTML = `
      <div class="col-span-full text-center py-10 text-outline">
        <p>Impossible de charger le catalogue. Veuillez réessayer.</p>
      </div>
    `;
  }
}

function formatFCFA(amount) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

function renderProducts(products) {
  if (!products || products.length === 0) {
    productsGrid.innerHTML = `
      <div class="col-span-full text-center py-12 bg-surface rounded-2xl border border-surface-border">
        <span class="material-symbols-outlined text-4xl text-outline mb-2">inventory_2</span>
        <p class="text-sm font-semibold text-on-surface">Aucun article dans cette catégorie pour le moment.</p>
        <p class="text-xs text-outline mt-1">De nouveaux arrivages de Chine sont en cours d'enregistrement.</p>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = products.map(product => {
    const specsHtml = (product.specs || [])
      .slice(0, 2)
      .map(spec => `<span class="bg-surface-low text-on-surface-variant text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded truncate max-w-full">${spec}</span>`)
      .join(' ');

    const colorsHtml = (product.colors || [])
      .map(col => `<span class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-sm inline-block" style="background-color: ${col}"></span>`)
      .join(' ');

    const strikePriceHtml = product.original_price
      ? `<span class="text-[10px] sm:text-[11px] text-outline line-through leading-none">${formatFCFA(product.original_price)}</span>`
      : '';

    const promoBadge = product.original_price
      ? `<span class="bg-[#ba1a1a] text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-sm">-PROMO</span>`
      : `<span class="bg-secondary-container text-on-secondary-container text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded">1 An Gar.</span>`;

    const whatsappUrl = `https://wa.me/241074001122?text=${encodeURIComponent(`Bonjour, je souhaite avoir des conseils sur l'article : ${product.title} (${formatFCFA(product.price)}) vu sur WuazeShop.`)}`;

    return `
      <article class="group bg-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between border border-surface-border">
        <div class="p-2 sm:p-3 pb-0 relative">
          <div class="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex flex-col gap-1 items-start">
            ${promoBadge}
          </div>
          <div class="aspect-square w-full bg-surface-low rounded-xl overflow-hidden flex items-center justify-center p-2 sm:p-3 relative">
            <img class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" src="${product.image_url}" alt="${product.title}"/>
          </div>
        </div>
        <div class="p-2.5 sm:p-4 flex flex-col flex-1 justify-between">
          <div>
            <div class="flex items-center justify-between text-xs text-outline mb-1">
              <span class="uppercase tracking-wider font-semibold text-[9px] sm:text-[10px] text-secondary truncate">${product.category}</span>
              <span class="hidden sm:flex items-center gap-0.5 text-primary">
                <span class="material-symbols-outlined text-[13px]" style="font-variation-settings: 'FILL' 1;">verified</span>
                <span class="text-[10px] font-bold">Original</span>
              </span>
            </div>
            <h3 class="text-xs sm:text-sm font-bold text-on-surface line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              ${product.title}
            </h3>
            <div class="flex flex-wrap gap-1 my-1.5 sm:my-2">
              ${specsHtml}
            </div>
            ${colorsHtml ? `<div class="flex items-center gap-1.5 my-1">${colorsHtml}</div>` : ''}
          </div>
          <div class="pt-2 border-t border-surface-low mt-1.5 sm:mt-2">
            <div class="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 mb-2">
              <span class="text-xs sm:text-base font-extrabold text-primary">${formatFCFA(product.price)}</span>
              ${strikePriceHtml}
            </div>
            <div class="flex gap-1.5 sm:gap-2">
              <button onclick="addToCart(${product.id})" class="flex-1 py-2 px-1.5 sm:px-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all">
                <span class="material-symbols-outlined text-[15px] sm:text-[16px]">add_shopping_cart</span>
                <span>Commander</span>
              </button>
              <a href="${whatsappUrl}" target="_blank" class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center hover:opacity-90 transition-opacity shrink-0" title="Demander sur WhatsApp">
                <span class="material-symbols-outlined text-[16px] sm:text-[18px]">chat</span>
              </a>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// 2. Category Filters Navigation
categoryPills.forEach(btn => {
  btn.addEventListener('click', () => {
    categoryPills.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.getAttribute('data-cat');
    
    if (currentCategory === 'all') {
      sectionTitle.textContent = 'Tous les articles disponibles';
    } else if (currentCategory === 'smartphones') {
      sectionTitle.textContent = 'Smartphones & Tablettes';
    } else if (currentCategory === 'ordinateurs') {
      sectionTitle.textContent = 'Ordinateurs & MacBooks';
    } else if (currentCategory === 'televiseurs') {
      sectionTitle.textContent = 'Téléviseurs & Écrans 4K';
    }
    loadProducts(currentCategory);
  });
});

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

  updateCartUi();
  openCartDrawer();
};

function updateCartUi() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  cartBadgeCount.textContent = totalItems;
  mobileCartBadge.textContent = totalItems;
  cartBadgeTotal.textContent = formatFCFA(subtotal);
  cartSubtotalDisplay.textContent = formatFCFA(subtotal);
  checkoutTotalDisplay.textContent = formatFCFA(subtotal);

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="text-center py-12 text-outline">
        <span class="material-symbols-outlined text-4xl mb-2">remove_shopping_cart</span>
        <p class="text-xs font-semibold text-on-surface">Votre panier est vide</p>
      </div>
    `;
    return;
  }

  cartItemsContainer.innerHTML = cart.map((item, idx) => `
    <div class="flex items-center gap-3 p-2.5 bg-surface-low rounded-xl border border-surface-border">
      <img src="${item.product.image_url}" class="w-12 h-12 rounded-lg object-contain bg-white p-1" alt="${item.product.title}"/>
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-bold text-on-surface truncate">${item.product.title}</h4>
        <span class="text-xs font-semibold text-primary">${formatFCFA(item.product.price)}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <button onclick="changeQuantity(${idx}, -1)" class="w-6 h-6 rounded-lg bg-surface text-outline font-bold flex items-center justify-center border hover:border-primary">-</button>
        <span class="text-xs font-bold text-on-surface w-4 text-center">${item.quantity}</span>
        <button onclick="changeQuantity(${idx}, 1)" class="w-6 h-6 rounded-lg bg-surface text-outline font-bold flex items-center justify-center border hover:border-primary">+</button>
      </div>
    </div>
  `).join('');
}

window.changeQuantity = function(index, delta) {
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  updateCartUi();
};

function openCartDrawer() {
  cartDrawerOverlay.classList.remove('hidden');
  const drawer = cartDrawerOverlay.querySelector('.drawer');
  drawer.classList.remove('drawer-closed');
}

function closeCartDrawer() {
  const drawer = cartDrawerOverlay.querySelector('.drawer');
  drawer.classList.add('drawer-closed');
  setTimeout(() => cartDrawerOverlay.classList.add('hidden'), 250);
}

document.getElementById('cart-toggle-btn').addEventListener('click', openCartDrawer);
document.getElementById('mobile-cart-btn').addEventListener('click', openCartDrawer);
document.getElementById('close-cart-btn').addEventListener('click', closeCartDrawer);

// 5. Checkout Modal
document.getElementById('open-checkout-modal-btn').addEventListener('click', () => {
  if (cart.length === 0) {
    alert('Votre panier est vide !');
    return;
  }
  closeCartDrawer();
  checkoutModalOverlay.classList.remove('hidden');
});

document.getElementById('close-checkout-btn').addEventListener('click', () => {
  checkoutModalOverlay.classList.add('hidden');
});

// 6. Handle Checkout Form Submission
checkoutForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('checkout-name').value;
  const phone = document.getElementById('checkout-phone').value;
  const neighborhood = document.getElementById('checkout-neighborhood').value;
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

  // Checkout with primary cart item
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

// 7. Handle Simulator Approval
document.getElementById('sim-confirm-btn').addEventListener('click', async () => {
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

document.getElementById('sim-close-btn').addEventListener('click', () => {
  simulatorModalOverlay.classList.add('hidden');
});

document.getElementById('success-done-btn').addEventListener('click', () => {
  successModalOverlay.classList.add('hidden');
});

// Initial boot
loadProducts('all');
