const router = require('express').Router();
const { z } = require('zod');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const schema = z.object({
  meal_date: dateStr.optional(), // defaults to today
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  food_name: z.string().trim().min(1).max(150),
  calories: z.number().int().min(0).max(5000),
  protein_g: z.number().min(0).max(500).default(0),
  carbs_g: z.number().min(0).max(1000).default(0),
  fat_g: z.number().min(0).max(500).default(0),
});

// GET /api/meals?date=YYYY-MM-DD  (omit date for the latest 100 entries)
router.get('/', asyncHandler(async (req, res) => {
  const { date } = req.query;
  const [meals] = date
    ? await pool.query('SELECT * FROM meals WHERE user_id = ? AND meal_date = ? ORDER BY id', [req.user.id, date])
    : await pool.query('SELECT * FROM meals WHERE user_id = ? ORDER BY meal_date DESC, id DESC LIMIT 100', [req.user.id]);
  const totals = meals.reduce(
    (t, m) => ({
      calories: t.calories + m.calories,
      protein_g: t.protein_g + m.protein_g,
      carbs_g: t.carbs_g + m.carbs_g,
      fat_g: t.fat_g + m.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
  res.json({ meals, totals });
}));

router.post('/', validate(schema), asyncHandler(async (req, res) => {
  const m = req.body;
  const [result] = await pool.query(
    `INSERT INTO meals (user_id, meal_date, meal_type, food_name, calories, protein_g, carbs_g, fat_g)
     VALUES (?, COALESCE(?, CURDATE()), ?, ?, ?, ?, ?, ?)`,
    [req.user.id, m.meal_date ?? null, m.meal_type, m.food_name, m.calories, m.protein_g, m.carbs_g, m.fat_g]
  );
  const [rows] = await pool.query('SELECT * FROM meals WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM meals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
}));

module.exports = router;
