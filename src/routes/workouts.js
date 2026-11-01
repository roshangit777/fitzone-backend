const router = require('express').Router();
const { z } = require('zod');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const schema = z.object({
  workout_date: dateStr.optional(), // defaults to today
  title: z.string().trim().min(2).max(120),
  type: z.enum(['strength', 'cardio', 'hiit', 'yoga', 'sports', 'other']).default('strength'),
  duration_min: z.number().int().min(1).max(600),
  calories_burned: z.number().int().min(0).max(5000).nullish(),
  notes: z.string().trim().max(500).nullish(),
  exercises: z.array(z.object({
    name: z.string().trim().min(1).max(120),
    sets: z.number().int().min(1).max(100).nullish(),
    reps: z.number().int().min(1).max(1000).nullish(),
    weight_kg: z.number().min(0).max(1000).nullish(),
  })).default([]),
});

router.get('/', asyncHandler(async (req, res) => {
  const [workouts] = await pool.query(
    'SELECT * FROM workouts WHERE user_id = ? ORDER BY workout_date DESC, id DESC LIMIT 100',
    [req.user.id]
  );
  if (workouts.length) {
    const [exercises] = await pool.query(
      'SELECT * FROM workout_exercises WHERE workout_id IN (?) ORDER BY id',
      [workouts.map((w) => w.id)]
    );
    workouts.forEach((w) => { w.exercises = exercises.filter((e) => e.workout_id === w.id); });
  }
  res.json(workouts);
}));

router.post('/', validate(schema), asyncHandler(async (req, res) => {
  const w = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO workouts (user_id, workout_date, title, type, duration_min, calories_burned, notes)
       VALUES (?, COALESCE(?, CURDATE()), ?, ?, ?, ?, ?)`,
      [req.user.id, w.workout_date ?? null, w.title, w.type, w.duration_min, w.calories_burned ?? null, w.notes ?? null]
    );
    if (w.exercises.length) {
      await conn.query(
        'INSERT INTO workout_exercises (workout_id, name, sets, reps, weight_kg) VALUES ?',
        [w.exercises.map((e) => [result.insertId, e.name, e.sets ?? null, e.reps ?? null, e.weight_kg ?? null])]
      );
    }
    await conn.commit();
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM workouts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
}));

module.exports = router;
