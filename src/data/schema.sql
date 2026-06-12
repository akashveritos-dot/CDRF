-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS dcrs_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dcrs_db;

-- 1. Users Table (Auth credentials and roles)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'MEMBER', 'GUEST') NOT NULL DEFAULT 'GUEST',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Memberships Table (Registrations and payment details)
CREATE TABLE IF NOT EXISTS memberships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    organization VARCHAR(255) NOT NULL,
    title VARCHAR(255) DEFAULT NULL,
    tier ENUM('Basic', 'Prime', 'Premium', 'Gold') NOT NULL DEFAULT 'Basic',
    message TEXT DEFAULT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    pay_status ENUM('Unpaid', 'Paid', 'Waived') NOT NULL DEFAULT 'Unpaid',
    payment_details TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. News Table (Editorial and scraping-published updates)
CREATE TABLE IF NOT EXISTS news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tag VARCHAR(50) NOT NULL,
    source VARCHAR(100) NOT NULL,
    headline VARCHAR(255) NOT NULL,
    excerpt TEXT NOT NULL,
    full_content LONGTEXT DEFAULT NULL,
    published_date DATE NOT NULL,
    author VARCHAR(100) NOT NULL,
    external_link VARCHAR(512) DEFAULT NULL,
    thumbnail_emoji VARCHAR(10) DEFAULT NULL,
    image_url VARCHAR(512) DEFAULT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'environment',
    location VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Reports Table (Research PDFs and policy documents)
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    page_count INT NOT NULL DEFAULT 0,
    year INT NOT NULL,
    download_url VARCHAR(512) NOT NULL DEFAULT '#',
    accent_color VARCHAR(20) DEFAULT '#FDECEA',
    icon VARCHAR(10) DEFAULT '📙',
    image_url VARCHAR(512) DEFAULT NULL,
    source VARCHAR(255) DEFAULT 'DCRF',
    region VARCHAR(255) DEFAULT 'National',
    disaster_type VARCHAR(100) DEFAULT 'General',
    severity_level VARCHAR(50) DEFAULT 'Medium',
    affected_population VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Scraped Content Table (Incoming scraper queue)
CREATE TABLE IF NOT EXISTS scraped_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    headline VARCHAR(255) NOT NULL,
    excerpt TEXT NOT NULL,
    full_content LONGTEXT DEFAULT NULL,
    image_url VARCHAR(512) DEFAULT NULL,
    source VARCHAR(100) NOT NULL,
    url VARCHAR(512) NOT NULL UNIQUE,
    scrape_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_date DATE DEFAULT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'disasters',
    location VARCHAR(255) DEFAULT NULL,
    status ENUM('Pending', 'Published', 'Rejected') NOT NULL DEFAULT 'Pending',
    published_id INT DEFAULT NULL,
    published_type ENUM('News', 'Report') DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6. Ticker Alerts Table (Marquee notification text)
