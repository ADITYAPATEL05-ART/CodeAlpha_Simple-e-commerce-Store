let selectedShippingCost = 0;

document.addEventListener('DOMContentLoaded', () => {
  initCheckout();
});

function initCheckout() {
  const cart = getCart();
  if (cart.length === 0) {
    const container = document.getElementById('checkoutContainer');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <h2 class="empty-state-title">Your cart is empty</h2>
          <p class="empty-state-text">Please add products to your cart before proceeding to checkout.</p>
          <a href="index.html" class="btn-primary">Browse Products</a>
        </div>
      `;
    }
    return;
  }

  renderCheckoutSummary();
  setupCheckoutForm();
}

function renderCheckoutSummary() {
  const summaryItemsList = document.getElementById('checkoutItemsList');
  const cart = getCart();

  if (summaryItemsList) {
    summaryItemsList.innerHTML = cart.map(item => `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 13px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${item.image}" alt="${escapeHtml(item.name)}" style="width: 44px; height: 44px; object-fit: cover; border: 1px solid #ebebeb; background: #f4f5f6; border-radius: 3px;">
          <div>
            <div style="font-weight: 600; color: #222222;">${escapeHtml(item.name)}</div>
            <div style="color: #717171;">Qty: ${item.quantity} x &#8377;${item.price.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div style="font-weight: 700; color: #222222;">&#8377;${(item.price * item.quantity).toLocaleString('en-IN')}</div>
      </div>
    `).join('');
  }

  updateCalculations();
}

function updateCalculations() {
  const subtotal = getCartSubtotal();
  const shippingSelect = document.querySelector('input[name="shippingMethod"]:checked');
  const baseShippingFee = subtotal >= 1999 ? 0.00 : 149.00;
  let finalShipping = baseShippingFee;

  if (shippingSelect && shippingSelect.value === 'express') {
    finalShipping = baseShippingFee + 299.00;
  }

  const tax = Number((subtotal * 0.05).toFixed(2));
  const total = Number((subtotal + finalShipping + tax).toFixed(2));

  const subtotalEl = document.getElementById('checkoutSubtotal');
  const shippingEl = document.getElementById('checkoutShipping');
  const taxEl = document.getElementById('checkoutTax');
  const totalEl = document.getElementById('checkoutTotal');

  if (subtotalEl) subtotalEl.textContent = '₹' + subtotal.toLocaleString('en-IN');
  if (shippingEl) shippingEl.textContent = finalShipping === 0 ? 'FREE' : '₹' + finalShipping.toFixed(2);
  if (taxEl) taxEl.textContent = '₹' + tax.toFixed(2);
  if (totalEl) totalEl.textContent = '₹' + total.toFixed(2);
}

function setupCheckoutForm() {
  const shippingRadios = document.querySelectorAll('input[name="shippingMethod"]');
  shippingRadios.forEach(radio => {
    radio.addEventListener('change', updateCalculations);
  });

  const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
  const cardDetails = document.getElementById('creditCardFields');

  paymentRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (cardDetails) {
        cardDetails.style.display = radio.value === 'Card' ? 'block' : 'none';
      }
    });
  });

  const form = document.getElementById('checkoutForm');
  if (form) {
    form.addEventListener('submit', handleOrderSubmit);
  }
}

async function handleOrderSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('submitOrderBtn');
  const errorBox = document.getElementById('checkoutError');
  if (errorBox) {
    errorBox.style.display = 'none';
    errorBox.textContent = '';
  }

  const fullName = document.getElementById('custName').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('shipAddress').value.trim();
  const city = document.getElementById('shipCity').value.trim();
  const state = document.getElementById('shipState').value.trim();
  const postalCode = document.getElementById('shipZip').value.trim();
  const country = document.getElementById('shipCountry').value.trim();
  const orderNotes = document.getElementById('orderNotes').value.trim();

  const shippingRadio = document.querySelector('input[name="shippingMethod"]:checked');
  const shippingOption = shippingRadio && shippingRadio.value === 'express'
    ? 'Express Delivery (1-2 business days)'
    : 'Standard Delivery (3-5 business days)';

  const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
  const paymentMethod = paymentRadio ? paymentRadio.value : 'Card';

  let cardNumber = '';
  if (paymentMethod === 'Card') {
    const cardInput = document.getElementById('cardNumber');
    const expInput = document.getElementById('cardExp');
    const cvvInput = document.getElementById('cardCvv');

    if (!cardInput.value.trim() || !expInput.value.trim() || !cvvInput.value.trim()) {
      showError('Please complete all payment card fields.');
      return;
    }
    cardNumber = cardInput.value.trim();
  }

  const cart = getCart();
  if (cart.length === 0) {
    showError('Your shopping cart is empty.');
    return;
  }

  const payload = {
    customer: { fullName, email, phone },
    shipping: { address, city, state, postalCode, country, shippingOption },
    payment: { method: paymentMethod, cardNumber },
    items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
    notes: orderNotes
  };

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing Order...';
    }

    const response = await API.submitOrder(payload);

    clearCart();

    const storedOrders = JSON.parse(localStorage.getItem('user_order_history') || '[]');
    storedOrders.unshift(response.order.orderId);
    localStorage.setItem('user_order_history', JSON.stringify(storedOrders));

    window.location.href = `order-confirmation.html?id=${encodeURIComponent(response.order.orderId)}`;
  } catch (err) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Place Order';
    }
    showError(err.message || 'An error occurred while processing your order.');
  }
}

function showError(msg) {
  let errorBox = document.getElementById('checkoutError');
  if (!errorBox) {
    errorBox = document.createElement('div');
    errorBox.id = 'checkoutError';
    errorBox.style.padding = '12px 16px';
    errorBox.style.backgroundColor = '#fef2f2';
    errorBox.style.border = '1px solid #fca5a5';
    errorBox.style.color = '#b91c1c';
    errorBox.style.marginBottom = '16px';
    errorBox.style.fontSize = '14px';
    const form = document.getElementById('checkoutForm');
    if (form) form.prepend(errorBox);
  }
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
  window.scrollTo({ top: errorBox.offsetTop - 80, behavior: 'smooth' });
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

