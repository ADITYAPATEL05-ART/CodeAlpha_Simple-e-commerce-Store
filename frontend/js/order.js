document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('confirmationContainer')) {
    initConfirmation();
  }
  if (document.getElementById('orderLookupForm')) {
    initOrderLookup();
  }
});

async function initConfirmation() {
  const container = document.getElementById('confirmationContainer');
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  if (!orderId) {
    container.innerHTML = `
      <div class="empty-state">
        <h2 class="empty-state-title">No Order Reference Provided</h2>
        <p class="empty-state-text">Please provide a valid order ID or track your orders.</p>
        <a href="orders.html" class="btn-primary">Track Order</a>
      </div>
    `;
    return;
  }

  try {
    const order = await API.getOrderById(orderId);
    renderConfirmationDetails(order, container);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <h2 class="empty-state-title">Order Not Found</h2>
        <p class="empty-state-text">No order could be located for reference ${escapeHtml(orderId)}.</p>
        <a href="orders.html" class="btn-primary">Search Orders</a>
      </div>
    `;
  }
}

function renderConfirmationDetails(order, container) {
  const itemsRows = order.items.map(item => `
    <tr>
      <td>
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${item.image}" alt="${escapeHtml(item.name)}" style="width:48px; height:48px; object-fit:cover; border:1px solid #ebebeb; background:#f4f5f6; border-radius:3px;">
          <div>
            <div style="font-weight:700; color:#222222;">${escapeHtml(item.name)}</div>
            <div style="font-size:12px; color:#717171;">SKU: ${escapeHtml(item.sku)}</div>
          </div>
        </div>
      </td>
      <td>&#8377;${item.price.toLocaleString('en-IN')}</td>
      <td>${item.quantity}</td>
      <td style="text-align:right;"><strong>&#8377;${item.itemTotal.toLocaleString('en-IN')}</strong></td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="confirmation-card">
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #ebebeb;">
        <span class="status-tag confirmed" style="margin-bottom: 10px;">${order.status}</span>
        <h1 style="font-size: 24px; color: #222222; margin-bottom: 6px;">Thank You for Your Order</h1>
        <p style="font-size: 14px; color: #717171;">A confirmation receipt has been generated for ${escapeHtml(order.customer.email)}.</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 2px;">
        <div>
          <div style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Order Reference</div>
          <div style="font-size: 16px; font-weight: 700; color: #0f1f38;">${escapeHtml(order.orderId)}</div>
          <div style="font-size: 13px; color: #475569; margin-top: 4px;">Placed on: ${escapeHtml(order.displayDate)}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Payment & Status</div>
          <div style="font-size: 14px; color: #0f1f38; font-weight: 600;">Method: ${escapeHtml(order.payment.method)} ${order.payment.lastFourDigits !== 'N/A' ? '(ending in ' + order.payment.lastFourDigits + ')' : ''}</div>
          <div style="font-size: 13px; color: #475569; margin-top: 4px;">Delivery: ${escapeHtml(order.shipping.method)}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
        <div style="border: 1px solid #e2e8f0; padding: 16px; border-radius: 2px;">
          <h3 style="font-size: 14px; color: #0f1f38; text-transform: uppercase; margin-bottom: 8px;">Customer Information</h3>
          <div style="font-size: 14px; line-height: 1.5; color: #334155;">
            <strong>${escapeHtml(order.customer.fullName)}</strong><br>
            Email: ${escapeHtml(order.customer.email)}<br>
            Phone: ${escapeHtml(order.customer.phone)}
          </div>
        </div>
        <div style="border: 1px solid #e2e8f0; padding: 16px; border-radius: 2px;">
          <h3 style="font-size: 14px; color: #0f1f38; text-transform: uppercase; margin-bottom: 8px;">Shipping Destination</h3>
          <div style="font-size: 14px; line-height: 1.5; color: #334155;">
            ${escapeHtml(order.shipping.address)}<br>
            ${escapeHtml(order.shipping.city)}, ${escapeHtml(order.shipping.state)} ${escapeHtml(order.shipping.postalCode)}<br>
            ${escapeHtml(order.shipping.country)}
          </div>
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 16px; color: #0f1f38; margin-bottom: 12px;">Ordered Products</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Unit Price</th>
              <th>Quantity</th>
              <th style="text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </div>

      <div style="max-width: 320px; margin-left: auto; margin-bottom: 24px; border: 1px solid #e2e8f0; padding: 16px; border-radius: 2px;">
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>&#8377;${order.pricing.subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div class="summary-row">
          <span>Shipping:</span>
          <span>${order.pricing.shippingFee === 0 ? 'FREE' : '&#8377;' + order.pricing.shippingFee.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>GST (5%):</span>
          <span>&#8377;${order.pricing.tax.toFixed(2)}</span>
        </div>
        <div class="summary-total-row">
          <span>Total:</span>
          <span>&#8377;${order.pricing.grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #ebebeb; padding-top: 20px; flex-wrap: wrap; gap: 10px;">
        <a href="index.html" class="btn-reserve-secondary" style="display:inline-block; width:auto; margin:0; padding:10px 18px;">Return to Collection</a>
        <div style="display:flex; gap:10px;">
          <a href="orders.html" class="btn-reserve-secondary" style="display:inline-block; width:auto; margin:0; padding:10px 18px;">View Orders</a>
          <button onclick="window.print()" class="btn-reserve" style="width:auto; margin:0; padding:10px 18px;" type="button">Print Receipt</button>
        </div>
      </div>
    </div>
  `;
}

function initOrderLookup() {
  const form = document.getElementById('orderLookupForm');
  const resultsContainer = document.getElementById('orderLookupResults');
  const recentContainer = document.getElementById('recentOrdersList');

  loadRecentOrders(recentContainer);

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const orderIdInput = document.getElementById('lookupOrderId').value.trim();
      const emailInput = document.getElementById('lookupEmail').value.trim();

      if (!orderIdInput && !emailInput) {
        alert('Please enter an Order ID or Email address to search.');
        return;
      }

      resultsContainer.innerHTML = '<p style="padding: 16px;">Searching records...</p>';

      try {
        const orders = await API.getOrders({
          orderId: orderIdInput,
          email: emailInput
        });

        if (orders.length === 0) {
          resultsContainer.innerHTML = `
            <div class="empty-state" style="margin-top: 20px;">
              <h3 class="empty-state-title">No orders found</h3>
              <p class="empty-state-text">No matching records found for the details provided.</p>
            </div>
          `;
          return;
        }

        resultsContainer.innerHTML = orders.map(o => renderOrderSummaryCard(o)).join('');
      } catch (err) {
        resultsContainer.innerHTML = '<p style="padding: 16px; color: #b91c1c;">Failed to retrieve order records.</p>';
      }
    });
  }
}

async function loadRecentOrders(container) {
  if (!container) return;

  const storedOrderIds = JSON.parse(localStorage.getItem('user_order_history') || '[]');
  if (storedOrderIds.length === 0) {
    container.innerHTML = '<p style="font-size: 13px; color: #64748b;">No recent orders recorded in this session.</p>';
    return;
  }

  container.innerHTML = '<p style="font-size: 13px; color: #64748b;">Loading recent orders...</p>';

  try {
    const promises = storedOrderIds.slice(0, 5).map(id => API.getOrderById(id).catch(() => null));
    const orders = (await Promise.all(promises)).filter(Boolean);

    if (orders.length === 0) {
      container.innerHTML = '<p style="font-size: 13px; color: #64748b;">No matching recent orders found.</p>';
      return;
    }

    container.innerHTML = orders.map(o => renderOrderSummaryCard(o)).join('');
  } catch (err) {
    container.innerHTML = '<p style="font-size: 13px; color: #64748b;">Unable to load recent orders.</p>';
  }
}

function renderOrderSummaryCard(order) {
  return `
    <div style="background: #ffffff; border: 1px solid #d1d5db; border-radius: 2px; padding: 18px; margin-top: 14px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <div>
          <div style="font-weight: 700; color: #0f1f38; font-size: 16px;">${escapeHtml(order.orderId)}</div>
          <div style="font-size: 12px; color: #64748b;">Placed: ${escapeHtml(order.displayDate)} &bull; Recipient: ${escapeHtml(order.customer.fullName)}</div>
        </div>
        <div>
          <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
        </div>
      </div>
      <div style="font-size: 13px; color: #374151; margin-bottom: 12px;">
        <strong>${order.items.length} item${order.items.length === 1 ? '' : 's'}</strong> &bull; Total: <strong>&#8377;${order.pricing.grandTotal.toFixed(2)}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; color: #64748b;">Method: ${escapeHtml(order.shipping.method)}</span>
        <a href="order-confirmation.html?id=${encodeURIComponent(order.orderId)}" class="btn-secondary" style="padding: 5px 10px; font-size: 12px;">View Full Details</a>
      </div>
    </div>
  `;
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

