const express = require("express");
const {
  getSellerProducts,
  getSellerProductById,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
} = require("../controllers/sellerProductController.js");
const router = express.Router();

router.get("/", getSellerProducts);
router.get("/:id", getSellerProductById);
router.post("/", createSellerProduct);
router.put("/:id", updateSellerProduct);
router.delete("/:id", deleteSellerProduct);

module.exports = router;
