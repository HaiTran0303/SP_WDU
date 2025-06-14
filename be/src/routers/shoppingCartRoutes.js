const express = require("express");
const {
  getCartByUser,
  createCart,
  updateCart,
  deleteCart,
  getCartItemCount,
  addToCart
} = require("../controller/shoppingCartController.js");
const veryfyToken = require("../middleware/verifyToken.js");
const router = express.Router();

router.get("/", veryfyToken, getCartByUser);
router.post("/", veryfyToken, createCart);
router.patch("/:id", veryfyToken, updateCart);
router.delete("/:id", veryfyToken, deleteCart);
router.get("/count", veryfyToken, getCartItemCount);
router.post("/add", veryfyToken, addToCart);

module.exports = router;
