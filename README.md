# FitZone Backend (Node + Express + MySQL)

## Setup
1. `npm install`
2. Create a free hosted MySQL database (see options below) and copy its host/port/user/password/db name.
3. `cp .env.example .env` and fill in the values (set a long random `JWT_SECRET`).
4. `npm run db:init`   -> creates all tables + seeds plans, trainers, equipment
5. `npm run dev`       -> API on http://localhost:5000

Check: http://localhost:5000/api/health

## Free hosted MySQL options (check current free-tier terms before signing up)
- Aiven (free MySQL plan)  - TiDB Cloud (free MySQL-compatible tier)  - or local MySQL / Docker while developing (`DB_SSL=false`).
Most hosted providers need SSL -> keep `DB_SSL=true`.

## API (all JSON). Protected routes need `Authorization: Bearer <token>`
Public (landing page)
- GET  /api/public/plans            Membership
- GET  /api/public/trainers         Trainers
- GET  /api/public/equipment        Equipment (?category=cardio|strength|free_weights|functional)
- POST /api/public/contact          { name, email, message }

Auth
- POST /api/auth/register           { name, email, password } -> { token, user }
- POST /api/auth/login              { email, password }       -> { token, user }
- GET  /api/auth/me                 -> user + profile_completed (use it to decide whether to show the onboarding form)

Dashboard (protected)
- GET/PUT /api/profile              { age, gender, height_cm, goal, activity_level, target_weight_kg, daily_calorie_target }
- GET/POST /api/measurements        { weight_kg, body_fat_pct, chest_cm, waist_cm, hips_cm, arms_cm, recorded_on? }
- DELETE /api/measurements/:id
- GET/POST /api/workouts            { title, type, duration_min, calories_burned, notes, workout_date?, exercises:[{name,sets,reps,weight_kg}] }
- DELETE /api/workouts/:id
- GET/POST /api/meals               { meal_type, food_name, calories, protein_g, carbs_g, fat_g, meal_date? }   GET ?date=YYYY-MM-DD
- DELETE /api/meals/:id
- GET /api/progress/summary         dashboard cards (weight, BMI, calories today, workouts this week)
- GET /api/progress?range=30        chart data (7-365 days): weight/body, workoutsPerWeek, workoutsByType, calories in vs burned, macroTotals
