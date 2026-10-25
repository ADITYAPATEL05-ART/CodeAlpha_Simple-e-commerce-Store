document.addEventListener('DOMContentLoaded', () => {
  initProductDetails();
});

async function initProductDetails() {
  const container = document.getElementById('productDetailContainer');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    renderNotFound('No garment identifier was provided.');
    return;
  }

  try {
    const product = await API.getProductById(productId);
    renderProduct(product);
  } catch (err) {
    renderNotFound('Garment could not be found or is unavailable.');
  }
}

function renderNotFound(message) {
  const container = document.getElementById('productDetailContainer');
  container.innerHTML = `
    <div class="empty-state">
      <h2 style="font-size:20px; margin-bottom:8px;">Garment Not Found</h2>
      <p style="color:#717171; margin-bottom:16px;">${escapeHtml(message)}</p>
      <a href="index.html" class="btn-reserve" style="display:inline-block; width:auto; padding:10px 20px;">Return to Collection</a>
    </div>
  `;
}

function renderProduct(product) {
  document.title = `${product.name} - ADITYA CLOTHES`;

  const container = document.getElementById('productDetailContainer');
  const origin = product.origin || 'Artisan Workshop';
  const sizes = (product.specs && product.specs['Available Sizes']) ? product.specs['Available Sizes'].split(',') : ['S', 'M', 'L', 'XL'];
  const sizeOptions = sizes.map(s => `<option value="${s.trim()}">Size ${s.trim()}</option>`).join('');

  const specsRows = Object.entries(product.specs || {}).map(([key, val]) => `
    <tr>
      <th>${escapeHtml(key)}</th>
      <td>${escapeHtml(val)}</td>
    </tr>
  `).join('');

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const stockText = product.stock > 0
    ? (isLowStock ? `Only ${product.stock} units remaining` : `${product.stock} in stock`)
    : 'Out of stock';

  container.innerHTML = `
    <div class="detail-page-wrapper">
      <div class="detail-header-block">
        <h1 class="detail-title">${escapeHtml(product.name)}</h1>
        <div class="detail-subline">
          <span>&#9733; <strong>${product.rating.toFixed(1)}</strong> (${product.reviewCount} verified reviews)</span>
          <span>&bull;</span>
          <span>Crafted in <strong>${escapeHtml(origin)}</strong></span>
          <span>&bull;</span>
          <span>SKU: ${escapeHtml(product.sku)}</span>
          <span>&bull;</span>
          <span>Status: <strong>${stockText}</strong></span>
        </div>
      </div>

      <div class="detail-gallery">
        <img src="${product.image}" alt="${escapeHtml(product.name)}" id="mainProductImage">
      </div>

      <div class="detail-columns">
        <div>
          <div class="host-section">
            <h2 class="host-title">Garment crafted in ${escapeHtml(origin)}</h2>
            <div class="host-subtitle">${escapeHtml(product.category)} &bull; ${escapeHtml(product.specs['Material'] || 'Natural Fibers')}</div>
          </div>

          <div class="highlights-list">
            <div class="highlight-item">
              <div>
                <div class="highlight-heading">Ethically Milled & Tailored</div>
                <div class="highlight-desc">Sourced directly from independent partner mills adhering to fair trade labor standards.</div>
              </div>
            </div>
            <div class="highlight-item">
              <div>
                <div class="highlight-heading">Complimentary Shipping & Returns</div>
                <div class="highlight-desc">Complimentary standard ground delivery across India on orders over &#8377;1,999 with 30-day exchange privileges.</div>
              </div>
            </div>
            <div class="highlight-item">
              <div>
                <div class="highlight-heading">Pre-Shrunk Silhouette</div>
                <div class="highlight-desc">Enzyme-washed during fabric finishing to lock in structural shape and dimensional stability.</div>
              </div>
            </div>
          </div>

          <div class="detail-prose">
            ${escapeHtml(product.description)}
          </div>

          <div class="specs-block">
            <h3 style="font-size:16px; font-weight:700; color:#222222; margin-bottom:12px;">Garment Specifications</h3>
            <table class="specs-table">
              <tbody>
                ${specsRows}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div class="airbnb-reserve-box">
            <div class="reserve-price-row">
              <div>
                <span class="reserve-price">&#8377;${product.price.toLocaleString('en-IN')}</span>
                <span class="reserve-unit"> / piece</span>
              </div>
              <div style="font-size:13px; font-weight:600;">
                &#9733; ${product.rating.toFixed(1)} &bull; ${product.reviewCount} reviews
              </div>
            </div>

            <div class="reserve-inputs">
              <div class="reserve-input-row">
                <label class="reserve-input-label">Select Size</label>
                <select id="selectedSize" class="reserve-select">
                  ${sizeOptions}
                </select>
              </div>
              <div class="reserve-input-row">
                <label class="reserve-input-label">Quantity</label>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span id="qtyDisplay" style="font-weight:600; font-size:14px;">1 piece</span>
                  <div class="qty-stepper">
                    <button type="button" class="qty-step-btn" id="qtyMinusBtn">-</button>
                    <span class="qty-step-val" id="qtyNumber">1</span>
                    <button type="button" class="qty-step-btn" id="qtyPlusBtn">+</button>
                  </div>
                </div>
              </div>
            </div>

            <button type="button" class="btn-reserve" id="addToBagBtn" ${product.stock <= 0 ? 'disabled' : ''}>
              Add to Bag
            </button>
            <button type="button" class="btn-reserve-secondary" id="directOrderBtn" ${product.stock <= 0 ? 'disabled' : ''}>
              Order Now
            </button>

            <div style="text-align:center; font-size:12px; color:#717171; margin-bottom:14px;">
              Complimentary delivery on orders over &#8377;1,999
            </div>

            <div class="calc-breakdown">
              <div class="calc-row">
                <span id="breakdownUnits">&#8377;${product.price.toLocaleString('en-IN')} x 1</span>
                <span id="breakdownSubtotal">&#8377;${product.price.toLocaleString('en-IN')}</span>
              </div>
              <div class="calc-row">
                <span>Shipping</span>
                <span id="breakdownShipping">${product.price >= 1999 ? 'FREE' : '&#8377;149'}</span>
              </div>
              <div class="calc-row">
                <span>Estimated GST (5%)</span>
                <span id="breakdownTax">&#8377;${(product.price * 0.05).toFixed(2)}</span>
              </div>
              <div class="calc-total">
                <span>Total Due</span>
                <span id="breakdownTotal">&#8377;${(product.price + (product.price >= 1999 ? 0 : 149) + (product.price * 0.05)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  let currentQty = 1;
  const qtyMinus = document.getElementById('qtyMinusBtn');
  const qtyPlus = document.getElementById('qtyPlusBtn');
  const qtyNumber = document.getElementById('qtyNumber');
  const qtyDisplay = document.getElementById('qtyDisplay');
  const addBtn = document.getElementById('addToBagBtn');
  const orderBtn = document.getElementById('directOrderBtn');

  function updateReserveCalculations() {
    qtyNumber.textContent = currentQty;
    qtyDisplay.textContent = `${currentQty} piece${currentQty > 1 ? 's' : ''}`;
    const sub = product.price * currentQty;
    const shipping = sub >= 1999 ? 0 : 149.00;
    const tax = sub * 0.05;
    const total = sub + shipping + tax;

    document.getElementById('breakdownUnits').textContent = `₹${product.price.toLocaleString('en-IN')} x ${currentQty}`;
    document.getElementById('breakdownSubtotal').textContent = `₹${sub.toLocaleString('en-IN')}`;
    document.getElementById('breakdownShipping').textContent = shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`;
    document.getElementById('breakdownTax').textContent = `₹${tax.toFixed(2)}`;
    document.getElementById('breakdownTotal').textContent = `₹${total.toFixed(2)}`;
  }

  if (qtyMinus && qtyPlus) {
    qtyMinus.addEventListener('click', () => {
      if (currentQty > 1) {
        currentQty -= 1;
        updateReserveCalculations();
      }
    });

    qtyPlus.addEventListener('click', () => {
      if (currentQty < product.stock) {
        currentQty += 1;
        updateReserveCalculations();
      }
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      addToCart(product, currentQty);
    });
  }

  if (orderBtn) {
    orderBtn.addEventListener('click', () => {
      addToCart(product, currentQty);
      window.location.href = 'checkout.html';
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
