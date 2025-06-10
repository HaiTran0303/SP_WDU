const express = require("express");
const {
  getBidsByProduct,
  createBid,
  updateBid,
} = require("../controllers/auctionController.js");

const router = express.Router();

router.get("/", getBidsByProduct);
router.post("/", createBid);
router.patch("/:id", updateBid);

module.exports = router;
