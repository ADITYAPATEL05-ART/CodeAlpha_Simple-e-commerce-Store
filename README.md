# ADITYA CLOTHES - Contemporary Sustainable Apparel

Contemporary e-commerce clothing application inspired by clean, content-first Airbnb listing layouts. Features real-time apparel catalogs, shopping bag management, sizing and inventory tracking, and full checkout order processing.

## Project Structure

```
CodeAlphaE-commerceStore/
├── backend/
│   ├── data/
│   │   ├── products.json
│   │   └── orders.json
│   ├── node_modules/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── css/
│   │   └── styles.css
│   ├── images/
│   │   ├── cargo-utility.jpg
│   │   ├── crewneck-ls.jpg
│   │   ├── denim-jacket.jpg
│   │   ├── halfzip-sweat.jpg
│   │   ├── hoodie-heavy.jpg
│   │   ├── merino-sweater.jpg
│   │   ├── pleated-chino.jpg
│   │   ├── puffer-bomber.jpg
│   │   ├── raw-denim.jpg
│   │   ├── tee-boxy.jpg
│   │   ├── tee-pocket.jpg
│   │   └── wool-overcoat.jpg
│   ├── js/
│   │   ├── api.js
│   │   ├── cart-page.js
│   │   ├── cart.js
│   │   ├── checkout.js
│   │   ├── order.js
│   │   ├── product.js
│   │   ├── products-data.js
│   │   └── store.js
│   ├── cart.html
│   ├── checkout.html
│   ├── index.html
│   ├── order-confirmation.html
│   ├── orders.html
│   ├── privacy.html
│   ├── product.html
│   └── terms.html
├── package.json
└── README.md
```

## Features

1. Garment Listings and Catalog:
   - Filter garments by category (T-Shirts, Hoodies, Jackets, Pants, Knitwear)
   - Real-time search matching garment titles, descriptions, and SKUs
   - Sorting by Price (ascending/descending), Rating, and Alphabetical
   - Airbnb-style listing cards displaying origin, rating, fabric specs, and price per piece

2. Garment Details Page (Airbnb Listing Layout):
   - Showcase gallery with high-resolution copyright-free garment photography
   - Origin workshop provenance and ethical milling highlights
   - Full fabric composition, weight in GSM, and care guidelines
   - Sticky order card with size dropdown (S, M, L, XL), quantity stepper, and live cost calculation

3. Shopping Bag:
   - Itemized bag table with clothing thumbnails, unit price, quantity stepper, and removal controls
   - Real-time subtotal, 5% GST calculation, and free delivery logic on orders over ₹1,999

4. Order Processing and Checkout:
   - Contact details capture and address validation
   - Courier delivery selection (Standard Ground vs Expedited Express)
   - Card tokenization simulation and Cash on Delivery support
   - Server-side inventory decrementing and order ledger persistence

5. Order Confirmation and Tracking:
   - Unique reference generation (e.g. ADI-...)
   - Itemized invoice breakdown with print capability
   - Order tracking by Reference ID or customer email address

6. Legal Compliance:
   - Terms of Service
   - Privacy Policy

## Getting Started

### Prerequisites
- Node.js (version 18 or newer)
- npm

### Installation & Execution

Option 1: Run with hot reload (Development)
```bash
npm run dev
```

Option 2: Run production start
```bash
npm start
```

Option 2: Run directly from Backend Directory
```bash
cd backend
node server.js
```

Once running, access the application in your web browser:
```
http://localhost:3000
```

Alternatively, the frontend directory can be served independently by any local web server (e.g. VS Code Live Server), as CORS is fully enabled on all backend REST endpoints and offline fallback data is included.
