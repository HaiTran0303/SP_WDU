const Products = require('../models/product');

exports.getAllProducts = async (req, res) => {
  try {
    const productsList = await Products.find();
    res.status(200).json(productsList);
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy danh sách sản phẩm" });
  }
}

exports.getProductById = async (req, res) => {
  try {
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy sản phẩm" });
  }
}

exports.createProduct = async (req, res) => {
  try {
    const newProduct = new Products(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: "Không thể tạo sản phẩm" });
  }
}

exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Products.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Không thể cập nhật sản phẩm" });
  }
}

exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Products.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }
    res.status(200).json({ message: "Sản phẩm đã được xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Không thể xóa sản phẩm" });
  }
}

exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    const products = await Products.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Không thể tìm kiếm sản phẩm" });
  }
}

