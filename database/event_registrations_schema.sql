-- DCRC Conclave Event Registrations Table Schema
-- Stores delegate registration details and attendance modes

CREATE TABLE IF NOT EXISTS event_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  designation VARCHAR(255) DEFAULT NULL,
  role VARCHAR(255) NOT NULL, -- Attendance Mode
  status ENUM('Pending', 'Approved', 'Checked-In', 'Rejected') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Index for searching/filtering by email or status
CREATE UNIQUE INDEX idx_event_reg_email ON event_registrations(email);
CREATE INDEX idx_event_reg_status ON event_registrations(status);
