const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing in .env');
    process.exit(1);
  }
  try {
    await pool.query('SELECT 1');
    console.log('MySQL connected');
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
    process.exit(1);
  }
  app.listen(PORT, () => console.log(`FitZone API running on http://localhost:${PORT}`));
})();
