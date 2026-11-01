const router = require('express').Router();
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const round = (n, d = 1) => (n == null ? null : Math.round(n * 10 ** d) / 10 ** d);

// Quick numbers for the dashboard home page: GET /api/progress/summary
router.get('/summary', asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const [profileRows] = await pool.query('SELECT * FROM profiles WHERE user_id = ?', [uid]);
  const profile = profileRows[0];
  const [latest] = await pool.query(
    'SELECT weight_kg FROM body_measurements WHERE user_id = ? ORDER BY recorded_on DESC, id DESC LIMIT 1', [uid]);
  const [[today]] = await pool.query(
    'SELECT COALESCE(SUM(calories),0) AS calories_in FROM meals WHERE user_id = ? AND meal_date = CURDATE()', [uid]);
  const [[week]] = await pool.query(
    `SELECT COUNT(*) AS workouts, COALESCE(SUM(duration_min),0) AS minutes
     FROM workouts WHERE user_id = ? AND workout_date >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)`, [uid]);

  const weight = latest[0]?.weight_kg ?? null;
  res.json({
    current_weight_kg: weight,
    bmi: weight && profile?.height_cm ? round(weight / (profile.height_cm / 100) ** 2) : null,
    goal: profile?.goal ?? null,
    daily_calorie_target: profile?.daily_calorie_target ?? null,
    calories_today: today.calories_in,
    workouts_this_week: week.workouts,
    minutes_this_week: week.minutes,
  });
}));

// Everything the Progress page needs for charts: GET /api/progress?range=30
router.get('/', asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const range = Math.min(Math.max(parseInt(req.query.range, 10) || 30, 7), 365);

  const [body] = await pool.query(
    `SELECT recorded_on AS date, weight_kg, body_fat_pct, chest_cm, waist_cm, hips_cm, arms_cm
     FROM body_measurements
     WHERE user_id = ? AND recorded_on >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     ORDER BY recorded_on, id`, [uid, range]);

  const [workoutsPerWeek] = await pool.query(
    `SELECT DATE_SUB(workout_date, INTERVAL WEEKDAY(workout_date) DAY) AS week_start,
            COUNT(*) AS workouts, SUM(duration_min) AS minutes, COALESCE(SUM(calories_burned),0) AS calories_burned
     FROM workouts
     WHERE user_id = ? AND workout_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY week_start ORDER BY week_start`, [uid, range]);

  const [workoutsByType] = await pool.query(
    `SELECT type, COUNT(*) AS count, SUM(duration_min) AS minutes
     FROM workouts WHERE user_id = ? AND workout_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY type`, [uid, range]);

  const [burned] = await pool.query(
    `SELECT workout_date AS date, COALESCE(SUM(calories_burned),0) AS calories_burned
     FROM workouts WHERE user_id = ? AND workout_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY workout_date`, [uid, range]);

  const [intake] = await pool.query(
    `SELECT meal_date AS date, SUM(calories) AS calories_in,
            SUM(protein_g) AS protein_g, SUM(carbs_g) AS carbs_g, SUM(fat_g) AS fat_g
     FROM meals WHERE user_id = ? AND meal_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY meal_date ORDER BY meal_date`, [uid, range]);

  // Merge intake + burned by date for one "calories" chart
  const byDate = {};
  intake.forEach((r) => { byDate[r.date] = { date: r.date, calories_in: r.calories_in, calories_burned: 0 }; });
  burned.forEach((r) => {
    byDate[r.date] = { date: r.date, calories_in: byDate[r.date]?.calories_in ?? 0, calories_burned: r.calories_burned };
  });
  const calories = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

  const macroTotals = intake.reduce(
    (t, r) => ({ protein_g: t.protein_g + r.protein_g, carbs_g: t.carbs_g + r.carbs_g, fat_g: t.fat_g + r.fat_g }),
    { protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  // Overall stats (all time, not only this range)
  const [first] = await pool.query(
    'SELECT weight_kg FROM body_measurements WHERE user_id = ? ORDER BY recorded_on, id LIMIT 1', [uid]);
  const [last] = await pool.query(
    'SELECT weight_kg FROM body_measurements WHERE user_id = ? ORDER BY recorded_on DESC, id DESC LIMIT 1', [uid]);
  const [profileRows] = await pool.query('SELECT height_cm, target_weight_kg FROM profiles WHERE user_id = ?', [uid]);
  const profile = profileRows[0];
  const start = first[0]?.weight_kg ?? null;
  const current = last[0]?.weight_kg ?? null;

  res.json({
    range,
    summary: {
      start_weight_kg: start,
      current_weight_kg: current,
      weight_change_kg: start != null && current != null ? round(current - start) : null,
      target_weight_kg: profile?.target_weight_kg ?? null,
      bmi: current && profile?.height_cm ? round(current / (profile.height_cm / 100) ** 2) : null,
      total_workouts: workoutsPerWeek.reduce((s, w) => s + w.workouts, 0),
      total_minutes: workoutsPerWeek.reduce((s, w) => s + (w.minutes || 0), 0),
      avg_daily_calories: intake.length
        ? Math.round(intake.reduce((s, r) => s + r.calories_in, 0) / intake.length) : null,
    },
    charts: { body, workoutsPerWeek, workoutsByType, calories, macroTotals },
  });
}));

module.exports = router;
