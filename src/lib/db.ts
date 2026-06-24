import mysql from 'mysql2/promise';

interface GlobalDb {
  pool: mysql.Pool | undefined;
}

const globalForDb = globalThis as unknown as GlobalDb;

export function getDbPool(): mysql.Pool {
  if (!globalForDb.pool) {
    const host = process.env.DB_HOST || process.env.MYSQL_ADDON_HOST || 'localhost';
    const user = process.env.DB_USER || process.env.MYSQL_ADDON_USER || 'root';
    const password = process.env.DB_PASSWORD || process.env.MYSQL_ADDON_PASSWORD || '';
    const database = process.env.DB_NAME || process.env.MYSQL_ADDON_DB || 'dcrs_db';
    const port = parseInt(process.env.DB_PORT || process.env.MYSQL_ADDON_PORT || '3306', 10);
    const connectionLimit = parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10);
    console.log('[DEBUG DB] Initializing connection pool with config:', { host, port, user, database, connectionLimit });

    globalForDb.pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit,
      queueLimit: 0,
      ssl: process.env.DB_SSL === 'true' ? {} : undefined
    });

    // Run migrations in the background
    runMigration(globalForDb.pool);
  }
  return globalForDb.pool;
}

async function runMigration(pool: mysql.Pool) {
  try {
    const alterQueries = [
      'ALTER TABLE news ADD COLUMN display_order INT DEFAULT 0',
      'ALTER TABLE reports ADD COLUMN display_order INT DEFAULT 0',
      'ALTER TABLE cms_pages ADD COLUMN display_order INT DEFAULT 0',
      'ALTER TABLE news ADD COLUMN gallery_images TEXT NULL',
      'ALTER TABLE membership_discounts MODIFY COLUMN start_date DATETIME NOT NULL',
      'ALTER TABLE membership_discounts MODIFY COLUMN end_date DATETIME NOT NULL',
      // Membership plan duration
      'ALTER TABLE membership_plans ADD COLUMN duration_months INT DEFAULT 12',
      // Membership lifecycle columns
      "ALTER TABLE memberships ADD COLUMN membership_status ENUM('Active','Expired','Cancelled','Renewed') DEFAULT 'Active'",
      'ALTER TABLE memberships ADD COLUMN starts_at DATETIME NULL',
      'ALTER TABLE memberships ADD COLUMN expires_at DATETIME NULL',
      'ALTER TABLE memberships ADD COLUMN parent_id INT NULL',
      'ALTER TABLE memberships ADD COLUMN is_current TINYINT DEFAULT 1',
      // Page builder enhancements
      'ALTER TABLE cms_pages ADD COLUMN main_image_url VARCHAR(512) NULL',
      // Flexible extra data for cards
      'ALTER TABLE cms_page_cards ADD COLUMN extra_data TEXT NULL'
    ];
    for (const sql of alterQueries) {
      try {
        await pool.execute(sql);
        console.log(`[DB MIGRATION] Executed query: ${sql}`);
      } catch (err: any) {
        if (!err.message?.includes('Duplicate column name') && err.code !== 'ER_DUP_FIELDNAME' && !err.message?.includes('Table') && !err.message?.includes('doesn\'t exist')) {
          console.warn(`[DB MIGRATION WARN] Alter failed: ${sql}`, err.message || err);
        }
      }
    }

    // Create page sections table for section-based page builder
    const createSectionsTable = `
      CREATE TABLE IF NOT EXISTS cms_page_sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_slug VARCHAR(255) NOT NULL,
        display_order INT DEFAULT 0,
        title VARCHAR(512) NULL,
        description TEXT NULL,
        image_url VARCHAR(512) NULL,
        video_url VARCHAR(512) NULL,
        content TEXT NULL,
        button_text VARCHAR(255) NULL,
        button_url VARCHAR(512) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_section_page (page_slug)
      ) ENGINE=InnoDB;
    `;
    await pool.execute(createSectionsTable);

    // Create page cards table for card management within sections
    const createCardsTable = `
      CREATE TABLE IF NOT EXISTS cms_page_cards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        section_id INT NOT NULL,
        display_order INT DEFAULT 0,
        title VARCHAR(512) NULL,
        description TEXT NULL,
        image_url VARCHAR(512) NULL,
        link_text VARCHAR(255) NULL,
        link_url VARCHAR(512) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_card_section (section_id)
      ) ENGINE=InnoDB;
    `;
    await pool.execute(createCardsTable);
    console.log('[DB MIGRATION] Ensured cms_page_sections and cms_page_cards tables exist.');

    // ── Seed all hardcoded page data into sections + cards ──
    await seedPageData(pool);
    await upgradePodcastData(pool);

    // Create pricing and discount tables if they don't exist
    const createPricingTable = `
      CREATE TABLE IF NOT EXISTS membership_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        price INT NOT NULL DEFAULT 0,
        price_sub_text VARCHAR(255) DEFAULT NULL,
        is_popular INT DEFAULT 0,
        features_json TEXT DEFAULT NULL
      ) ENGINE=InnoDB;
    `;
    const createDiscountTable = `
      CREATE TABLE IF NOT EXISTS membership_discounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tier_name VARCHAR(50) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        percentage INT NOT NULL DEFAULT 0,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `;
    await pool.execute(createPricingTable);
    await pool.execute(createDiscountTable);

    // Create membership history table
    const createHistoryTable = `
      CREATE TABLE IF NOT EXISTS membership_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        membership_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        tier VARCHAR(50),
        action ENUM('Created','Upgraded','Renewed','Cancelled','Expired') NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `;
    await pool.execute(createHistoryTable);

    // Ensure email index for fast lookups
    try {
      await pool.execute('CREATE INDEX idx_memberships_email ON memberships(email)');
    } catch (err: any) {
      if (!err.message?.includes('Duplicate key name')) {
        // Index may already exist, ignore
      }
    }

    // Create report downloads tracking table
    const createReportDownloadsTable = `
      CREATE TABLE IF NOT EXISTS report_downloads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_report_downloads_report (report_id),
        INDEX idx_report_downloads_email (email)
      ) ENGINE=InnoDB;
    `;
    await pool.execute(createReportDownloadsTable);

    console.log('[DB MIGRATION] Ensured membership plans, discounts, history, and report_downloads tables exist.');

    // Seed default plans if empty
    const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM membership_plans');
    if (rows[0] && (rows[0].count === 0)) {
      const seedPlans = [
        ['Basic', 0, 'Individual & Student Access', 0, '{"News & analytical information sharing":true,"Capacity building programmes":true,"Stakeholder engagements":false,"Event participation (DCRC)":false,"National Delegation participation":false,"International Delegation participation":false,"Advisory Committee membership":false}', 0],
        ['Prime', 20000, 'Per Annum — NGO & Academia', 0, '{"News & analytical information sharing":true,"Capacity building programmes":true,"Stakeholder engagements":false,"Event participation (DCRC)":true,"National Delegation participation":false,"International Delegation participation":false,"Advisory Committee membership":false}', 12],
        ['Premium', 50000, 'Per Annum — SME & Consultancies', 0, '{"News & analytical information sharing":true,"Capacity building programmes":true,"Stakeholder engagements":true,"Event participation (DCRC)":true,"National Delegation participation":true,"International Delegation participation":true,"Advisory Committee membership":false}', 12],
        ['Gold', 100000, 'Per Annum — Corporates & Leaders', 1, '{"News & analytical information sharing":true,"Capacity building programmes":true,"Stakeholder engagements":true,"Event participation (DCRC)":true,"National Delegation participation":true,"International Delegation participation":true,"Advisory Committee membership":true}', 12]
      ];
      for (const plan of seedPlans) {
        await pool.execute(
          'INSERT INTO membership_plans (name, price, price_sub_text, is_popular, features_json, duration_months) VALUES (?, ?, ?, ?, ?, ?)',
          plan
        );
      }
      console.log('[DB MIGRATION] Seeded membership plans successfully.');
    }
  } catch (error) {
    console.error('[DB MIGRATION ERROR] Migration runner failed:', error);
  }
}

