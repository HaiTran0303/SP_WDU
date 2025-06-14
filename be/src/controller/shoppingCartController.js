const Cart = require('../models/shoppingCart');

// Lấy giỏ hàng của người dùng
exports.getCartByUser = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate('products.idProduct');
    if (!cart) {
      return res.status(200).json({ products: [], message: "Giỏ hàng trống" });
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy giỏ hàng", error: error.message });
  }
};

// Tạo giỏ hàng mới
exports.createCart = async (req, res) => {
  try {
    // Kiểm tra xem người dùng đã có giỏ hàng chưa
    const existingCart = await Cart.findOne({ userId: req.user.id });
    if (existingCart) {
      return res.status(400).json({ message: "Người dùng đã có giỏ hàng" });
    }

    // Validation cho products
    const products = req.body.products || [];
    if (!Array.isArray(products)) {
      return res.status(400).json({ message: "Products phải là một mảng" });
    }

    for (const item of products) {
      if (!item.idProduct || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ message: "Dữ liệu sản phẩm không hợp lệ" });
      }
    }

    const newCart = new Cart({
      userId: req.user.id,
      products,
    });

    const savedCart = await newCart.save();
    res.status(201).json(savedCart);
  } catch (error) {
    res.status(500).json({ message: "Không thể tạo giỏ hàng", error: error.message });
  }
};

// Cập nhật giỏ hàng
exports.updateCart = async (req, res) => {
  try {
    const { products } = req.body;

    // Kiểm tra giỏ hàng tồn tại và thuộc về người dùng
    const cart = await Cart.findOne({ _id: req.params.id, userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại hoặc không thuộc về bạn" });
    }

    // Validation cho products
    if (products && !Array.isArray(products)) {
      return res.status(400).json({ message: "Products phải là một mảng" });
    }

    if (products) {
      for (const item of products) {
        if (!item.idProduct || !item.quantity || item.quantity < 1) {
          return res.status(400).json({ message: "Dữ liệu sản phẩm không hợp lệ" });
        }
      }
      cart.products = products.map(p => ({
        idProduct: p.idProduct,
        quantity: p.quantity
      }));
    }

    const updatedCart = await cart.save();
    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: "Không thể cập nhật giỏ hàng", error: error.message });
  }
};

// Xóa giỏ hàng
exports.deleteCart = async (req, res) => {
  try {
    // Kiểm tra giỏ hàng tồn tại và thuộc về người dùng
    const cart = await Cart.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại hoặc không thuộc về bạn" });
    }
    res.status(200).json({ message: "Giỏ hàng đã được xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Không thể xóa giỏ hàng", error: error.message });
  }
};

// Lấy số lượng sản phẩm trong giỏ hàng
exports.getCartItemCount = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(200).json({ itemCount: 0, message: "Giỏ hàng trống" });
    }
    const itemCount = cart.products.reduce((count, item) => count + item.quantity, 0);
    res.status(200).json({ itemCount });
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy số lượng sản phẩm trong giỏ hàng", error: error.message });
  }
};