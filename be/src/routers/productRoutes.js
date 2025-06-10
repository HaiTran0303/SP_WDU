const express = require("express");
const {
  getAllProducts,
  searchProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controller/productController.js");
const verifyToken = require("../middleware/verifyToken.js");
const router = express.Router();
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", verifyToken, updateProduct);
router.delete("/:id", deleteProduct);
router.get("/search", searchProducts);
module.exports = router;
