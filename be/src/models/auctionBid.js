const mongoose = require("mongoose");

const auctionBidSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bidAmount: { type: Number, required: true, min: 0 },
    bidDate: { type: Date, default: Date.now },
    isWinningBid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuctionBid", auctionBidSchema);
