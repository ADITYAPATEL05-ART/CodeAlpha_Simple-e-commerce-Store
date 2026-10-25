const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const productsFilePath = path.join(__dirname, 'data', 'products.json');
const ordersFilePath = path.join(__dirname, 'data', 'orders.json');
const frontendPath = path.join(__dirname, '..', 'frontend');

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.static(frontendPath));
app.use('/images', express.static(path.join(frontendPath, 'images')));
app.use('/frontend/images', express.static(path.join(frontendPath, 'images')));

function readJsonFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/categories', (req, res) => {
  const products = readJsonFile(productsFilePath);
  const categories = Array.from(new Set(products.map(p => p.category)));
  res.json(categories);
});

app.get('/api/products', (req, res) => {
  let products = readJsonFile(productsFilePath);
  const { category, search, sort } = req.query;

  if (category && category !== 'All') {
    products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const query = search.trim().toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.shortDescription.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query)
    );
  }

  if (sort === 'price-asc') {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    products.sort((a, b) => b.price - a.price);
  } else if (sort === 'rating-desc') {
    products.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'name-asc') {
    products.sort((a, b) => a.name.localeCompare(b.name));
  }

  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const products = readJsonFile(productsFilePath);
  const id = parseInt(req.params.id, 10);
  const product = products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json(product);
});

app.post('/api/orders', (req, res) => {
  const { customer, shipping, payment, items, notes } = req.body;

  if (!customer || !customer.fullName || !customer.email || !customer.phone) {
    return res.status(400).json({ error: 'Customer information is incomplete' });
  }

  if (!shipping || !shipping.address || !shipping.city || !shipping.postalCode) {
    return res.status(400).json({ error: 'Shipping address is incomplete' });
  }

  if (!payment || !payment.method) {
    return res.status(400).json({ error: 'Payment method is required' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }

  const products = readJsonFile(productsFilePath);
  const validatedItems = [];
  let subtotal = 0;

  for (const cartItem of items) {
    const product = products.find(p => p.id === cartItem.id);
    if (!product) {
      return res.status(400).json({ error: `Product ID ${cartItem.id} does not exist` });
    }

    const quantity = Math.max(1, parseInt(cartItem.quantity, 10) || 1);
    if (product.stock < quantity) {
      return res.status(400).json({
        error: `Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${quantity}`
      });
    }

    const itemTotal = Number((product.price * quantity).toFixed(2));
    subtotal += itemTotal;

    product.stock -= quantity;

    validatedItems.push({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity,
      itemTotal,
      image: product.image
    });
  }

  subtotal = Number(subtotal.toFixed(2));
  const shippingFee = subtotal >= 1999 ? 0.00 : 149.00;
  const taxRate = 0.05;
  const tax = Number((subtotal * taxRate).toFixed(2));
  const grandTotal = Number((subtotal + shippingFee + tax).toFixed(2));

  const orderId = 'ADI-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
  const now = new Date();

  const newOrder = {
    orderId,
    createdAt: now.toISOString(),
    displayDate: now.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    status: 'Confirmed',
    customer: {
      fullName: customer.fullName.trim(),
      email: customer.email.trim(),
      phone: customer.phone.trim()
    },
    shipping: {
      address: shipping.address.trim(),
      city: shipping.city.trim(),
      state: shipping.state ? shipping.state.trim() : '',
      postalCode: shipping.postalCode.trim(),
      country: shipping.country ? shipping.country.trim() : 'India',
      method: shipping.shippingOption || 'Standard Delivery (3-5 business days)'
    },
    payment: {
      method: payment.method,
      lastFourDigits: payment.cardNumber ? payment.cardNumber.replace(/\s+/g, '').slice(-4) : 'N/A'
    },
    items: validatedItems,
    pricing: {
      subtotal,
      shippingFee,
      tax,
      grandTotal
    },
    notes: notes ? notes.trim() : ''
  };

  writeJsonFile(productsFilePath, products);

  const orders = readJsonFile(ordersFilePath);
  orders.unshift(newOrder);
  writeJsonFile(ordersFilePath, orders);

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    order: newOrder
  });
});

app.get('/api/orders/:id', (req, res) => {
  const orders = readJsonFile(ordersFilePath);
  const orderId = req.params.id.trim();
  const order = orders.find(o => o.orderId.toLowerCase() === orderId.toLowerCase());

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json(order);
});

app.get('/api/orders', (req, res) => {
  const orders = readJsonFile(ordersFilePath);
  const { email, orderId } = req.query;

  let filtered = orders;

  if (orderId) {
    filtered = filtered.filter(o => o.orderId.toLowerCase() === orderId.trim().toLowerCase());
  }

  if (email) {
    filtered = filtered.filter(o => o.customer.email.toLowerCase() === email.trim().toLowerCase());
  }

  res.json(filtered);
});

app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
