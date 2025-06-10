const mongoose = require("mongoose");

const cartProductSchema = new mongoose.Schema(
  {
    idProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shoppingCartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [cartProductSchema],
    dateAdded: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShoppingCart", shoppingCartSchema);