CREATE TABLE IF NOT EXISTS ticker_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text VARCHAR(512) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 7. Hero Stats Table
CREATE TABLE IF NOT EXISTS hero_stats (
    id VARCHAR(50) PRIMARY KEY,
    count DECIMAL(10,2) NOT NULL,
    suffix VARCHAR(20) DEFAULT '',
    label VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 8. City Temperatures Table
CREATE TABLE IF NOT EXISTS city_temps (
    city VARCHAR(50) PRIMARY KEY,
    temp INT NOT NULL,
    percentage INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 9. Disaster Events Table
CREATE TABLE IF NOT EXISTS disaster_events (
    label VARCHAR(50) PRIMARY KEY,
    count INT NOT NULL,
    percentage VARCHAR(20) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 10. Economic Losses Table
CREATE TABLE IF NOT EXISTS economic_losses (
    year VARCHAR(10) PRIMARY KEY,
    value DECIMAL(5,2) NOT NULL,
    display VARCHAR(50) NOT NULL,
    color VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 11. Loss Share Table
CREATE TABLE IF NOT EXISTS loss_share (
    name VARCHAR(50) PRIMARY KEY,
    value INT NOT NULL,
    color VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 12. State Hazards Table
CREATE TABLE IF NOT EXISTS state_hazards (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hazard_level ENUM('High', 'Medium', 'Low') NOT NULL,
    primary_disaster VARCHAR(255) NOT NULL,
    affected_count VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 13. Monsoon Heatmap Table
CREATE TABLE IF NOT EXISTS monsoon_heatmap (
    year VARCHAR(4) NOT NULL,
    month VARCHAR(3) NOT NULL,
    intensity INT NOT NULL,
    PRIMARY KEY (year, month)
) ENGINE=InnoDB;


-- ==========================================
-- SEED INITIAL DATA
-- ==========================================

-- 1. Default Admin Account (password: 123456)
-- Hash generated by scrypt with a unique, cryptographically random salt.
-- Hashed value matches Scrypt hash of "123456":
-- Salt: "7e7cd6112a3b62fa462c5feab2edb468"
INSERT INTO users (id, email, password_hash, name, role) 
VALUES (1, 'admin@dcrf.org', 'scrypt.1000.7e7cd6112a3b62fa462c5feab2edb468.f9b8e42bda7f712d6c17430ce12fc4c8cf34165e01883cddb40dde737dfcaa2f89a38c6561565b074a0ad4f7c448332f06b0c2a71a50658d3328e30e86849460', 'DCRF Administrator', 'ADMIN')
ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), email=VALUES(email), name=VALUES(name), role=VALUES(role);

-- 2. Ticker Alerts Seed
INSERT INTO ticker_alerts (id, text) VALUES
(1, 'Cyclone Alert: Bay of Bengal — Category 2 system tracking towards Odisha coast'),
(2, 'NDMA: 3.2 million affected by monsoon floods across Assam and Bihar'),
(3, 'India records 47°C in Rajasthan — DCRF heatwave advisory issued'),
(4, 'Uttarakhand landslide: 6 districts on high alert, 200+ roads blocked'),
(5, 'Delhi AQI crosses 350 — DCRF air quality panel to convene this week'),
(6, 'IMD issues red alert for heavy rainfall in Maharashtra and Gujarat coast'),
(7, 'DCRC ’26 registrations open — 26–27 November 2026, New Delhi')
ON DUPLICATE KEY UPDATE text=VALUES(text);

-- 3. Hero Stats Seed
INSERT INTO hero_stats (id, count, suffix, label, type) VALUES
('floods', 3214.00, 'K+', 'People affected by floods', 'red'),
('heat', 47.00, '°C', 'Peak heat recorded', 'amber'),
('cyclones', 18.00, '', 'Major cyclones (5 yrs)', 'teal'),
('warming', 2.10, '°C', 'India warming above baseline', 'blue')
ON DUPLICATE KEY UPDATE count=VALUES(count), suffix=VALUES(suffix), label=VALUES(label), type=VALUES(type);

-- 4. City Temps Seed
INSERT INTO city_temps (city, temp, percentage) VALUES
('Delhi', 42, 88),
('Mumbai', 36, 70),
('Chennai', 38, 78),
('Kolkata', 37, 74)
ON DUPLICATE KEY UPDATE temp=VALUES(temp), percentage=VALUES(percentage);

-- 5. Disaster Events Seed
INSERT INTO disaster_events (label, count, percentage, class_name) VALUES
('Floods', 267, '82%', 'bf-floods'),
('Heatwaves', 178, '55%', 'bf-heat'),
('Cyclones', 18, '28%', 'bf-cyclone'),
('Landslides', 124, '38%', 'bf-land'),
('Droughts', 96, '31%', 'bf-drought'),
('Earthquakes', 42, '18%', 'bf-quake')
ON DUPLICATE KEY UPDATE count=VALUES(count), percentage=VALUES(percentage), class_name=VALUES(class_name);

-- 6. Economic Losses Seed
INSERT INTO economic_losses (year, value, display, color) VALUES
('2019', 1.20, '₹1.2L Cr', 'linear-gradient(180deg,#5dade2,#2980b9)'),
('2020', 1.80, '₹1.8L Cr', 'linear-gradient(180deg,#a569bd,#6C3483)'),
('2021', 1.50, '₹1.5L Cr', 'linear-gradient(180deg,#5dade2,#2980b9)'),
('2022', 2.20, '₹2.2L Cr', 'linear-gradient(180deg,#e67e22,#D35400)'),
('2023', 2.60, '₹2.6L Cr', 'linear-gradient(180deg,#e74c3c,#C0392B)'),
('2024', 3.10, '₹3.1L Cr', 'linear-gradient(180deg,#922b21,#641e16)')
ON DUPLICATE KEY UPDATE value=VALUES(value), display=VALUES(display), color=VALUES(color);

-- 7. Loss Share Seed
INSERT INTO loss_share (name, value, color) VALUES
('Floods', 40, '#2980b9'),
('Heatwaves', 22, '#C0392B'),
('Droughts', 16, '#E67E22'),
('Cyclones', 10, '#6C3483'),
('Others', 12, '#94A3B8')
ON DUPLICATE KEY UPDATE value=VALUES(value), color=VALUES(color);

-- 8. News Seed
INSERT INTO news (id, tag, source, headline, excerpt, published_date, author, external_link, thumbnail_emoji, category, image_url) VALUES
(1, 'Breaking', 'disastersnews.com', '5.6 Magnitude Earthquake Strikes Bhutan — Tremors Felt Across Northeast India', 'A 5.6 magnitude earthquake struck Bhutan, with tremors felt across northeast Indian states including Assam, Sikkim and West Bengal. Local agencies have been placed on alert for aftershocks and potential landslides in vulnerable hill districts.', '2026-06-08', 'Editor Desk, disastersnews.com', 'https://disastersnews.com/13442-2/', '🌋', 'breaking', 'https://images.unsplash.com/photo-1594897030264-ab7d87efc473?auto=format&fit=crop&w=800&q=80'),
(2, 'Environment', 'disastersnews.com', 'Kolkata to Install Cloth Bag Vending Machines, Fine Single-Use Plastic Users', 'Kolkata Municipal Corporation announces a city-wide push to install cloth bag vending machines at key transit points while implementing fines for single-use plastic, as part of its climate action agenda.', '2026-06-07', 'disastersnews.com', 'https://disastersnews.com/13436-2/', '🌱', 'environment', 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80'),
(3, 'Health Crisis', 'disastersnews.com', 'Plastic Pollution Crisis Deepens as Microplastics Found in Human Brains, Blood and Placentas', 'Scientists confirm microplastics have been detected in human brain tissue, bloodstream and placentas, raising urgent alarms about the long-term health consequences of unchecked plastic pollution.', '2026-06-07', 'disastersnews.com', 'https://disastersnews.com/13432-2/', '🧠', 'health', 'https://images.unsplash.com/photo-1584036561566-baf241830940?auto=format&fit=crop&w=800&q=80'),
(4, 'Climate', 'disastersnews.com', 'Delhi Loses Nearly Half Its Green Cover as Heat Stress Spreads Across City: CSE Report', 'A new Centre for Science and Environment report finds Delhi has lost nearly 50% of its green cover over two decades, directly exacerbating urban heat island effects and increasing heatwave mortality risk.', '2026-06-03', 'disastersnews.com', 'https://disastersnews.com/delhi-loses-nearly-half-its-green-cover-as-heat-stress-spreads-across-city-cse-report/', '☀️', 'climate', 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?auto=format&fit=crop&w=800&q=80'),
(5, 'Disasters', 'disastersnews.com', 'Asia\'s $170 Billion Disaster Bill Sparks Urgent Call to Shift From Recovery to Resilient Infrastructure', 'A new Asian Development Bank report finds that Asia incurred $170 billion in disaster-related losses in the last reporting year, calling for a fundamental shift from post-event recovery spending to pre-event resilience infrastructure investment.', '2026-02-13', 'disastersnews.com', 'https://disastersnews.com/11236-2/', '🌏', 'disasters', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80'),
(6, 'Sustainability', 'thecsruniverse.com', 'CASCA ’26: Sustainability is No Longer a Choice — It is a Collective Responsibility', 'At the Climate Action & Sustainability Conference and Awards 2026 at India International Centre, Ashish Jha, Founder TheCSRUniverse, called for building credible ecosystems to recognise and scale impactful sustainability initiatives at a national level.', '2026-04-23', 'thecsruniverse.com', 'https://thecsruniverse.com', '☀️', 'sustainability', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80')
ON DUPLICATE KEY UPDATE headline=VALUES(headline), excerpt=VALUES(excerpt), published_date=VALUES(published_date), image_url=VALUES(image_url);

-- 9. Reports Seed
INSERT INTO reports (id, title, category, description, page_count, year, download_url, accent_color, icon, image_url) VALUES
(1, 'India Disaster Risk Index 2025 — Annual Report', 'Annual', 'Comprehensive ranking of India\'s 36 states and UTs by composite disaster risk, adaptive capacity and socio-economic vulnerability. Covers 12 hazard types with district-level data.', 148, 2025, '#', '#FDECEA', '📙', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'),
(2, 'Heat Action Protocols for Indian Cities — Policy Brief', 'Policy', 'Evidence-based guidance for municipal governments on deploying Heat Action Plans, cooling infrastructure and early warning triggers in cities above 1 million population.', 32, 2025, '#', '#E0F5F1', '🌡️', 'https://images.unsplash.com/photo-1473116763269-b552f58d6f67?auto=format&fit=crop&w=800&q=80'),
(3, 'Flood Resilience Finance: Mobilising CSR & ESG Capital', 'CSR', 'Analysis of CSR disclosure data and ESG fund flows into flood resilience, with a 10-point framework for corporates to channel investments into pre-disaster preparedness.', 56, 2025, '#', '#EBF5FB', '🌊', 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?auto=format&fit=crop&w=800&q=80'),
(4, 'Cyclone Preparedness Framework for East Coast Communities', 'Technical', 'Technical guidance integrating traditional knowledge with modern early warning systems for Odisha, Andhra Pradesh and West Bengal coastal districts.', 72, 2024, '#', '#FDF3E3', '🌀', 'https://images.unsplash.com/photo-1527482797697-8795b05a133d?auto=format&fit=crop&w=800&q=80'),
(5, 'Himalayan Glacier Retreat & Downstream Disaster Risk', 'Technical', 'Geospatial assessment of accelerating glacier retreat across the Hindu Kush–Himalaya region and implications for flash floods and water security through 2050.', 94, 2024, '#', '#F5EEF8', '🏔️', 'https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?auto=format&fit=crop&w=800&q=80'),
(6, 'Disaster-Tech in India: Geospatial & AI Applications Review', 'Technical', 'Survey of 80+ disaster-tech startups deploying satellite imagery, AI-based prediction, drone mapping and IoT sensors for disaster risk reduction across India.', 66, 2024, '#', '#EDF2F8', '📡', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80')
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), image_url=VALUES(image_url);

-- 10. State Hazards Seed
INSERT INTO state_hazards (id, name, hazard_level, primary_disaster, affected_count, description) VALUES
('an', 'Andaman and Nicobar Islands', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Andaman and Nicobar Islands: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('ap', 'Andhra Pradesh', 'Medium', 'Coastal Rain & Storms', 'Heavy monsoonal showers expected in coastal corridors.', 'Andhra Pradesh: Heavy monsoonal showers expected in coastal corridors.'),
('ar', 'Arunachal Pradesh', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Arunachal Pradesh: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('as', 'Assam', 'High', 'Monsoon River Floods', 'Heavy Brahmaputra discharge. 1.8M affected in valley.', 'Assam: Heavy Brahmaputra discharge. 1.8M affected in valley.'),
('br', 'Bihar', 'High', 'Ganges River Floods', 'Monsoon inundations in northern districts. Relief operations active.', 'Bihar: Monsoon inundations in northern districts. Relief operations active.'),
('ch', 'Chandigarh', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Chandigarh: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('ct', 'Chhattisgarh', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Chhattisgarh: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('dn', 'Dadra and Nagar Haveli', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Dadra and Nagar Haveli: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('dd', 'Daman and Diu', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Daman and Diu: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('dl', 'Delhi NCR', 'Medium', 'AQI & Heat Stress', 'Urban heat island effect and extreme particulate concentration.', 'Delhi NCR: Urban heat island effect and extreme particulate concentration.'),
('ga', 'Goa', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Goa: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('gj', 'Gujarat', 'Medium', 'Coastal Storm Surge', 'Severe monsoon surge along Saurashtra highway networks.', 'Gujarat: Severe monsoon surge along Saurashtra highway networks.'),
('hr', 'Haryana', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Haryana: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('hp', 'Himachal Pradesh', 'High', 'Landslides & Cloudbursts', 'Intense rainfall in Shimla and Manali corridors. Flash flood watch.', 'Himachal Pradesh: Intense rainfall in Shimla and Manali corridors. Flash flood watch.'),
('jk', 'Jammu and Kashmir', 'Medium', 'Avalanche Risk & Snow', 'High-altitude warnings active. Keep transit corridors closed.', 'Jammu and Kashmir: High-altitude warnings active. Keep transit corridors closed.'),
('jh', 'Jharkhand', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Jharkhand: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('ka', 'Karnataka', 'Medium', 'Droughts & Urban Heat', 'Declining water table in eastern districts. Water allocation active.', 'Karnataka: Declining water table in eastern districts. Water allocation active.'),
('kl', 'Kerala', 'High', 'Hill Landslides & Flooding', 'Extreme cloudburst warnings in Wayanad and Idukki districts.', 'Kerala: Extreme cloudburst warnings in Wayanad and Idukki districts.'),
('ld', 'Lakshadweep', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Lakshadweep: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('mp', 'Madhya Pradesh', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Madhya Pradesh: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('mh', 'Maharashtra', 'Medium', 'Urban Flooding', 'Mumbai storm water drains at peak capacity. Coastal high tide watch.', 'Maharashtra: Mumbai storm water drains at peak capacity. Coastal high tide watch.'),
('mn', 'Manipur', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Manipur: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('ml', 'Meghalaya', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Meghalaya: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('mz', 'Mizoram', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Mizoram: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('nl', 'Nagaland', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Nagaland: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('or', 'Odisha', 'High', 'Cyclonic Storm Surge', 'Depression in Bay of Bengal tracking to Ganjam and Puri coasts.', 'Odisha: Depression in Bay of Bengal tracking to Ganjam and Puri coasts.'),
('py', 'Puducherry', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Puducherry: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('pb', 'Punjab', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Punjab: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('rj', 'Rajasthan', 'High', 'Desert Heatwaves', 'Temperatures cross 48.5°C in Churu. Severe heat warning.', 'Rajasthan: Temperatures cross 48.5°C in Churu. Severe heat warning.'),
('sk', 'Sikkim', 'Medium', 'Glacial Lake Outbursts', 'Geospatial alerts active on South Lhonak glacier lake levels.', 'Sikkim: Geospatial alerts active on South Lhonak glacier lake levels.'),
('tn', 'Tamil Nadu', 'Medium', 'Coastal Inundation', 'Chennai storm surges expected. Warning flags at beaches.', 'Tamil Nadu: Chennai storm surges expected. Warning flags at beaches.'),
('tg', 'Telangana', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Telangana: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('tr', 'Tripura', 'Low', 'Baseline Climate Study', 'Long-term monitoring active', 'Tripura: Relatively stable climate baseline. Monitoring dry weather trends and soil moisture levels.'),
('up', 'Uttar Pradesh', 'Medium', 'Heat stress & Dust Storms', 'Dry winds across Indo-Gangetic plains. Low visibility advisory.', 'Uttar Pradesh: Dry winds across Indo-Gangetic plains. Low visibility advisory.'),
('ut', 'Uttarakhand', 'High', 'Cloudbursts & Mudslides', 'Heavy rains block major highway arteries. Kedarnath corridor alert.', 'Uttarakhand: Heavy rains block major highway arteries. Kedarnath corridor alert.'),
('wb', 'West Bengal', 'Medium', 'Sunderbans Inundation', 'High tide breach of embankments. Salinity alerts issued.', 'West Bengal: High tide breach of embankments. Salinity alerts issued.')
ON DUPLICATE KEY UPDATE hazard_level=VALUES(hazard_level), primary_disaster=VALUES(primary_disaster), affected_count=VALUES(affected_count), description=VALUES(description);

-- 11. Monsoon Heatmap Seed
INSERT INTO monsoon_heatmap (year, month, intensity) VALUES
('2019', 'Jan', 1), ('2019', 'Feb', 1), ('2019', 'Mar', 1), ('2019', 'Apr', 1), ('2019', 'May', 2), ('2019', 'Jun', 8), ('2019', 'Jul', 10), ('2019', 'Aug', 9), ('2019', 'Sep', 7), ('2019', 'Oct', 3), ('2019', 'Nov', 1), ('2019', 'Dec', 1),
('2020', 'Jan', 1), ('2020', 'Feb', 1), ('2020', 'Mar', 1), ('2020', 'Apr', 2), ('2020', 'May', 3), ('2020', 'Jun', 9), ('2020', 'Jul', 10), ('2020', 'Aug', 10), ('2020', 'Sep', 8), ('2020', 'Oct', 4), ('2020', 'Nov', 1), ('2020', 'Dec', 1),
('2021', 'Jan', 1), ('2021', 'Feb', 1), ('2021', 'Mar', 1), ('2021', 'Apr', 1), ('2021', 'May', 2), ('2021', 'Jun', 7), ('2021', 'Jul', 10), ('2021', 'Aug', 10), ('2021', 'Sep', 8), ('2021', 'Oct', 3), ('2021', 'Nov', 1), ('2021', 'Dec', 1),
('2022', 'Jan', 1), ('2022', 'Feb', 1), ('2022', 'Mar', 1), ('2022', 'Apr', 2), ('2022', 'May', 4), ('2022', 'Jun', 8), ('2022', 'Jul', 10), ('2022', 'Aug', 9), ('2022', 'Sep', 7), ('2022', 'Oct', 4), ('2022', 'Nov', 2), ('2022', 'Dec', 1),
('2023', 'Jan', 1), ('2023', 'Feb', 1), ('2023', 'Mar', 1), ('2023', 'Apr', 1), ('2023', 'May', 3), ('2023', 'Jun', 9), ('2023', 'Jul', 10), ('2023', 'Aug', 10), ('2023', 'Sep', 9), ('2023', 'Oct', 3), ('2023', 'Nov', 1), ('2023', 'Dec', 1),
('2024', 'Jan', 1), ('2024', 'Feb', 1), ('2024', 'Mar', 1), ('2024', 'Apr', 2), ('2024', 'May', 3), ('2024', 'Jun', 8), ('2024', 'Jul', 10), ('2024', 'Aug', 10), ('2024', 'Sep', 8), ('2024', 'Oct', 4), ('2024', 'Nov', 2), ('2024', 'Dec', 1)
ON DUPLICATE KEY UPDATE intensity=VALUES(intensity);


-- ==========================================
-- PERFORMANCE TUNING INDEXES
-- ==========================================
CREATE INDEX idx_news_category_date ON news (category, published_date);
CREATE INDEX idx_news_published_date ON news (published_date);
CREATE INDEX idx_reports_category_year ON reports (category, year);
CREATE INDEX idx_reports_year ON reports (year);
CREATE INDEX idx_scraped_status_date ON scraped_content (status, scrape_date);


