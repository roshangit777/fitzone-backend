// Validates req.body against a zod schema and replaces it with the parsed value
module.exports = (schema) => (req, res, next) => {
  req.body = schema.parse(req.body);
  next();
};
