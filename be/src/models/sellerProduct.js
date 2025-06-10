const mongoose = require("mongoose");

const sellerProductSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        idProduct: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        status: {
          type: String,
          default: "active",
          enum: ["active", "inactive"],
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SellerProduct", sellerProductSchema);
