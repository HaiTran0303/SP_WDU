const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    processingFee: { type: Number, default: 0, min: 0 },
    currency: [
      {
        type: String,
        enum: ["USD", "EUR", "VND", "GBP", "JPY"],
        default: "USD",
      },
    ],
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
