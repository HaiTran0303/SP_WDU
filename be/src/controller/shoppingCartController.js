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
    const { productId, quantity } = req.body;
    console.log("Received request - Product ID:", productId, "Quantity:", quantity); // Log để debug
    const cart = await Cart.findOne({ _id: req.params.id, userId: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng không tồn tại hoặc không thuộc về bạn" });
    }

    const productIndex = cart.products.findIndex(p => p.idProduct.toString() === productId);
    if (productIndex === -1) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại trong giỏ hàng" });
    }

    if (quantity < 1) {
      cart.products.splice(productIndex, 1); // Xóa sản phẩm khi quantity < 1
    } else {
      cart.products[productIndex].quantity = quantity; // Cập nhật số lượng nếu quantity >= 1
    }

    const updatedCart = await cart.save();
    console.log("Updated Cart:", updatedCart); // Log để debug
    res.status(200).json(updatedCart);
  } catch (error) {
    console.error("Error in updateCart:", error);
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

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body; // Lấy productId và quantity từ request body
    if (!productId || quantity < 1) {
      return res.status(400).json({ message: "Dữ liệu sản phẩm không hợp lệ" });
    }

    // Tìm giỏ hàng của người dùng
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      // Tạo giỏ hàng mới nếu chưa có
      cart = new Cart({
        userId: req.user.id,
        products: [{ idProduct: productId, quantity }],
      });
    } else {
      // Kiểm tra sản phẩm đã tồn tại trong giỏ hàng chưa
      const existingProduct = cart.products.find(p => p.idProduct.toString() === productId);
      if (existingProduct) {
        const newQuantity = existingProduct.quantity + quantity;
        // Kiểm tra giới hạn tồn kho (giả định cần gọi API sản phẩm để kiểm tra)
        const product = await fetchProductDetails(productId); // Hàm này cần được triển khai để lấy thông tin sản phẩm
        if (newQuantity > product.quantity) {
          return res.status(400).json({ message: "Không thể thêm sản phẩm; đã đạt giới hạn tồn kho!" });
        }
        existingProduct.quantity = newQuantity;
      } else {
        cart.products.push({ idProduct: productId, quantity });
      }
    }

    const updatedCart = await cart.save();
    res.status(200).json({ message: "Đã thêm sản phẩm vào giỏ hàng", cart: updatedCart });
  } catch (error) {
    res.status(500).json({ message: "Không thể thêm sản phẩm vào giỏ hàng", error: error.message });
  }
};