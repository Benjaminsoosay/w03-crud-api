const validate = require('validate.js');

// Custom validator for numericality (supports greaterThan, greaterThanOrEqualTo, etc.)
validate.validators.numericality = function(value, options) {
  if (value === undefined || value === null) return null;
  const num = parseFloat(value);
  if (isNaN(num)) return 'must be a number';
  if (options.greaterThan !== undefined && num <= options.greaterThan) {
    return `must be greater than ${options.greaterThan}`;
  }
  if (options.greaterThanOrEqualTo !== undefined && num < options.greaterThanOrEqualTo) {
    return `must be greater than or equal to ${options.greaterThanOrEqualTo}`;
  }
  return null;
};

// Optional: email validator (not required for items, but kept for completeness)
validate.validators.email = function(value) {
  if (!value) return null;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(value) ? null : 'is not a valid email';
};

module.exports = validate;