import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch'; // install if not present: npm install node-fetch

const app = express();
app.use(cors());
app.use(express.json());

// =============== PRODUCT SOURCE CONFIG ===============
const USE_FAKE_STORE = true;

// Local fallback mock products
let localProducts = [
  { id: 1, name: 'Wireless Headphones', price: 2999 },
  { id: 2, name: 'Smart Watch', price: 1999 },
  { id: 3, name: 'Bluetooth Speaker', price: 1499 },
  { id: 4, name: 'Laptop Sleeve', price: 899 },
  { id: 5, name: 'USB-C Hub', price: 1299 },
];

// =============== FETCH PRODUCTS ===============
async function getProducts() {
  if (USE_FAKE_STORE) {
    try {
      const res = await fetch('https://fakestoreapi.com/products?limit=10');
      const data = await res.json();

      // Transform FakeStoreAPI response → match frontend structure
      return data.map((p) => ({
        id: p.id,
        name: p.title,
        price: p.price,
        description: p.description,
        image: p.image,
      }));
    } catch (err) {
      console.error('❌ Error fetching from FakeStoreAPI, using local data...');
      return localProducts;
    }
  } else {
    return localProducts;
  }
}

// =============== CART & CHECKOUT LOGIC ===============
let cart = [];

app.get('/api/products', async (req, res) => {
  const products = await getProducts();
  res.json(products);
});

app.get('/api/cart', (req, res) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  res.json({ cart, total });
});

app.post('/api/cart', async (req, res) => {
  const { productId, qty } = req.body;
  const products = await getProducts();
  const product = products.find((p) => p.id === productId);

  if (!product) return res.status(404).json({ message: 'Product not found' });

  const existing = cart.find((item) => item.productId === productId);
  if (existing) existing.qty += qty;
  else cart.push({ productId, name: product.name, price: product.price, qty });

  res.json({ message: 'Added to cart', cart });
});

app.delete('/api/cart/:id', (req, res) => {
  const id = parseInt(req.params.id);
  cart = cart.filter((item) => item.productId !== id);
  res.json({ message: 'Removed from cart', cart });
});

app.post('/api/checkout', (req, res) => {
  const { cartItems, name, email } = req.body;

  const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const receipt = {
    name,
    email,
    total,
    timestamp: new Date().toISOString(),
  };

  // Clear cart after checkout
  cart = [];
  res.json({ message: 'Checkout successful', receipt });
});

// =============== SERVER LISTENER ===============
const PORT = 4000;
app.listen(PORT, () =>
  console.log(`✅ Backend running with Fake Store API on http://localhost:${PORT}`)
);
