const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/items');
const { validateItem } = require('../middleware/validate');

router.get('/', itemsController.getAllItems);
router.get('/:id', itemsController.getSingleItem);
router.post('/', validateItem, itemsController.createItem);
router.put('/:id', validateItem, itemsController.updateItem);
router.delete('/:id', itemsController.deleteItem);

module.exports = router;