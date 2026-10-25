const API_BASE = (window.location.port === '3000') ? '' : 'http://localhost:3000';

function sanitizeImage(img) {
  if (!img) return 'images/tee-boxy.jpg';
  if (img.startsWith('/')) return img.slice(1);
  return img;
}

const API = {
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') {
      query.append('category', params.category);
    }
    if (params.search) {
      query.append('search', params.search);
    }
    if (params.sort) {
      query.append('sort', params.sort);
    }

    try {
      const url = `${API_BASE}/api/products` + (query.toString() ? '?' + query.toString() : '');
      const res = await fetch(url);
      if (!res.ok) throw new Error('API fetch failed');
      const data = await res.json();
      return data.map(item => ({ ...item, image: sanitizeImage(item.image) }));
    } catch (e) {
      let list = [...(typeof FALLBACK_PRODUCTS !== 'undefined' ? FALLBACK_PRODUCTS : [])];
      if (params.category && params.category !== 'All') {
        list = list.filter(p => p.category.toLowerCase() === params.category.toLowerCase());
      }
      if (params.search) {
        const q = params.search.trim().toLowerCase();
        list = list.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
        );
      }
      if (params.sort === 'price-asc') {
        list.sort((a, b) => a.price - b.price);
      } else if (params.sort === 'price-desc') {
        list.sort((a, b) => b.price - a.price);
      } else if (params.sort === 'rating-desc') {
        list.sort((a, b) => b.rating - a.rating);
      } else if (params.sort === 'name-asc') {
        list.sort((a, b) => a.name.localeCompare(b.name));
      }
      return list.map(item => ({ ...item, image: sanitizeImage(item.image) }));
    }
  },

  async getProductById(id) {
    const targetId = parseInt(id, 10);
    try {
      const res = await fetch(`${API_BASE}/api/products/` + encodeURIComponent(id));
      if (!res.ok) throw new Error('Product not found');
      const item = await res.json();
      return { ...item, image: sanitizeImage(item.image) };
    } catch (e) {
      const item = (typeof FALLBACK_PRODUCTS !== 'undefined' ? FALLBACK_PRODUCTS : []).find(p => p.id === targetId);
      if (!item) throw new Error('Product not found');
      return { ...item, image: sanitizeImage(item.image) };
    }
  },

  async getCategories() {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      if (!res.ok) throw new Error('Categories fetch failed');
      return await res.json();
    } catch (e) {
      const prods = (typeof FALLBACK_PRODUCTS !== 'undefined' ? FALLBACK_PRODUCTS : []);
      return Array.from(new Set(prods.map(p => p.category)));
    }
  },

  async submitOrder(orderData) {
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');
      return data;
    } catch (e) {
      const prods = typeof FALLBACK_PRODUCTS !== 'undefined' ? FALLBACK_PRODUCTS : [];
      let subtotal = 0;
      const validatedItems = [];
      for (const cartItem of orderData.items) {
        const product = prods.find(p => p.id === cartItem.id);
        const qty = cartItem.quantity || 1;
        const price = product ? product.price : 999.00;
        const total = price * qty;
        subtotal += total;
        validatedItems.push({
          id: cartItem.id,
          name: product ? product.name : 'Garment',
          sku: product ? product.sku : 'ADI-01',
          price,
          quantity: qty,
          itemTotal: total,
          image: product ? sanitizeImage(product.image) : 'images/tee-boxy.jpg'
        });
      }
      const shippingFee = subtotal >= 1999 ? 0.00 : 149.00;
      const tax = Number((subtotal * 0.05).toFixed(2));
      const grandTotal = Number((subtotal + shippingFee + tax).toFixed(2));
      const orderId = 'ADI-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
      const now = new Date();

      const newOrder = {
        orderId,
        createdAt: now.toISOString(),
        displayDate: now.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: 'Confirmed',
        customer: orderData.customer,
        shipping: {
          ...orderData.shipping,
          method: orderData.shipping.shippingOption || 'Standard Delivery'
        },
        payment: {
          method: orderData.payment.method,
          lastFourDigits: orderData.payment.cardNumber ? orderData.payment.cardNumber.slice(-4) : 'N/A'
        },
        items: validatedItems,
        pricing: { subtotal, shippingFee, tax, grandTotal }
      };

      const localOrders = JSON.parse(localStorage.getItem('aditya_local_orders') || '[]');
      localOrders.unshift(newOrder);
      localStorage.setItem('aditya_local_orders', JSON.stringify(localOrders));

      return { success: true, order: newOrder };
    }
  },

  async getOrderById(orderId) {
    try {
      const res = await fetch(`${API_BASE}/api/orders/` + encodeURIComponent(orderId));
      if (!res.ok) throw new Error('Order not found');
      return await res.json();
    } catch (e) {
      const localOrders = JSON.parse(localStorage.getItem('aditya_local_orders') || '[]');
      const match = localOrders.find(o => o.orderId.toLowerCase() === orderId.toLowerCase());
      if (match) return match;
      throw new Error('Order not found');
    }
  },

  async getOrders(params = {}) {
    try {
      const query = new URLSearchParams(params);
      const res = await fetch(`${API_BASE}/api/orders` + (query.toString() ? '?' + query.toString() : ''));
      if (!res.ok) throw new Error('Orders fetch failed');
      return await res.json();
    } catch (e) {
      let localOrders = JSON.parse(localStorage.getItem('aditya_local_orders') || '[]');
      if (params.orderId) {
        localOrders = localOrders.filter(o => o.orderId.toLowerCase() === params.orderId.toLowerCase());
      }
      if (params.email) {
        localOrders = localOrders.filter(o => o.customer.email.toLowerCase() === params.email.toLowerCase());
      }
      return localOrders;
    }
  }
};
