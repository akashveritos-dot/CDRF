-- Council Members Table Schema
-- This table stores information about DCRF council members

CREATE TABLE IF NOT EXISTS councils (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  role_badge_color VARCHAR(50) DEFAULT 'default',
  avatar_initials VARCHAR(5) NOT NULL,
  profile_image VARCHAR(500),
  bio TEXT NOT NULL,
  linkedin_url VARCHAR(500),
  organization VARCHAR(255),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert council members data
INSERT INTO councils (id, name, role, role_badge_color, avatar_initials, profile_image, bio, linkedin_url, display_order) VALUES
(
  'bm',
  'Dr. Brijendra Kumar Mishra',
  'Convener, DCRF',
  'gold',
  'BM',
  '/councils/brijendra-kumar-mishra.jpg',
  'Specialist in Climate Change, Disaster Risk Management & Geospatial Technology. Former Consultant at NDMA, Senior Manager at MapmyIndia, and Researcher at DRDO & ICMR. Currently Associate Director — Climate & DRM at KPMG India. PhD with 15+ years spanning GIS, risk-vulnerability analysis and disaster resilience.',
  'https://in.linkedin.com/in/dr-brijendra-kumar-mishra',
  1
),
(
  'aj',
  'Mr. Ashish Jha',
  'Secretary General, DCRF',
  'default',
  'AJ',
  '/councils/ashish-jha.jpg',
  'Founder of TheCSRUniverse and Chief Advisor — Strategy & Growth. 19+ years in media, communications and social impact. Has built India''s leading CSR and sustainability media platform, and co-created flagship events CASCA and SICA. Formerly at Press Trust of India, Exchange4media and Careers360.',
  'https://www.linkedin.com/in/ashish-jha-2020',
  2
),
(
  'rr',
  'Mr. Rajiv Ranjan',
  'Deputy Secretary General, DCRF',
  'default',
  'RR',
  '/councils/rajiv-ranjan.jpg',
  'Senior member of the DiCAF Governing Council and Steering Committee representative for DiCAF in the DCRF collaboration. Brings expertise in disaster management, organisational governance and stakeholder coordination across government and civil society networks.',
  NULL,
  3
),
(
  'gk',
  'Mr. Govind Kumar',
  'Deputy Secretary General, DCRF',
  'default',
  'GK',
  '/councils/govind-kumar.jpg',
  'Deputy Secretary General of DCRF and primary operational point of contact for TCUIF in the federation. Drives day-to-day coordination of the DCRF Secretariat, member engagement and cross-partner communications. Deeply engaged in DCRF''s knowledge, events and outreach agenda.',
  'https://www.linkedin.com/in/govind1729/',
  4
),
(
  'dk',
  'Dr. Deepak Kumar Raj',
  'Asst. Secretary General, DCRF',
  'default',
  'DK',
  '/councils/deepak-kumar-raj.jpg',
  'Assistant Secretary General heading day-to-day operations of the DCRF Secretariat alongside Mr. Govind Kumar. Leads monitoring and evaluation of federation activities, working group coordination, and capacity-building programme management across the disaster and climate resilience ecosystem.',
  NULL,
  5
),
(
  'rk',
  'Ms. Ruchika Kumar',
  'Finance Controller & Treasurer',
  'finance',
  'RK',
  '/councils/ruchika-kumar.jpg',
  'Finance Controller and Treasurer of DCRF, and Steering Committee Member representing TCUIF. Oversees financial governance, revenue reconciliation and budgetary planning across all three pillars. Brings financial management expertise from the social impact and sustainability sector.',
  'https://www.linkedin.com/in/ruchika-kumar-tcu',
  6
);

-- Add organization data for members without LinkedIn
UPDATE councils SET organization = 'DiCAF • Steering Committee' WHERE id = 'rr';
UPDATE councils SET organization = 'DCRF Secretariat' WHERE id = 'dk';

-- Create index for faster queries
CREATE INDEX idx_councils_active ON councils(is_active);
CREATE INDEX idx_councils_order ON councils(display_order);

-- Query to fetch all active council members ordered by display_order
-- SELECT * FROM councils WHERE is_active = TRUE ORDER BY display_order ASC;
