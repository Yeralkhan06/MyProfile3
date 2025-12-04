const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

const createProfileTable = `
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    middle_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    location TEXT,
    bio TEXT,
    photo_url TEXT,
    github_username TEXT,
    linkedin_url TEXT,
    website_url TEXT,
    skills JSON,
    experience JSON,
    education JSON,
    projects JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

const createSkillsTable = `
  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    skill_name TEXT NOT NULL,
    skill_level INTEGER DEFAULT 0,
    category TEXT,
    FOREIGN KEY (profile_id) REFERENCES profile (id) ON DELETE CASCADE
  )
`;

const createExperienceTable = `
  CREATE TABLE IF NOT EXISTS experience (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    company_name TEXT NOT NULL,
    position TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    description TEXT,
    technologies JSON,
    FOREIGN KEY (profile_id) REFERENCES profile (id) ON DELETE CASCADE
  )
`;

const createEducationTable = `
  CREATE TABLE IF NOT EXISTS education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    institution_name TEXT NOT NULL,
    degree TEXT NOT NULL,
    field_of_study TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    description TEXT,
    FOREIGN KEY (profile_id) REFERENCES profile (id) ON DELETE CASCADE
  )
`;

const createProjectsTable = `
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    project_name TEXT NOT NULL,
    description TEXT,
    github_url TEXT,
    demo_url TEXT,
    technologies JSON,
    image_url TEXT,
    start_date TEXT,
    end_date TEXT,
    FOREIGN KEY (profile_id) REFERENCES profile (id) ON DELETE CASCADE
  )
`;

// Initialize database
console.log('Creating database tables...');

db.serialize(() => {
  db.run(createProfileTable);
  db.run(createSkillsTable);
  db.run(createExperienceTable);
  db.run(createEducationTable);
  db.run(createProjectsTable);

  console.log('Database tables created successfully!');

  // Insert sample data
  const insertSampleProfile = `
    INSERT OR REPLACE INTO profile (
      id, first_name, last_name, middle_name, email, phone, location, 
      bio, github_username, linkedin_url, website_url
    ) VALUES (
      1, 'Мақсұт', 'Ералхан', 'Дарханұлы', 'yeralkhan@example.com', 
      '8 777 199 9922', 'Казахстан',
      'Занимается версткой сайта, а также Java разработчик. Создаю веб-приложения и небольшие проекты. Также увлекаюсь дизайном и созданием контента.',
      'Yeralkhan06', NULL, NULL
    )
  `;

  const insertSampleSkills = [
    `INSERT OR REPLACE INTO skills (profile_id, skill_name, skill_level, category) VALUES (1, 'Верстка сайтов', 85, 'Frontend')`,
    `INSERT OR REPLACE INTO skills (profile_id, skill_name, skill_level, category) VALUES (1, 'Java разработка', 80, 'Backend')`,
    `INSERT OR REPLACE INTO skills (profile_id, skill_name, skill_level, category) VALUES (1, 'Создание приложений', 75, 'Development')`,
    `INSERT OR REPLACE INTO skills (profile_id, skill_name, skill_level, category) VALUES (1, 'Художество', 70, 'Art')`,
    `INSERT OR REPLACE INTO skills (profile_id, skill_name, skill_level, category) VALUES (1, 'Контент-мейкинг', 65, 'Content')`,
    `INSERT OR REPLACE INTO skills (profile_id, skill_name, skill_level, category) VALUES (1, 'HTML/CSS', 90, 'Web')`
  ];

  const insertSampleExperience = `
    INSERT OR REPLACE INTO experience (
      profile_id, company_name, position, start_date, end_date, description, technologies
    ) VALUES (
      1, 'ТехКомпани', 'Senior Web Developer', '2022-01-01', NULL,
      'Разработка и поддержка веб-приложений, архитектура проектов, менторство разработчиков',
      '["React", "Node.js", "PostgreSQL", "AWS"]'
    )
  `;

  const insertSampleEducation = `
    INSERT OR REPLACE INTO education (
      profile_id, institution_name, degree, field_of_study, start_date, end_date, description
    ) VALUES (
      1, 'Международный Университет Астана', 'Выпускник', 'Программирование и веб-разработка', '2018-09-01', '2022-06-30',
      'Изучение основ программирования, веб-технологий и разработки программного обеспечения'
    )
  `;

  const insertSampleProjects = `
    INSERT OR REPLACE INTO projects (
      profile_id, project_name, description, github_url, demo_url, technologies, start_date
    ) VALUES (
      1, 'Video Production', 'Веб-сайт для видеопродукции с современным дизайном',
      'https://github.com/Yeralkhan06/Video-Production', 'https://yeralkhan06.github.io/Video-Production/',
      '["HTML", "CSS", "JavaScript"]', '2024-01-01'
    ),
    (
      1, 'Hello2Site', 'Многостраничный корпоративный сайт',
      'https://github.com/Yeralkhan06/Hello2Site', 'https://yeralkhan06.github.io/Hello2Site/',
      '["HTML", "CSS", "JavaScript"]', '2024-02-01'
    ),
    (
      1, 'AirPlan3', 'Интерактивное приложение для планирования путешествий',
      'https://github.com/Yeralkhan06/AirPlan3', 'https://yeralkhan06.github.io/AirPlan3/',
      '["HTML", "CSS", "JavaScript"]', '2024-03-01'
    ),
    (
      1, 'Vet Clinic API', 'REST API для ветеринарной клиники на Java',
      'https://github.com/Yeralkhan06/vet-clinic-api1', 'https://yeralkhan06.github.io/vet-clinic-api1/',
      '["Java", "Spring Boot", "MySQL"]', '2024-04-01'
    )
  `;

  db.run(insertSampleProfile, (err) => {
    if (err) {
      console.error('Error inserting sample profile:', err);
    } else {
      console.log('Sample profile inserted successfully!');
    }

    insertSampleSkills.forEach((skill, index) => {
      db.run(skill, (err) => {
        if (err) {
          console.error(`Error inserting skill ${index + 1}:`, err);
        }
        if (index === insertSampleSkills.length - 1) {
          console.log('Sample skills inserted successfully!');
          
          db.run(insertSampleExperience, (err) => {
            if (err) {
              console.error('Error inserting sample experience:', err);
            } else {
              console.log('Sample experience inserted successfully!');
            }

            db.run(insertSampleEducation, (err) => {
              if (err) {
                console.error('Error inserting sample education:', err);
              } else {
                console.log('Sample education inserted successfully!');
              }

              db.run(insertSampleProjects, (err) => {
                if (err) {
                  console.error('Error inserting sample projects:', err);
                } else {
                  console.log('Sample projects inserted successfully!');
                  console.log('Database initialization completed!');
                }
              });
            });
          });
        }
      });
    });
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('Database connection closed.');
  }
});