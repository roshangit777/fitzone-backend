const router = require('express').Router();
const { z } = require('zod');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const schema = z.object({
  recorded_on: dateStr.optional(), // defaults to today
  weight_kg: z.number().min(20).max(300),
  body_fat_pct: z.number().min(2).max(70).nullish(),
  chest_cm: z.number().min(30).max(250).nullish(),
  waist_cm: z.number().min(30).max(250).nullish(),
  hips_cm: z.number().min(30).max(250).nullish(),
  arms_cm: z.number().min(10).max(100).nullish(),
});

router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM body_measurements WHERE user_id = ? ORDER BY recorded_on DESC, id DESC LIMIT 200',
    [req.user.id]
  );
  res.json(rows);
}));

router.post('/', validate(schema), asyncHandler(async (req, res) => {
  const m = req.body;
  const [result] = await pool.query(
    `INSERT INTO body_measurements (user_id, recorded_on, weight_kg, body_fat_pct, chest_cm, waist_cm, hips_cm, arms_cm)
     VALUES (?, COALESCE(?, CURDATE()), ?, ?, ?, ?, ?, ?)`,
    [req.user.id, m.recorded_on ?? null, m.weight_kg, m.body_fat_pct ?? null, m.chest_cm ?? null,
     m.waist_cm ?? null, m.hips_cm ?? null, m.arms_cm ?? null]
  );
  const [rows] = await pool.query('SELECT * FROM body_measurements WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM body_measurements WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
}));

module.exports = router;