// ═══════════════════════════════════════════════════════════════
// Seed all hardcoded frontend data into cms_page_sections + cards
// Only runs if no sections exist for a given page_slug
// ═══════════════════════════════════════════════════════════════
async function seedPageData(pool: mysql.Pool) {
  const sectionHelper = async (pageSlug: string, sections: any[], pageTitle?: string) => {
    // Ensure cms_pages record exists so it appears in admin sidebar
    const titleFromSlug = pageTitle || pageSlug.split('-').map(w =>
      w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
    const category = ['contact', 'membership', 'gallery', 'news'].includes(pageSlug) ? 'general' : 'about';
    await pool.execute(
      `INSERT IGNORE INTO cms_pages (slug, title, category) VALUES (?, ?, ?)`,
      [pageSlug, titleFromSlug, category]
    );

    // Check if any sections already exist for this page
    const [existing]: any = await pool.execute(
      'SELECT COUNT(*) as count FROM cms_page_sections WHERE page_slug = ?', [pageSlug]
    );
    if (existing[0]?.count > 0) return;

    for (let si = 0; si < sections.length; si++) {
      const s = sections[si];
      const [result]: any = await pool.execute(
        `INSERT INTO cms_page_sections (page_slug, display_order, title, description, image_url, video_url, content, button_text, button_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [pageSlug, si, s.title || '', s.description || '', s.imageUrl || '', s.videoUrl || '', s.content || '', s.buttonText || '', s.buttonUrl || '']
      );
      const sectionId = result.insertId;
      if (s.cards) {
        for (let ci = 0; ci < s.cards.length; ci++) {
          const c = s.cards[ci];
          await pool.execute(
            `INSERT INTO cms_page_cards (section_id, display_order, title, description, image_url, link_text, link_url, extra_data)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [sectionId, ci, c.title || '', c.description || '', c.imageUrl || '', c.linkText || '', c.linkUrl || '', c.extraData ? JSON.stringify(c.extraData) : '{}']
          );
        }
      }
    }
    console.log(`[DB SEED] Seeded ${sections.length} sections for page: ${pageSlug}`);
  };

  try {
    // ── EVENT VIDEOS page ─────────────────────────────────
    await sectionHelper('event-videos', [
      {
        title: 'Expert Panel', description: 'Featured speakers and subject matter experts',
        cards: [
          { title: 'Dr. Kavita Sharma', description: 'Prof. of Urban Planning', extraData: { org: 'IIT Delhi', initials: 'KS', color: '#b91c1c' } },
          { title: 'Capt. Ramesh Patel', description: 'Director, Cyclone Ops', extraData: { org: 'IMD', initials: 'RP', color: '#0f766e' } },
          { title: 'Priya Menon', description: 'Head of Sustainability', extraData: { org: 'CII', initials: 'PM', color: '#7c3aed' } },
          { title: 'Arjun Malhotra', description: 'Senior Researcher', extraData: { org: 'TERI', initials: 'AM', color: '#b45309' } },
        ]
      },
      {
        title: 'Next Sessions', description: 'Upcoming webinar schedule',
        cards: [
          { title: 'Urban Flooding: Stormwater Resilience Frameworks', description: 'Dr. Kavita Sharma, IIT Delhi', extraData: { month: 'JUL', day: '18', duration: '60 min', topic: 'Flood Risk' } },
          { title: 'Cyclone Preparedness & Early Warning Integration', description: 'Capt. Ramesh Patel, IMD', extraData: { month: 'AUG', day: '22', duration: '45 min', topic: 'Cyclone' } },
          { title: 'CSR for Climate Resilient Infrastructure', description: 'Priya Menon, CII Sustainability', extraData: { month: 'SEP', day: '12', duration: '75 min', topic: 'CSR & ESG' } },
        ]
      },
      {
        title: 'Past Sessions', description: 'Archived webinar recordings',
        cards: [
          { title: 'Designing Cool Roof Initiatives for Urban Heat Mitigation', description: 'A technical panel featuring metropolitan planners and civil advisors detailing parameter protocols for slums and high-density sectors.', imageUrl: 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?auto=format&fit=crop&w=800&q=80', extraData: { category: 'Webinar Panel', categoryColor: '#b91c1c', embedUrl: 'https://www.youtube.com/embed/U7Jsk748t3w', duration: '42:18', date: 'Apr 14, 2026', topic: 'Heat Action' } },
          { title: 'Himalayan Glacial Sensors & Flood Telemetry Calibrations', description: 'Hydrological working groups demonstrating sensor deployment protocols and satellite warning triggers in flash-flood zones.', imageUrl: 'https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?auto=format&fit=crop&w=800&q=80', extraData: { category: 'Technical Workshop', categoryColor: '#0f766e', embedUrl: 'https://www.youtube.com/embed/yVwA1Kk76yI', duration: '58:44', date: 'Mar 28, 2026', topic: 'Flood Risk' } },
          { title: 'DCRC Summit: Steering ESG Inflows into Pre-Event Resiliency', description: 'Corporate sustainability officers and advisors discussing parameter-based CSR initiatives replacing post-event charity checks.', imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80', extraData: { category: 'Summit Keynote', categoryColor: '#7c3aed', embedUrl: 'https://www.youtube.com/embed/Q8wzIcrqNnE', duration: '31:52', date: 'Feb 10, 2026', topic: 'CSR & ESG' } },
        ]
      }
    ]);

    // ── PODCASTS page ─────────────────────────────────────
    await sectionHelper('podcasts', [
      {
        title: 'Episodes', description: 'DCRF Podcast Series — Intelligence from the Field',
        cards: [
          { title: 'Himalayan Glacial Sensors & Flood Telemetry Calibrations', description: 'A visual guide and discussion on sensor deployment protocols and satellite warning triggers in flash-flood zones.', imageUrl: 'https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?auto=format&fit=crop&w=400&q=80', extraData: { episodeNumber: 15, tag: 'Early Warning', date: 'Jun 10, 2026', duration: '0:10', speaker: 'Dr. Kavita Sharma', speakerTitle: 'IIT Delhi', audioUrl: '', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', imageUrl: 'https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?auto=format&fit=crop&w=400&q=80' } },
          { title: "Can India's CSR Ecosystem Fund Climate Adaptation at Scale?", description: 'Dr. Brijender Mishra speaks with climate finance experts on redirecting corporate giving from post-disaster relief to long-term resilience infrastructure.', imageUrl: 'https://images.unsplash.com/photo-1554475901-4538ddfb1a55?auto=format&fit=crop&w=400&q=80', extraData: { episodeNumber: 14, tag: 'Climate Finance', date: 'Jun 3, 2026', duration: '42 min', speaker: 'Dr. Brijender Mishra', speakerTitle: 'Associate Director, KPMG India', isFeatured: true, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', videoUrl: '', imageUrl: 'https://images.unsplash.com/photo-1554475901-4538ddfb1a55?auto=format&fit=crop&w=400&q=80' } },
          { title: 'Urban Heat Islands: How Indian Cities Are Baking Themselves', description: '', imageUrl: 'https://images.unsplash.com/photo-1525490822463-b459eb6c2948?auto=format&fit=crop&w=400&q=80', extraData: { episodeNumber: 13, tag: 'Heatwaves', date: 'May 20, 2026', duration: '38 min', speaker: 'Prof. Anuradha Sharma', speakerTitle: 'IIT Delhi', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', videoUrl: '', imageUrl: 'https://images.unsplash.com/photo-1525490822463-b459eb6c2948?auto=format&fit=crop&w=400&q=80' } },
          { title: 'The Brahmaputra Crisis: Floods, Erosion and Climate Migration', description: '', imageUrl: 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?auto=format&fit=crop&w=400&q=80', extraData: { episodeNumber: 12, tag: 'Floods', date: 'May 6, 2026', duration: '51 min', speaker: 'Dr. Arup Sarma', speakerTitle: 'IIT Guwahati', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', videoUrl: '', imageUrl: 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?auto=format&fit=crop&w=400&q=80' } },
          { title: 'AI & Satellite Technology in Disaster Early Warning Systems', description: '', imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80', extraData: { episodeNumber: 11, tag: 'Early Warning', date: 'Apr 22, 2026', duration: '44 min', speaker: 'Ms. Priya Menon', speakerTitle: 'ISRO', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', videoUrl: '', imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80' } },
          { title: "Sendai Framework at 10: India's Progress & Gaps", description: '', imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=400&q=80', extraData: { episodeNumber: 10, tag: 'Policy', date: 'Apr 8, 2026', duration: '56 min', speaker: 'Former Secretary', speakerTitle: 'NDMA', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', videoUrl: '', imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=400&q=80' } },
          { title: 'Glacial Lake Outburst Floods: The Himalayan Time Bomb', description: '', imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80', extraData: { episodeNumber: 9, tag: 'Glaciers', date: 'Mar 25, 2026', duration: '47 min', speaker: 'Dr. Syed Iqbal Hasnain', speakerTitle: 'Climate Scientist', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', videoUrl: '', imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80' } },
        ]
      },
      {
        title: 'Video Interviews', description: 'Resilience Leader Interviews — Behind-the-scenes conversations',
        cards: [
          { title: 'Mobilising Institutional CSR for Disaster Tech', description: 'Interview Series', extraData: { duration: '18:24', date: 'May 12, 2026', guest: 'Mr. Ashish Jha', guestTitle: 'Secretary General, DCRF', embedUrl: 'https://www.youtube.com/embed/Q8wzIcrqNnE', gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0e7a6b 100%)' } },
          { title: 'DCRC 2026: Convergence & Policy Objectives', description: 'Conclave Preview', extraData: { duration: '24:15', date: 'Apr 28, 2026', guest: 'Dr. Brijender Mishra', guestTitle: 'Convener, DCRF', embedUrl: 'https://www.youtube.com/embed/U7Jsk748t3w', gradient: 'linear-gradient(135deg, #0f172a 0%, #2d1b4e 50%, #991b1b 100%)' } },
        ]
      }
    ]);

    // ── MISSION & VISION page ─────────────────────────────
    await sectionHelper('mission-vision', [
      {
        title: 'Key Statistics', description: 'Impact numbers at a glance',
        cards: [
          { title: 'Annual Climate Cost', description: 'Crore loss to India annually', extraData: { value: 3, suffix: 'L+', prefix: '₹', color: '#b91c1c' } },
          { title: 'Delegates Engaged', description: 'From 12+ sectors nationwide', extraData: { value: 500, suffix: '+', color: '#7c3aed' } },
          { title: 'Working Groups', description: 'Technical national committees', extraData: { value: 4, color: '#0f766e' } },
          { title: 'States Covered', description: 'DCRF active advisory network', extraData: { value: 26, color: '#b45309' } },
        ]
      },
      {
        title: 'Our Mission', description: '',
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
        cards: [
          { title: 'Our Mission', description: "DCRF's mission is to build a structured, multi-stakeholder ecosystem for disaster preparedness and climate resilience in India — one that shifts institutional energy and financial resources from post-disaster relief toward pre-event mitigation, localised early warning, and community-level capacity building." },
          { title: 'How We Work', description: 'We achieve this by convening corporates, CSR funders, government disaster cells, scientific institutions, NGOs, and municipal bodies under a shared platform — enabling data-driven decision-making, coordinated action, and sustained investment in resilience infrastructure across India\'s most disaster-vulnerable corridors.' },
        ]
      },
      {
        title: 'Our Vision', description: '',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        cards: [
          { title: 'Our Vision', description: 'A disaster-resilient India where no community faces a crisis unprepared — and where investments in resilience are treated as essential infrastructure, not optional philanthropy.' },
          { title: 'Leading the Way', description: 'DCRF envisions becoming the leading federal body that bridges policy and practice on disaster risk reduction, acting as the convergence point between corporate India\'s CSR obligations, scientific research capabilities, and government\'s disaster management architecture.' },
        ]
      }
    ]);

    // ── CHARTER 10-POINT AGENDA page ──────────────────────
    await sectionHelper('charter-10-point-agenda', [
      {
        title: 'Charter Agenda Items', description: '10-Point Institutional Charter',
        cards: [
          { title: 'Institutional Convergence Framework', description: 'Establish a unified governance model bridging corporate CSR, scientific bodies and government agencies for disaster risk reduction.', extraData: { number: 1 } },
          { title: 'Early Warning Infrastructure Deployment', description: 'Mobilize industry partners to co-fund community-level early warning sensor arrays in 100 high-risk districts.', extraData: { number: 2 } },
          { title: 'Climate Finance & ESG Redirection', description: 'Create mechanisms to redirect ESG capital from post-disaster relief toward preventive localized resilience measures.', extraData: { number: 3 } },
          { title: 'Heat Action Plan Standardization', description: 'Develop a national-level Heat Action Protocol adaptable for cities exceeding 1 million population.', extraData: { number: 4 } },
          { title: 'GLOF & Himalayan Monitoring', description: 'Partner with ISRO and IITs to establish satellite-linked Glacial Lake Outburst Flood monitoring networks.', extraData: { number: 5 } },
          { title: 'Annual Disaster & Climate Index', description: 'Publish a yearly evidence-based index ranking districts by multi-hazard exposure, preparedness, and CSR investment ratios.', extraData: { number: 6 } },
          { title: 'Coastal & Delta Resilience', description: 'Coordinate with coastal state governments to document traditional shelter architectures and integrate modern early warning systems.', extraData: { number: 7 } },
          { title: 'Academic Research Integration', description: 'Create formal research pipelines between TERI, CEEW, WRI, and IIT systems for applied disaster science peer-reviewed outputs.', extraData: { number: 8 } },
          { title: 'NGO-Corporate Matchmaking', description: 'Launch a structured platform matching corporate CSR leads with local NGOs and community bodies for co-deployed resilience projects.', extraData: { number: 9 } },
          { title: 'DCRC Annual Conclave', description: 'Convene an annual multi-stakeholder summit for policy launches, disaster-tech startups, and DCRF Recognition Awards.', extraData: { number: 10 } },
        ]
      }
    ]);

    // ── WORKING GROUP page ────────────────────────────────
    await sectionHelper('working-group', [
      {
        title: 'Early Warning Systems', description: '', extraData: { accent: '#b91c1c' },
        cards: [
          { title: 'IoT Sensor Networks', description: 'Deploy ground-level sensors in 100 high-risk districts for flood/cyclone alerts', extraData: { tag: 'Active', tagColor: '#b91c1c' } },
          { title: 'Community Alert SMS', description: 'Last-mile warning dissemination to rural populations in local languages', extraData: { tag: 'Pilot', tagColor: '#b91c1c' } },
        ]
      },
      {
        title: 'Climate Finance & ESG', description: '', extraData: { accent: '#7c3aed' },
        cards: [
          { title: 'CSR Audit Framework', description: 'Standardized metrics for evaluating disaster-focused CSR spend effectiveness', extraData: { tag: 'Draft', tagColor: '#7c3aed' } },
          { title: 'ESG Score Integration', description: 'Incorporate disaster resilience parameters into existing ESG rating methodologies', extraData: { tag: 'Research', tagColor: '#7c3aed' } },
        ]
      },
      {
        title: 'Heat Mitigation', description: '', extraData: { accent: '#b45309' },
        cards: [
          { title: 'Cool Roof Protocol', description: 'National standard for reflective roofing in slum clusters and dense urban zones', extraData: { tag: 'Active', tagColor: '#b45309' } },
          { title: 'City Heat Action Plans', description: 'Municipality-level heat action protocols with corporate implementation partners', extraData: { tag: 'Planning', tagColor: '#b45309' } },
        ]
      },
      {
        title: 'Community Engagement', description: '', extraData: { accent: '#0f766e' },
        cards: [
          { title: 'Volunteer Network', description: 'Train and equip 10,000 community-level disaster first-responders nationwide', extraData: { tag: 'Active', tagColor: '#0f766e' } },
          { title: 'Local Knowledge Docs', description: 'Document indigenous disaster resilience practices from coastal and hill communities', extraData: { tag: 'Ongoing', tagColor: '#0f766e' } },
        ]
      }
    ]);

    // ── DCRC-26 EVENT page ────────────────────────────────
    await sectionHelper('dcrc-26', [
      {
        title: 'Event Features', description: 'DCRC 2026 Conclave Summit highlights',
        cards: [
          { title: 'Conference & Plenary', description: 'Full-day plenary sessions, curated panel discussions and masterclasses with India\'s leading voices on disasters and climate.', extraData: { icon: '🏛️' } },
          { title: 'Recognition Awards', description: 'Awards for Best Corporate Disaster Response, Best NGO Initiative, Climate Resilient Community, Disaster-Tech Innovator and Lifetime Achievement.', extraData: { icon: '🏆' } },
          { title: 'Disaster-Tech Exhibition', description: 'Showcase of disaster-tech, geospatial tools, resilient infrastructure innovations and climate finance instruments.', extraData: { icon: '🔬' } },
          { title: 'Annual Report Launch', description: 'Release of the inaugural Annual Report on Disaster and Climate Action in India — DCRF\'s flagship research publication.', extraData: { icon: '📊' } },
          { title: 'Hybrid Format', description: 'In-person and virtual participation enabling national-level attendance beyond the venue city.', extraData: { icon: '🌐' } },
          { title: 'Networking Zones', description: 'Curated interactions between corporates, NGOs, government bodies and funders to catalyse CSR investments.', extraData: { icon: '🤝' } },
        ]
      },
      {
        title: 'Partners', description: 'Founding partner organizations',
        cards: [
          { title: 'TCU Impact Foundation (TCUIF)', description: 'A research and social impact advisory platform covering Sustainability, CSR, ESG and SDGs. Operates flagship platforms CASCA and SICA. Registered under Section 8, Companies Act 2013. CIN: U85500UP2024NPL198637.', extraData: { borderColor: 'var(--navy-primary)' } },
          { title: 'DiCAF — Disaster & Climate Action Federation', description: 'A recognised Think Tank in Disaster Resilience and Climate Action, with expertise in Risk Assessment, Climate Finance, Geospatial Technology, R&D and Standards. Owner of disastersnews.com. CIN: U88900DL2024NPL425948.', extraData: { borderColor: 'var(--gold-primary)' } },
        ]
      }
    ]);

    // ── CONTACT PAGE ──────────────────────────────────
    await sectionHelper('contact', [
      {
        title: 'Office Address', description: 'DCRF Headquarters',
        cards: [
          { title: 'DCRF Secretariat Office', description: 'Core 4B, 2nd Floor, India Habitat Centre (IHC), Lodhi Road, New Delhi — 110003', extraData: { type: 'address', lat: '28.5935', lon: '77.2222', alt: '216m' } },
        ]
      },
      {
        title: 'Contact Info', description: 'Electronic Communications & Hotline',
        cards: [
          { title: 'General Queries', description: 'info@dcrf.org', extraData: { type: 'email' } },
          { title: 'Secretariat', description: 'secretariat@dcrf.org', extraData: { type: 'email' } },
          { title: 'Phone', description: '+91 11 4355 6700', extraData: { type: 'phone' } },
          { title: 'Operations', description: '+91 11 4355 6709', extraData: { type: 'phone' } },
        ]
      }
    ]);

    console.log('[DB SEED] Page data seeding complete.');

    // ── UPGRADE: Add missing content sections for pages that only have stats ──
    await addMissingSections(pool);

  } catch (error) {
    console.error('[DB SEED ERROR] Failed to seed page data:', error);
  }
}

/** Add content sections to mission-vision if only Key Statistics exists */
async function addMissingSections(pool: mysql.Pool) {
  try {
    // Check if mission-vision has content sections beyond Key Statistics
    const [rows]: any = await pool.execute(
      `SELECT COUNT(*) as count FROM cms_page_sections WHERE page_slug = 'mission-vision' AND title != 'Key Statistics'`
    );
    if (rows[0]?.count > 0) return; // Already has content sections

    // Check if it has Key Statistics (i.e. page exists but needs content)
    const [statsRows]: any = await pool.execute(
      `SELECT COUNT(*) as count FROM cms_page_sections WHERE page_slug = 'mission-vision'`
    );
    if (statsRows[0]?.count === 0) return; // No data at all, sectionHelper will handle it

    // Get next display order
    const [maxOrder]: any = await pool.execute(
      `SELECT MAX(display_order) as maxOrd FROM cms_page_sections WHERE page_slug = 'mission-vision'`
    );
    let nextOrder = (maxOrder[0]?.maxOrd || 0) + 1;

    // Add Our Mission section
    const [r1]: any = await pool.execute(
      `INSERT INTO cms_page_sections (page_slug, display_order, title, description, image_url) VALUES (?, ?, ?, ?, ?)`,
      ['mission-vision', nextOrder++, 'Our Mission', '', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80']
    );
    const missionId = r1.insertId;
    await pool.execute(
      `INSERT INTO cms_page_cards (section_id, display_order, title, description) VALUES (?, ?, ?, ?)`,
      [missionId, 0, 'Our Mission', "DCRF's mission is to build a structured, multi-stakeholder ecosystem for disaster preparedness and climate resilience in India — one that shifts institutional energy and financial resources from post-disaster relief toward pre-event mitigation, localised early warning, and community-level capacity building."]
    );
    await pool.execute(
      `INSERT INTO cms_page_cards (section_id, display_order, title, description) VALUES (?, ?, ?, ?)`,
      [missionId, 1, 'How We Work', "We achieve this by convening corporates, CSR funders, government disaster cells, scientific institutions, NGOs, and municipal bodies under a shared platform — enabling data-driven decision-making, coordinated action, and sustained investment in resilience infrastructure across India's most disaster-vulnerable corridors."]
    );

    // Add Our Vision section
    const [r2]: any = await pool.execute(
      `INSERT INTO cms_page_sections (page_slug, display_order, title, description, image_url) VALUES (?, ?, ?, ?, ?)`,
      ['mission-vision', nextOrder++, 'Our Vision', '', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80']
    );
    const visionId = r2.insertId;
    await pool.execute(
      `INSERT INTO cms_page_cards (section_id, display_order, title, description) VALUES (?, ?, ?, ?)`,
      [visionId, 0, 'Our Vision', 'A disaster-resilient India where no community faces a crisis unprepared — and where investments in resilience are treated as essential infrastructure, not optional philanthropy.']
    );
    await pool.execute(
      `INSERT INTO cms_page_cards (section_id, display_order, title, description) VALUES (?, ?, ?, ?)`,
      [visionId, 1, 'Leading the Way', "DCRF envisions becoming the leading federal body that bridges policy and practice on disaster risk reduction, acting as the convergence point between corporate India's CSR obligations, scientific research capabilities, and government's disaster management architecture."]
    );

    console.log('[DB UPGRADE] Added Our Mission & Our Vision content sections to mission-vision page');

    // Also upgrade old stat card format: title="₹3L+" → title="Annual Climate Cost", extra_data={value:3, suffix:"L+", ...}
    const [statsSection]: any = await pool.execute(
      `SELECT id FROM cms_page_sections WHERE page_slug = 'mission-vision' AND title = 'Key Statistics' LIMIT 1`
    );
    if (statsSection.length > 0) {
      const sid = statsSection[0].id;
      const statCards = await pool.execute(
        `SELECT id, title, description, extra_data FROM cms_page_cards WHERE section_id = ?`, [sid]
      ) as any;
      const oldToNew: Record<string, {title: string, desc: string, extra: any}> = {
        '₹3L+': { title: 'Annual Climate Cost', desc: 'Crore loss to India annually', extra: { value: 3, suffix: 'L+', prefix: '₹', color: '#b91c1c' } },
        '500+':  { title: 'Delegates Engaged', desc: 'From 12+ sectors nationwide', extra: { value: 500, suffix: '+', color: '#7c3aed' } },
        '4':     { title: 'Working Groups', desc: 'Technical national committees', extra: { value: 4, color: '#0f766e' } },
        '26':    { title: 'States Covered', desc: 'DCRF active advisory network', extra: { value: 26, color: '#b45309' } },
      };
      for (const card of statCards[0]) {
        const mapping = oldToNew[card.title?.trim()];
        if (mapping) {
          await pool.execute(
            `UPDATE cms_page_cards SET title = ?, description = ?, extra_data = ? WHERE id = ?`,
            [mapping.title, mapping.desc, JSON.stringify(mapping.extra), card.id]
          );
        }
      }
      console.log('[DB UPGRADE] Migrated old stat card format to new format');
    }
  } catch (err) {
    console.warn('[DB UPGRADE] Could not add missing sections:', err);
  }
}

async function upgradePodcastData(pool: mysql.Pool) {
  try {
    const [sections]: any = await pool.execute(
      "SELECT id FROM cms_page_sections WHERE page_slug = 'podcasts' AND title = 'Episodes' LIMIT 1"
    );
    if (sections.length > 0) {
      const sid = sections[0].id;
      const [cards]: any = await pool.execute(
        "SELECT id, extra_data FROM cms_page_cards WHERE section_id = ?", [sid]
      );
      let needsUpgrade = false;
      for (const card of cards) {
        let extra: any = {};
        try { extra = JSON.parse(card.extra_data || '{}'); } catch {}
        if (!extra.audioUrl || extra.videoUrl === undefined) {
          needsUpgrade = true;
          break;
        }
      }

      if (needsUpgrade) {
        console.log("[DB UPGRADE] Podcasts cards lack audioUrl/videoUrl, updating metadata...");
        const oldToNew: Record<number, {audioUrl: string, imageUrl: string, videoUrl?: string}> = {
          15: {
            audioUrl: '',
            imageUrl: 'https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?auto=format&fit=crop&w=400&q=80',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
          },
          14: {
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            imageUrl: 'https://images.unsplash.com/photo-1554475901-4538ddfb1a55?auto=format&fit=crop&w=400&q=80',
            videoUrl: ''
          },
          13: {
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            imageUrl: 'https://images.unsplash.com/photo-1525490822463-b459eb6c2948?auto=format&fit=crop&w=400&q=80',
            videoUrl: ''
          },
          12: {
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
            imageUrl: 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?auto=format&fit=crop&w=400&q=80',
            videoUrl: ''
          },
          11: {
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
            imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80',
            videoUrl: ''
          },
          10: {
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
            imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=400&q=80',
            videoUrl: ''
          },
          9: {
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
            imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
            videoUrl: ''
          }
        };

        for (const card of cards) {
          let extra: any = {};
          try { extra = JSON.parse(card.extra_data || '{}'); } catch {}
          const epNum = Number(extra.episodeNumber) || 0;
          const upgradeInfo = oldToNew[epNum];
          if (upgradeInfo) {
            extra.audioUrl = upgradeInfo.audioUrl;
            extra.videoUrl = upgradeInfo.videoUrl || '';
            extra.imageUrl = upgradeInfo.imageUrl;
            await pool.execute(
              "UPDATE cms_page_cards SET image_url = ?, extra_data = ? WHERE id = ?",
              [upgradeInfo.imageUrl, JSON.stringify(extra), card.id]
            );
          } else {
            // General fallback: ensure properties exist
            extra.audioUrl = extra.audioUrl || '';
            extra.videoUrl = extra.videoUrl || '';
            await pool.execute(
              "UPDATE cms_page_cards SET extra_data = ? WHERE id = ?",
              [JSON.stringify(extra), card.id]
            );
          }
        }
        console.log("[DB UPGRADE] Podcasts cards updated with audioUrl, videoUrl and imageUrl.");
      }
    }
  } catch (err) {
    console.warn("[DB UPGRADE WARN] upgradePodcastData failed:", err);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T = unknown>(sql: string, params: any[] = []): Promise<T> {
  const pool = getDbPool();
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // Execute the query using the connection pool
      const [results] = await pool.execute(sql, params);
      return results as T;
    } catch (error: any) {
      const message = error?.message || String(error);
      const errCode = error?.code || '';

      const isConnectionLimitError = 
        errCode === 'ER_CON_COUNT_ERROR' ||
        errCode === 1203 ||
        errCode === 'ER_TOO_MANY_USER_CONNECTIONS' ||
        message.includes('max_user_connections') ||
        message.includes('max_connections') ||
        message.includes('too many connections');

      if (isConnectionLimitError && attempt < maxRetries - 1) {
        attempt++;
        // Exponential backoff: 200ms * 2^attempt + random jitter up to 200ms
        const delay = Math.round(200 * Math.pow(2, attempt) + Math.random() * 200);
        console.warn(`[DB WARN] Database connection limit exceeded (${message}). Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      console.error(`Database query failed: ${message} (SQL: ${sql})`);
      throw new Error('Database operation failed. Please try again later.');
    }
  }
  throw new Error('Database connection limit exceeded after multiple retries.');
}
