const { ZodError } = require('zod');

exports.notFound = (req, res) =>
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Record already exists' });
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
};
