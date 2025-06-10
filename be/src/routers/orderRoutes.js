const express = require("express");
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  patchOrder,
} = require("../controllers/orderController.js");
const verifyToken = require("../middleware/verifyToken.js");
const router = express.Router();
router.post("/", verifyToken, createOrder);
router.get("/", getAllOrders);
router.get("/:id", getOrderById);
router.put("/:id", updateOrder);
router.patch("/:id", patchOrder);
module.exports = router;
