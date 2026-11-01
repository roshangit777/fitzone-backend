const router = require('express').Router();
const { z } = require('zod');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');

// Landing page: Membership
router.get('/plans', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM membership_plans ORDER BY price_monthly');
  res.json(rows);
}));

// Landing page: Trainers
router.get('/trainers', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM trainers ORDER BY name');
  res.json(rows);
}));

// Landing page: Equipment (optional ?category=cardio)
router.get('/equipment', asyncHandler(async (req, res) => {
  const { category } = req.query;
  const [rows] = category
    ? await pool.query('SELECT * FROM equipment WHERE category = ? ORDER BY name', [category])
    : await pool.query('SELECT * FROM equipment ORDER BY category, name');
  res.json(rows);
}));

// Landing page: Contact
const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  message: z.string().trim().min(5).max(2000),
});
router.post('/contact', validate(contactSchema), asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;
  await pool.query('INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)', [name, email, message]);
  res.status(201).json({ message: 'Thanks! We will get back to you soon.' });
}));

module.exports = router;
