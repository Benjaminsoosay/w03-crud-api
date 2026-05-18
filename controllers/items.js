const { ObjectId } = require('mongodb');

const getAllItems = async (req, res) => {
  try {
    const items = await req.db
      .collection('items')
      .find()
      .toArray();

    res.status(200).json(items);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message || 'Failed to fetch items'
    });
  }
};

const getSingleItem = async (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Must use a valid item id to find an item'
    });
  }

  try {
    const item = await req.db
      .collection('items')
      .findOne({ _id: new ObjectId(id) });

    if (!item) {
      return res.status(404).json({
        error: 'Item not found'
      });
    }

    res.status(200).json(item);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const createItem = async (req, res) => {
  try {
    const result = await req.db
      .collection('items')
      .insertOne(req.body);

    if (!result.acknowledged) {
      return res.status(500).json({
        error: 'Failed to create item'
      });
    }

    res.status(201).json({
      message: 'Item created successfully',
      id: result.insertedId
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message || 'Creation failed'
    });
  }
};

const updateItem = async (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Must use a valid item id to update an item'
    });
  }

  try {
    const result = await req.db
      .collection('items')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: req.body }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        error: 'Item not found'
      });
    }

    res.status(200).json({
      message: 'Item updated successfully'
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message || 'Update failed'
    });
  }
};

const deleteItem = async (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Must use a valid item id to delete an item'
    });
  }

  try {
    const result = await req.db
      .collection('items')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'Item not found'
      });
    }

    res.status(200).json({
      message: 'Item deleted successfully'
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message || 'Deletion failed'
    });
  }
};

module.exports = {
  getAllItems,
  getSingleItem,
  createItem,
  updateItem,
  deleteItem
};