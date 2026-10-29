// ==================== APPLE FLUID UI ENGINE (WWDC FLUID INTERFACES) ====================

// 1. Apple WWDC Physics Formulas
function appleRubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
window.appleRubberband = appleRubberband;

function appleProjectMomentum(velocity, decelerationRate = 0.998) {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}
window.appleProjectMomentum = appleProjectMomentum;

// 2. Apple Dynamic Island / Floating Toast System
window.showAppleToast = function(message, type = 'info', duration = 3200) {
  let container = document.getElementById('apple-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'apple-toast-container';
    container.className = 'apple-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `apple-toast apple-toast-${type}`;

  let iconName = 'info';
  if (type === 'success') iconName = 'check_circle';
  else if (type === 'error') iconName = 'error_outline';

  toast.innerHTML = `
    <span class="apple-toast-icon material-symbols-outlined">${iconName}</span>
    <span class="apple-toast-msg">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger entrance spring
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add('apple-toast-visible');
    });
  });

  // Haptic feedback (if supported by device)
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      if (type === 'error') navigator.vibrate([20, 40, 20]);
      else navigator.vibrate(15);
    } catch (_) {}
  }

  // Auto dismiss
  let dismissTimer = setTimeout(dismiss, duration);

  function dismiss() {
    clearTimeout(dismissTimer);
    toast.classList.remove('apple-toast-visible');
    toast.classList.add('apple-toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 350);
  }

  toast.addEventListener('click', dismiss);
};

// Polyfill window.alert on storefront so unexpected alerts become beautiful Apple toasts
window.alert = function(msg) {
  window.showAppleToast(msg, 'error');
};

// 3. Inline Input Shake Error Feedback
window.triggerAppleShake = function(element) {
  if (!element) return;
  element.classList.remove('apple-shake');
  void element.offsetWidth; // trigger reflow
  element.classList.add('apple-shake');
  element.style.borderColor = '#ef4444';
  setTimeout(() => {
    element.classList.remove('apple-shake');
  }, 400);
};

// 4. Mobile Bottom Sheet Direct Manipulation Controller
window.setupAppleSheetGestures = function(overlayEl, sheetEl, closeCallback) {
  if (!overlayEl || !sheetEl) return;

  // Backdrop click dismissal
  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) {
      if (closeCallback) closeCallback();
    }
  });

  let isDragging = false;
  let startY = 0;
  let currentY = 0;
  let history = [];
  let activePointerId = null;

  sheetEl.addEventListener('pointerdown', (e) => {
    // Only activate on mobile screens (max-width: 640px)
    if (window.innerWidth > 640) return;
    
    // Only initiate drag if at top of scroll or clicking top handle/header
    const scrollable = sheetEl.querySelector('.overflow-y-auto') || sheetEl;
    const isTopHandle = e.target.closest('.sheet-grab-handle') || e.target.closest('.drawer-header') || e.target.closest('h3');
    if (!isTopHandle && scrollable && scrollable.scrollTop > 0) return;

    isDragging = true;
    startY = e.clientY;
    currentY = 0;
    activePointerId = e.pointerId;
    history = [{ y: e.clientY, t: performance.now() }];
    sheetEl.style.transition = 'none';

    try {
      sheetEl.setPointerCapture(e.pointerId);
    } catch (_) {}
  });

  sheetEl.addEventListener('pointermove', (e) => {
    if (!isDragging || e.pointerId !== activePointerId) return;

    const dy = e.clientY - startY;
    const now = performance.now();
    history.push({ y: e.clientY, t: now });
    if (history.length > 8) history.shift();

    const H = sheetEl.offsetHeight || 400;

    if (dy < 0) {
      // Pulling upwards: Apple rubber-band resistance
      const resisted = appleRubberband(dy, H, 0.4);
      sheetEl.style.transform = `translateY(${resisted}px)`;
    } else {
      // Pulling downwards: 1:1 direct tracking
      sheetEl.style.transform = `translateY(${dy}px)`;
    }
    currentY = dy;
  });

  const finishSheetGesture = (e) => {
    if (!isDragging || e.pointerId !== activePointerId) return;
    isDragging = false;
    try { sheetEl.releasePointerCapture(e.pointerId); } catch (_) {}

    const now = performance.now();
    const recent = history.filter(pt => now - pt.t < 120);
    let velocity = 0; // px/s
    if (recent.length >= 2) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      const dt = (last.t - first.t) / 1000;
      if (dt > 0.01) velocity = (last.y - first.y) / dt;
    }

    const H = sheetEl.offsetHeight || 400;
    const momentum = appleProjectMomentum(velocity, 0.998);
    const projectedDy = currentY + momentum;

    sheetEl.style.transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)';

    if (projectedDy > H * 0.25 || velocity > 380) {
      // Dismiss sheet
      if (closeCallback) closeCallback();
    } else {
      // Snap back open
      sheetEl.style.transform = '';
    }
  };

  sheetEl.addEventListener('pointerup', finishSheetGesture);
  sheetEl.addEventListener('pointercancel', finishSheetGesture);
};

// 5. Global Modal and Overlay Dismissal on Escape Key
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // If cart drawer is open, close it
    if (typeof window.closeCartDrawer === 'function') window.closeCartDrawer();
    // If checkout modal is open, close it
    const checkoutModal = document.getElementById('checkout-modal-overlay');
    if (checkoutModal && !checkoutModal.classList.contains('hidden')) {
      checkoutModal.classList.add('hidden');
    }
    // If simulator modal is open, close it
    const simModal = document.getElementById('simulator-modal-overlay');
    if (simModal && !simModal.classList.contains('hidden')) {
      simModal.classList.add('hidden');
    }
    // If mobile nav is open, close it
    const navOverlay = document.getElementById('mobile-nav-overlay');
    const navDrawer = document.getElementById('mobile-nav-drawer');
    if (navOverlay && !navOverlay.classList.contains('hidden')) {
      if (navDrawer) navDrawer.classList.add('nav-drawer-closed');
      setTimeout(() => navOverlay.classList.add('hidden'), 300);
      document.body.classList.remove('overflow-hidden');
    }
  }
});
