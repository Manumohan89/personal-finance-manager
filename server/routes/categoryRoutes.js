const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { categoryValidator, mongoIdParam } = require('../validators/commonValidators');

router.use(protect);
router.route('/').get(getCategories).post(categoryValidator, validate, createCategory);
router
  .route('/:id')
  .put(mongoIdParam(), validate, updateCategory)
  .delete(mongoIdParam(), validate, deleteCategory);

module.exports = router;
