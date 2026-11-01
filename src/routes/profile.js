const router = require('express').Router();
const { z } = require('zod');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');

const profileSchema = z.object({
  age: z.number().int().min(10).max(100).nullish(),
  gender: z.enum(['male', 'female', 'other']).nullish(),
  height_cm: z.number().min(50).max(250),
  goal: z.enum(['lose_weight', 'gain_muscle', 'maintain', 'improve_endurance']),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).nullish(),
  target_weight_kg: z.number().min(20).max(300).nullish(),
  daily_calorie_target: z.number().int().min(800).max(10000).nullish(),
});

router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
  res.json(rows[0] || null);
}));

// Create or update (upsert)
router.put('/', validate(profileSchema), asyncHandler(async (req, res) => {
  const p = req.body;
  await pool.query(
    `INSERT INTO profiles (user_id, age, gender, height_cm, goal, activity_level, target_weight_kg, daily_calorie_target)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       age = VALUES(age), gender = VALUES(gender), height_cm = VALUES(height_cm), goal = VALUES(goal),
       activity_level = VALUES(activity_level), target_weight_kg = VALUES(target_weight_kg),
       daily_calorie_target = VALUES(daily_calorie_target)`,
    [req.user.id, p.age ?? null, p.gender ?? null, p.height_cm, p.goal, p.activity_level ?? null,
     p.target_weight_kg ?? null, p.daily_calorie_target ?? null]
  );
  const [rows] = await pool.query('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
  res.json(rows[0]);
}));

module.exports = router;
