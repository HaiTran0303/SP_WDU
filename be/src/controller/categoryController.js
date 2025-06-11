const category = require('../model/category');

exports.getCategories = async (req, res) => {
  try {
    const categories = await category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy danh sách danh mục" });
  }
}

exports.getCategoryById = async (req, res) => {
  try {
    const categoryItem = await category.findById(req.params.id);
    if (!categoryItem) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }
    res.status(200).json(categoryItem);
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy danh mục" });
  }
}

exports.createCategory = async (req, res) => {
  try {
    const newCategory = new category(req.body);
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(500).json({ message: "Không thể tạo danh mục" });
  }
}

exports.updateCategory = async (req, res) => {
  try {
    const updatedCategory = await category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }
    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: "Không thể cập nhật danh mục" });
  }
}   

exports.deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }
    res.status(200).json({ message: "Danh mục đã được xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Không thể xóa danh mục" });
  }
}