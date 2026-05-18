const validateItem = (req, res, next) => {
  const { body } = req;
  const errors = {};
  const isPost = req.method === 'POST';

  // For POST: require all required fields
  if (isPost) {
    const required = ['name', 'description', 'price', 'category', 'inStock', 'sku'];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        errors[field] = [`${field} is required`];
      }
    }
  }

  // Type checks – for any field that is present (works for both POST and PUT)
  if (body.name !== undefined && typeof body.name !== 'string') errors.name = ['must be a string'];
  if (body.description !== undefined && typeof body.description !== 'string') errors.description = ['must be a string'];
  if (body.price !== undefined && typeof body.price !== 'number') errors.price = ['must be a number'];
  if (body.category !== undefined && typeof body.category !== 'string') errors.category = ['must be a string'];
  if (body.inStock !== undefined && typeof body.inStock !== 'boolean') errors.inStock = ['must be a boolean'];
  if (body.sku !== undefined && typeof body.sku !== 'string') errors.sku = ['must be a string'];
  if (body.weight !== undefined && typeof body.weight !== 'number') errors.weight = ['must be a number'];
  if (body.manufacturer !== undefined && typeof body.manufacturer !== 'string') errors.manufacturer = ['must be a string'];

  if (Object.keys(errors).length > 0) {
    return res.status(412).json({ error: 'Validation failed', details: errors });
  }
  next();
};

const validateCategory = (req, res, next) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(412).json({
      error: 'Validation failed',
      details: { name: ['name is required and must be a string'] }
    });
  }
  next();
};

module.exports = { validateItem, validateCategory };