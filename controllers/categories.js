const { ObjectId } = require('mongodb');

const getAllCategories = async (req, res) => {
  try {
    const categories = await req.db
      .collection('categories')
      .find()
      .toArray();

    res.status(200).json(categories);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message || 'Failed to fetch categories'
    });
  }
};

const getSingleCategory = async (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Must use a valid category id'
    });
  }

  try {
    const category = await req.db
      .collection('categories')
      .findOne({ _id: new ObjectId(id) });

    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    res.status(200).json(category);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message || 'Internal server error'
    });
  }
};

const createCategory = async (req, res) => {
  const newCategory = {
    name: req.body.name,
    description: req.body.description || '',
    priority: req.body.priority || 0,
    ownerId: req.body.ownerId || 'system',
    isActive: req.body.isActive ?? true,
    tags: req.body.tags || [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    const result = await req.db
      .collection('categories')
      .insertOne(newCategory);

    if (!result.acknowledged) {
      return res.status(500).json({
        error: 'Failed to create category'
      });
    }

    res.status(201).json({
      message: 'Category created successfully',
      id: result.insertedId
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message || 'Creation failed'
    });
  }
};

const updateCategory = async (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Must use a valid category id'
    });
  }

  const updateData = {
    ...req.body,
    updatedAt: new Date()
  };

  try {
    const result = await req.db
      .collection('categories')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    res.status(200).json({
      message: 'Category updated successfully'
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message || 'Update failed'
    });
  }
};

const deleteCategory = async (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Must use a valid category id'
    });
  }

  try {
    const result = await req.db
      .collection('categories')
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    res.status(200).json({
      message: 'Category deleted successfully'
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message || 'Deletion failed'
    });
  }
};

module.exports = {
  getAllCategories,
  getSingleCategory,
  createCategory,
  updateCategory,
  deleteCategory
};