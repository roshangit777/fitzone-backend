CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS profiles (
  user_id INT PRIMARY KEY,
  age INT NULL,
  gender ENUM('male','female','other') NULL,
  height_cm DECIMAL(5,1) NULL,
  goal ENUM('lose_weight','gain_muscle','maintain','improve_endurance') NULL,
  activity_level ENUM('sedentary','light','moderate','active','very_active') NULL,
  target_weight_kg DECIMAL(5,1) NULL,
  daily_calorie_target INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS body_measurements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recorded_on DATE NOT NULL,
  weight_kg DECIMAL(5,1) NOT NULL,
  body_fat_pct DECIMAL(4,1) NULL,
  chest_cm DECIMAL(5,1) NULL,
  waist_cm DECIMAL(5,1) NULL,
  hips_cm DECIMAL(5,1) NULL,
  arms_cm DECIMAL(5,1) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bm_user_date (user_id, recorded_on),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS workouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  workout_date DATE NOT NULL,
  title VARCHAR(120) NOT NULL,
  type ENUM('strength','cardio','hiit','yoga','sports','other') NOT NULL DEFAULT 'strength',
  duration_min INT NOT NULL,
  calories_burned INT NULL,
  notes VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_w_user_date (user_id, workout_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS workout_exercises (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workout_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  sets INT NULL,
  reps INT NULL,
  weight_kg DECIMAL(5,1) NULL,
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS meals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  meal_date DATE NOT NULL,
  meal_type ENUM('breakfast','lunch','dinner','snack') NOT NULL,
  food_name VARCHAR(150) NOT NULL,
  calories INT NOT NULL,
  protein_g DECIMAL(6,1) NOT NULL DEFAULT 0,
  carbs_g DECIMAL(6,1) NOT NULL DEFAULT 0,
  fat_g DECIMAL(6,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_m_user_date (user_id, meal_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Public (landing page) tables
CREATE TABLE IF NOT EXISTS membership_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  price_monthly DECIMAL(8,2) NOT NULL,
  duration_label VARCHAR(40) NOT NULL,
  features JSON NOT NULL,
  is_popular TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS trainers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(120) NOT NULL,
  experience_years INT NOT NULL,
  bio VARCHAR(300) NULL,
  photo_url VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('cardio','strength','free_weights','functional') NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  status ENUM('available','maintenance') NOT NULL DEFAULT 'available',
  last_serviced_on DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
