const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation error' });
  }

  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate field value' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

module.exports = errorHandler;