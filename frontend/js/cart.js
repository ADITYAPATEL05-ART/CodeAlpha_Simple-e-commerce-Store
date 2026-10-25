const CART_STORAGE_KEY = 'store_cart_v1';

function getCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const cart = raw ? JSON.parse(raw) : [];
    return cart.map(item => ({
      ...item,
      image: item.image ? item.image.replace('.svg', '.jpg') : 'images/tee-boxy.jpg'
    }));
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);

  if (existing) {
    existing.quantity += qtyToAdd;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      image: product.image,
      quantity: qtyToAdd
    });
  }

  saveCart(cart);
  showCartNotification(product.name, qtyToAdd);
}

function updateCartItemQuantity(productId, quantity) {
  let cart = getCart();
  const targetId = parseInt(productId, 10);
  const qty = parseInt(quantity, 10);

  if (qty <= 0) {
    cart = cart.filter(item => item.id !== targetId);
  } else {
    const item = cart.find(item => item.id === targetId);
    if (item) {
      item.quantity = qty;
    }
  }

  saveCart(cart);
}

function removeFromCart(productId) {
  const targetId = parseInt(productId, 10);
  const cart = getCart().filter(item => item.id !== targetId);
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
  updateCartBadge();
}

function getCartItemCount() {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
}

function getCartSubtotal() {
  const cart = getCart();
  const sum = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  return Number(sum.toFixed(2));
}

function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-count');
  const count = getCartItemCount();
  badges.forEach(badge => {
    badge.textContent = count;
  });
}

function showCartNotification(productName, quantity) {
  let banner = document.getElementById('cartNotification');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'cartNotification';
    banner.className = 'notification-banner';
    document.body.appendChild(banner);
  }

  banner.innerHTML = `
    <span>Added ${quantity} x ${productName} to bag</span>
    <a href="cart.html">View Bag</a>
  `;
  banner.classList.add('show');

  if (window.cartNotifyTimer) {
    clearTimeout(window.cartNotifyTimer);
  }

  window.cartNotifyTimer = setTimeout(() => {
    banner.classList.remove('show');
  }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
});

