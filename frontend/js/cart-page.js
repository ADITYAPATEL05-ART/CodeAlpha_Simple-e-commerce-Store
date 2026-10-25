document.addEventListener('DOMContentLoaded', () => {
  renderCartPage();
});

function renderCartPage() {
  const container = document.getElementById('cartPageContainer');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h2 style="font-size:20px; font-weight:700; margin-bottom:8px;">Your bag is empty</h2>
        <p style="color:#717171; margin-bottom:20px;">Explore our collection of sustainably tailored garments.</p>
        <a href="index.html" class="btn-reserve" style="display:inline-block; width:auto; padding:12px 28px;">Explore Collection</a>
      </div>
    `;
    return;
  }

  const subtotal = getCartSubtotal();
  const shippingFee = subtotal >= 1999 ? 0.00 : 149.00;
  const tax = Number((subtotal * 0.05).toFixed(2));
  const grandTotal = Number((subtotal + shippingFee + tax).toFixed(2));

  const itemsHtml = cart.map(item => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    return `
      <tr data-id="${item.id}">
        <td>
          <div class="cart-garment-item">
            <div class="cart-thumb">
              <img src="${item.image}" alt="${escapeHtml(item.name)}">
            </div>
            <div>
              <a href="product.html?id=${item.id}" style="font-weight:700; color:#222222; font-size:15px; display:block; margin-bottom:2px;">
                ${escapeHtml(item.name)}
              </a>
              <div style="font-size:12px; color:#717171;">SKU: ${escapeHtml(item.sku)}</div>
            </div>
          </div>
        </td>
        <td><strong>&#8377;${item.price.toLocaleString('en-IN')}</strong></td>
        <td>
          <div class="qty-stepper">
            <button class="qty-step-btn cart-minus-btn" data-id="${item.id}" type="button">-</button>
            <span class="qty-step-val">${item.quantity}</span>
            <button class="qty-step-btn cart-plus-btn" data-id="${item.id}" type="button">+</button>
          </div>
        </td>
        <td><strong>&#8377;${Number(itemTotal).toLocaleString('en-IN')}</strong></td>
        <td>
          <button class="card-action-btn cart-del-btn" data-id="${item.id}" type="button" style="color:#b91c1c; border-color:#fca5a5;">
            Remove
          </button>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="checkout-grid">
      <div>
        <div class="cart-table-card">
          <table class="cart-table">
            <thead>
              <tr>
                <th>Garment</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
        <div style="margin-top: 18px; display: flex; justify-content: space-between; align-items: center;">
          <a href="index.html" class="btn-reserve-secondary" style="display:inline-block; width:auto; margin:0; padding:10px 18px;">
            Continue Browsing
          </a>
          <button id="clearAllCartBtn" class="card-action-btn" type="button" style="padding:10px 18px;">
            Empty Bag
          </button>
        </div>
      </div>

      <div>
        <div class="airbnb-reserve-box">
          <h2 style="font-size:18px; font-weight:700; margin-bottom:16px;">Order Summary</h2>
          <div class="calc-row">
            <span>Subtotal</span>
            <span>&#8377;${subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div class="calc-row">
            <span>Estimated Shipping</span>
            <span>${shippingFee === 0 ? 'FREE' : '&#8377;' + shippingFee.toFixed(2)}</span>
          </div>
          <div class="calc-row">
            <span>Estimated GST (5%)</span>
            <span>&#8377;${tax.toFixed(2)}</span>
          </div>
          <div class="calc-total">
            <span>Total Amount</span>
            <span>&#8377;${grandTotal.toFixed(2)}</span>
          </div>

          <div style="margin-top: 24px;">
            <a href="checkout.html" class="btn-reserve" style="display:block; text-align:center;">
              Proceed to Checkout
            </a>
          </div>

          <div style="font-size:12px; color:#717171; text-align:center; margin-top:14px; line-height:1.4;">
            Complimentary shipping across India on orders over &#8377;1,999.<br>All orders are packaged in recycled kraft mailers.
          </div>
        </div>
      </div>
    </div>
  `;

  setupCartPageActions();
}

function setupCartPageActions() {
  document.querySelectorAll('.cart-minus-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const cart = getCart();
      const item = cart.find(i => i.id === id);
      if (item && item.quantity > 1) {
        updateCartItemQuantity(id, item.quantity - 1);
        renderCartPage();
      } else {
        removeFromCart(id);
        renderCartPage();
      }
    });
  });

  document.querySelectorAll('.cart-plus-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      const cart = getCart();
      const item = cart.find(i => i.id === id);
      if (item) {
        updateCartItemQuantity(id, item.quantity + 1);
        renderCartPage();
      }
    });
  });

  document.querySelectorAll('.cart-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id, 10);
      removeFromCart(id);
      renderCartPage();
    });
  });

  const clearBtn = document.getElementById('clearAllCartBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to empty your shopping bag?')) {
        clearCart();
        renderCartPage();
      }
    });
  }
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
