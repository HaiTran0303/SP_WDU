const Cart = require('../models/shoppingCart');

exports.getCartByUser = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate('products.productId');
    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
    }
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy giỏ hàng" });
  }
}

exports.createCart = async (req, res) => {
  try {
    const newCart = new Cart({
      userId: req.user.id,
      products: req.body.products || []
    });
    const savedCart = await newCart.save();
    res.status(201).json(savedCart);
  } catch (error) {
    res.status(500).json({ message: "Không thể tạo giỏ hàng" });
  }
}

exports.updateCart = async (req, res) => {
  try {
    const updatedCart = await Cart.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedCart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
    }
    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: "Không thể cập nhật giỏ hàng" });
  }
}

exports.deleteCart = async (req, res) => {
  try {
    const deletedCart = await Cart.findByIdAndDelete(req.params.id);
    if (!deletedCart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
    }
    res.status(200).json({ message: "Giỏ hàng đã được xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Không thể xóa giỏ hàng" });
  }
}

exports.getCartItemCount = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
    }
    const itemCount = cart.products.reduce((count, item) => count + item.quantity, 0);
    res.status(200).json({ itemCount });
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy số lượng sản phẩm trong giỏ hàng" });
  }
}