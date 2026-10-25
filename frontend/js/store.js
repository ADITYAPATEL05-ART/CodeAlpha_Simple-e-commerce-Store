let currentCategory = 'All';
let currentSearch = '';
let currentSort = 'default';

document.addEventListener('DOMContentLoaded', () => {
  initStore();
});

async function initStore() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('search')) {
    currentSearch = urlParams.get('search');
    const searchInput = document.getElementById('storeSearchInput');
    if (searchInput) {
      searchInput.value = currentSearch;
    }
  }

  if (urlParams.has('category')) {
    currentCategory = urlParams.get('category');
  }

  setupEventListeners();
  await loadCategories();
  await loadProducts();
}

function setupEventListeners() {
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('storeSearchInput');
      currentSearch = input.value.trim();
      loadProducts();
    });
  }

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      loadProducts();
    });
  }
}

async function loadCategories() {
  const tabsContainer = document.getElementById('categoryTabs');
  if (!tabsContainer) return;

  try {
    const categories = await API.getCategories();
    const allCategories = ['All Garments', ...categories];

    tabsContainer.innerHTML = allCategories.map(cat => {
      const isAll = cat === 'All Garments';
      const actualVal = isAll ? 'All' : cat;
      const isActive = actualVal.toLowerCase() === currentCategory.toLowerCase();
      return `<button class="category-item ${isActive ? 'active' : ''}" data-category="${escapeHtml(actualVal)}">
        <span>${escapeHtml(cat)}</span>
      </button>`;
    }).join('');

    tabsContainer.querySelectorAll('.category-item').forEach(tab => {
      tab.addEventListener('click', () => {
        tabsContainer.querySelectorAll('.category-item').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.dataset.category;
        loadProducts();
      });
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  const countEl = document.getElementById('productsCount');
  if (!grid) return;

  grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><p>Exploring garments...</p></div>';

  try {
    const products = await API.getProducts({
      category: currentCategory,
      search: currentSearch,
      sort: currentSort
    });

    if (countEl) {
      countEl.textContent = `${products.length} garment${products.length === 1 ? '' : 's'} available`;
    }

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <h3 style="font-size:18px; margin-bottom:8px;">No garments found</h3>
          <p style="color:#717171; margin-bottom:16px;">Try adjusting your search criteria or viewing all garments.</p>
          <button class="card-action-btn" id="resetBtn">View All Garments</button>
        </div>
      `;
      const resetBtn = document.getElementById('resetBtn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          currentCategory = 'All';
          currentSearch = '';
          const searchInput = document.getElementById('storeSearchInput');
          if (searchInput) searchInput.value = '';
          const tabs = document.querySelectorAll('.category-item');
          tabs.forEach(t => t.classList.toggle('active', t.dataset.category === 'All'));
          loadProducts();
        });
      }
      return;
    }

    grid.innerHTML = products.map(product => renderClothesCard(product)).join('');

    grid.querySelectorAll('.quick-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const product = products.find(p => p.id === id);
        if (product) {
          addToCart(product, 1);
        }
      });
    });
  } catch (err) {
    grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><p>Unable to load garments.</p></div>';
  }
}

function renderClothesCard(product) {
  const origin = product.origin || 'Artisan Workshop';
  const isLow = product.stock > 0 && product.stock <= 5;
  const stockBadge = isLow
    ? `<span class="stock-pill" style="color:#b91c1c;">Only ${product.stock} left</span>`
    : (product.stock > 0 ? `<span class="stock-pill">${product.stock} in stock</span>` : `<span class="stock-pill">Sold out</span>`);

  return `
    <div class="clothes-card">
      <div class="clothes-image-box">
        <a href="product.html?id=${product.id}">
          <img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy">
        </a>
        ${stockBadge}
      </div>
      <div class="clothes-card-content">
        <div class="card-top-row">
          <span class="card-origin">${escapeHtml(origin)}</span>
          <span class="card-rating">&#9733; ${product.rating.toFixed(1)} (${product.reviewCount})</span>
        </div>
        <h3 class="card-title">
          <a href="product.html?id=${product.id}">${escapeHtml(product.name)}</a>
        </h3>
        <div class="card-category-text">${escapeHtml(product.category)} &bull; ${escapeHtml(product.specs['Fit'] || 'Standard Fit')}</div>
        <div class="card-price-row">
          <div>
            <span class="card-price">&#8377;${product.price.toLocaleString('en-IN')}</span>
            <span class="card-unit"> / piece</span>
          </div>
          <div style="display:flex; gap:6px;">
            <a href="product.html?id=${product.id}" class="card-action-btn">View</a>
            <button class="card-action-btn quick-add-btn" data-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''} style="background-color:#222222; color:#ffffff;">
              Add
            </button>
          </div>
        </div>
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
