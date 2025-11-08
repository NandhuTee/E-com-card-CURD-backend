import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import Order from "./models/Order.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const USE_FAKE_STORE = process.env.USE_FAKE_STORE === "true";
let cart = [];

// ======= Products =======
let localProducts = [
  { id: 1, name: "Wireless Headphones", price: 2999 },
  { id: 2, name: "Smart Watch", price: 1999 },
  { id: 3, name: "Bluetooth Speaker", price: 1499 },
  { id: 4, name: "Laptop Sleeve", price: 899 },
  { id: 5, name: "USB-C Hub", price: 1299 },
];

async function getProducts() {
  if (USE_FAKE_STORE) {
    try {
      const res = await fetch("https://fakestoreapi.com/products?limit=10");
      const data = await res.json();
      return data.map((p) => ({
        id: p.id,
        name: p.title,
        price: p.price,
        description: p.description,
        image: p.image,
      }));
    } catch (err) {
      console.error("❌ Failed to fetch FakeStoreAPI, using local products.");
      return localProducts;
    }
  } else {
    return localProducts;
  }
}

// ======= Routes =======

// Get all products
app.get("/api/products", async (req, res) => {
  const products = await getProducts();
  res.json(products);
});

// Get current cart
app.get("/api/cart", (req, res) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  res.json({ cart, total });
});

// Add item to cart
app.post("/api/cart", async (req, res) => {
  const { productId, qty } = req.body;
  const products = await getProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const existing = cart.find((item) => item.productId === productId);
  if (existing) existing.qty += qty;
  else cart.push({ productId, name: product.name, price: product.price, qty });

  res.json({ message: "Added to cart", cart });
});

// Remove item from cart
app.delete("/api/cart/:id", (req, res) => {
  const id = parseInt(req.params.id);
  cart = cart.filter((item) => item.productId !== id);
  res.json({ message: "Removed from cart", cart });
});

// Checkout - save order to MongoDB Atlas
app.post("/api/checkout", async (req, res) => {
  const { cartItems, name, email } = req.body;

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  try {
    const newOrder = new Order({
      name,
      email,
      cartItems,
      total,
      timestamp: new Date().toISOString(),
    });

    await newOrder.save();

    cart = []; // Clear cart after checkout
    res.json({ message: "Checkout successful", order: newOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save order" });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`✅ Backend running on http://localhost:${PORT}`)
);
