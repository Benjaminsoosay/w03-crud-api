const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categories');
const { validateCategory } = require('../middleware/validate');

router.get('/', categoriesController.getAllCategories);
router.get('/:id', categoriesController.getSingleCategory);
router.post('/', validateCategory, categoriesController.createCategory);
router.put('/:id', validateCategory, categoriesController.updateCategory);
router.delete('/:id', categoriesController.deleteCategory);

module.exports = router;