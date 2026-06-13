-- DCRF Coming Soon Interest Registrations Table Schema
-- Stores interest registration details for launching soon page

CREATE TABLE IF NOT EXISTS soon_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  organization VARCHAR(255) DEFAULT NULL,
  interest VARCHAR(255) NOT NULL, -- Area of interest
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Index for searching/filtering by email
CREATE UNIQUE INDEX idx_soon_reg_email ON soon_registrations(email);
