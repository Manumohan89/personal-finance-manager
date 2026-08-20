const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const { success } = require('../utils/formatResponse');

// @desc  List categories (optionally filter by type)
// @route GET /api/categories
const getCategories = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.type) filter.type = req.query.type;
  const categories = await Category.find(filter).sort({ name: 1 });
  return success(res, 200, 'Categories fetched', { categories });
});

// @desc  Create category
// @route POST /api/categories
const createCategory = asyncHandler(async (req, res) => {
  const { name, type, icon, color } = req.body;
  const exists = await Category.findOne({ user: req.user._id, name, type });
  if (exists) {
    res.status(400);
    throw new Error('A category with this name already exists for this type');
  }
  const category = await Category.create({ user: req.user._id, name, type, icon, color });
  return success(res, 201, 'Category created', { category });
});

// @desc  Update category
// @route PUT /api/categories/:id
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, user: req.user._id });
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  const { name, icon, color } = req.body;
  if (name !== undefined) category.name = name;
  if (icon !== undefined) category.icon = icon;
  if (color !== undefined) category.color = color;
  await category.save();
  return success(res, 200, 'Category updated', { category });
});

// @desc  Delete category (blocked if transactions still use it, unless reassignTo provided)
// @route DELETE /api/categories/:id
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, user: req.user._id });
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const usageCount = await Transaction.countDocuments({ user: req.user._id, category: category._id });

  if (usageCount > 0) {
    const { reassignTo } = req.body;
    if (!reassignTo) {
      res.status(400);
      throw new Error(
        `This category is used by ${usageCount} transaction(s). Provide reassignTo (another category id) to delete it.`
      );
    }
    const target = await Category.findOne({ _id: reassignTo, user: req.user._id, type: category.type });
    if (!target) {
      res.status(400);
      throw new Error('Reassignment category not found or type mismatch');
    }
    await Transaction.updateMany(
      { user: req.user._id, category: category._id },
      { $set: { category: target._id } }
    );
  }

  await category.deleteOne();
  return success(res, 200, 'Category deleted');
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
