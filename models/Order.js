// models/Order.js
import mongoose from "../db.js";

const orderSchema = new mongoose.Schema({
  name: String,
  email: String,
  cartItems: [
    {
      productId: Number,
      name: String,
      price: Number,
      qty: Number,
    },
  ],
  total: Number,
  timestamp: String,
});

export default mongoose.model("Order", orderSchema);
