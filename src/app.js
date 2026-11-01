require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const auth = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.use(helmet());
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:4200').split(',') }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Public (landing page + auth)
app.use('/api/public', require('./routes/public'));
app.use('/api/auth', require('./routes/auth'));

// Protected (logged-in dashboard)
app.use('/api/profile', auth, require('./routes/profile'));
app.use('/api/measurements', auth, require('./routes/measurements'));
app.use('/api/workouts', auth, require('./routes/workouts'));
app.use('/api/meals', auth, require('./routes/meals'));
app.use('/api/progress', auth, require('./routes/progress'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
