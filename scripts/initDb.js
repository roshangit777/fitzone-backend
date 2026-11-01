require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dbConfig = require('../src/config/dbConfig');

(async () => {
  const conn = await mysql.createConnection({ ...dbConfig, multipleStatements: true });
  try {
    console.log('Creating tables...');
    await conn.query(fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf8'));

    const [[plans]] = await conn.query('SELECT COUNT(*) AS c FROM membership_plans');
    if (!plans.c) {
      await conn.query(
        'INSERT INTO membership_plans (name, price_monthly, duration_label, features, is_popular) VALUES ?',
        [[
          ['Basic', 999, 'per month', JSON.stringify(['Gym floor access', 'Locker room', '1 free fitness assessment']), 0],
          ['Pro', 1999, 'per month', JSON.stringify(['Everything in Basic', 'Group classes', 'Diet plan', 'Progress tracking']), 1],
          ['Elite', 3499, 'per month', JSON.stringify(['Everything in Pro', 'Personal trainer (8 sessions)', 'Sauna & steam', 'Priority booking']), 0],
        ]]
      );
    }

    const [[trainers]] = await conn.query('SELECT COUNT(*) AS c FROM trainers');
    if (!trainers.c) {
      await conn.query(
        'INSERT INTO trainers (name, specialty, experience_years, bio, photo_url) VALUES ?',
        [[
          ['Arjun Rao', 'Strength & Conditioning', 8, 'Helps members build lean muscle with structured progressive overload.', null],
          ['Meera Nair', 'Yoga & Mobility', 6, 'Focuses on flexibility, posture and injury prevention.', null],
          ['Karthik S', 'HIIT & Fat Loss', 5, 'High-energy sessions designed for sustainable fat loss.', null],
          ['Priya Menon', 'Nutrition & Wellness', 7, 'Builds practical diet plans around your lifestyle and goals.', null],
        ]]
      );
    }

    const [[equip]] = await conn.query('SELECT COUNT(*) AS c FROM equipment');
    if (!equip.c) {
      await conn.query(
        'INSERT INTO equipment (name, category, quantity, status, last_serviced_on) VALUES ?',
        [[
          ['Treadmill', 'cardio', 8, 'available', '2026-09-15'],
          ['Elliptical Trainer', 'cardio', 4, 'available', '2026-09-20'],
          ['Spin Bike', 'cardio', 6, 'maintenance', '2026-08-30'],
          ['Leg Press Machine', 'strength', 2, 'available', '2026-09-10'],
          ['Cable Crossover', 'strength', 2, 'available', '2026-09-10'],
          ['Dumbbell Set (2-40kg)', 'free_weights', 1, 'available', null],
          ['Olympic Barbell + Rack', 'free_weights', 4, 'available', '2026-09-01'],
          ['Kettlebells', 'functional', 12, 'available', null],
        ]]
      );
    }
    console.log('Database ready.');
  } catch (err) {
    console.error('DB init failed:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
})();
