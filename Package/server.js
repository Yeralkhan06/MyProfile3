const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database setup
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
function initializeDatabase() {
  const tables = {
    profile: `
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
    `,
    skills: `
      CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER,
        skill_name TEXT NOT NULL,
        skill_level INTEGER DEFAULT 0,
        category TEXT,
        FOREIGN KEY (profile_id) REFERENCES profile (id) ON DELETE CASCADE
      )
    `,
    experience: `
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
    `,
    education: `
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
    `,
    projects: `
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
    `
  };

  Object.values(tables).forEach(query => {
    db.run(query, (err) => {
      if (err) {
        console.error('Error creating table:', err);
      }
    });
  });
}

initializeDatabase();

// API Routes

// Get profile data
app.get('/api/profile', (req, res) => {
  const query = `
    SELECT 
      p.*,
      GROUP_CONCAT(s.skill_name || ':' || s.skill_level || ':' || s.category) as skills_data,
      GROUP_CONCAT(e.id || '|' || e.company_name || '|' || e.position || '|' || e.start_date || '|' || e.end_date || '|' || e.description || '|' || e.technologies) as experience_data,
      GROUP_CONCAT(ed.id || '|' || ed.institution_name || '|' || ed.degree || '|' || ed.field_of_study || '|' || ed.start_date || '|' || ed.end_date || '|' || ed.description) as education_data,
      GROUP_CONCAT(pr.id || '|' || pr.project_name || '|' || pr.description || '|' || pr.github_url || '|' || pr.demo_url || '|' || pr.technologies || '|' || pr.image_url || '|' || pr.start_date || '|' || pr.end_date) as projects_data
    FROM profile p
    LEFT JOIN skills s ON p.id = s.profile_id
    LEFT JOIN experience e ON p.id = e.profile_id
    LEFT JOIN education ed ON p.id = ed.profile_id
    LEFT JOIN projects pr ON p.id = pr.profile_id
    WHERE p.id = 1
    GROUP BY p.id
  `;

  db.get(query, (err, row) => {
    if (err) {
      console.error('Error fetching profile:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Parse JSON fields
    const profile = {
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      middle_name: row.middle_name,
      email: row.email,
      phone: row.phone,
      location: row.location,
      bio: row.bio,
      photo_url: row.photo_url,
      github_username: row.github_username,
      linkedin_url: row.linkedin_url,
      website_url: row.website_url,
      created_at: row.created_at,
      updated_at: row.updated_at
    };

    // Parse skills
    if (row.skills_data) {
      profile.skills = row.skills_data.split(',').map(skillStr => {
        const [skill_name, skill_level, category] = skillStr.split(':');
        return {
          skill_name,
          skill_level: parseInt(skill_level),
          category
        };
      });
    } else {
      profile.skills = [];
    }

    // Parse experience
    if (row.experience_data) {
      profile.experience = row.experience_data.split(',').map(expStr => {
        const [id, company_name, position, start_date, end_date, description, technologies] = expStr.split('|');
        return {
          id: parseInt(id),
          company_name,
          position,
          start_date,
          end_date: end_date === 'null' ? null : end_date,
          description,
          technologies: technologies && technologies !== 'null' ? JSON.parse(technologies) : []
        };
      });
    } else {
      profile.experience = [];
    }

    // Parse education
    if (row.education_data) {
      profile.education = row.education_data.split(',').map(eduStr => {
        const [id, institution_name, degree, field_of_study, start_date, end_date, description] = eduStr.split('|');
        return {
          id: parseInt(id),
          institution_name,
          degree,
          field_of_study,
          start_date,
          end_date: end_date === 'null' ? null : end_date,
          description
        };
      });
    } else {
      profile.education = [];
    }

    // Parse projects
    if (row.projects_data) {
      profile.projects = row.projects_data.split(',').map(projStr => {
        const [id, project_name, description, github_url, demo_url, technologies, image_url, start_date, end_date] = projStr.split('|');
        return {
          id: parseInt(id),
          project_name,
          description,
          github_url,
          demo_url,
          technologies: technologies && technologies !== 'null' ? JSON.parse(technologies) : [],
          image_url,
          start_date,
          end_date: end_date === 'null' ? null : end_date
        };
      });
    } else {
      profile.projects = [];
    }

    res.json(profile);
  });
});

// Update profile
app.put('/api/profile', [
  body('first_name').notEmpty().trim(),
  body('last_name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    first_name,
    last_name,
    middle_name,
    email,
    phone,
    location,
    bio,
    photo_url,
    github_username,
    linkedin_url,
    website_url,
    skills,
    experience,
    education,
    projects
  } = req.body;

  const updateQuery = `
    UPDATE profile SET
      first_name = ?, last_name = ?, middle_name = ?, email = ?, phone = ?,
      location = ?, bio = ?, photo_url = ?, github_username = ?,
      linkedin_url = ?, website_url = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;

  db.run(updateQuery, [
    first_name, last_name, middle_name, email, phone,
    location, bio, photo_url, github_username,
    linkedin_url, website_url
  ], function(err) {
    if (err) {
      console.error('Error updating profile:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Update skills
    if (skills) {
      db.run('DELETE FROM skills WHERE profile_id = 1', (err) => {
        if (err) console.error('Error deleting skills:', err);

        const skillPromises = skills.map(skill => {
          return new Promise((resolve, reject) => {
            const insertSkill = `
              INSERT INTO skills (profile_id, skill_name, skill_level, category)
              VALUES (1, ?, ?, ?)
            `;
            db.run(insertSkill, [skill.skill_name, skill.skill_level, skill.category], function(err) {
              if (err) reject(err);
              else resolve();
            });
          });
        });

        Promise.all(skillPromises).then(() => {
          console.log('Skills updated successfully');
        }).catch(err => {
          console.error('Error updating skills:', err);
        });
      });
    }

    // Update experience
    if (experience) {
      db.run('DELETE FROM experience WHERE profile_id = 1', (err) => {
        if (err) console.error('Error deleting experience:', err);

        const expPromises = experience.map(exp => {
          return new Promise((resolve, reject) => {
            const insertExp = `
              INSERT INTO experience (profile_id, company_name, position, start_date, end_date, description, technologies)
              VALUES (1, ?, ?, ?, ?, ?, ?)
            `;
            db.run(insertExp, [
              exp.company_name, exp.position, exp.start_date, exp.end_date,
              exp.description, JSON.stringify(exp.technologies || [])
            ], function(err) {
              if (err) reject(err);
              else resolve();
            });
          });
        });

        Promise.all(expPromises).then(() => {
          console.log('Experience updated successfully');
        }).catch(err => {
          console.error('Error updating experience:', err);
        });
      });
    }

    // Update education
    if (education) {
      db.run('DELETE FROM education WHERE profile_id = 1', (err) => {
        if (err) console.error('Error deleting education:', err);

        const eduPromises = education.map(edu => {
          return new Promise((resolve, reject) => {
            const insertEdu = `
              INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, description)
              VALUES (1, ?, ?, ?, ?, ?, ?)
            `;
            db.run(insertEdu, [
              edu.institution_name, edu.degree, edu.field_of_study,
              edu.start_date, edu.end_date, edu.description
            ], function(err) {
              if (err) reject(err);
              else resolve();
            });
          });
        });

        Promise.all(eduPromises).then(() => {
          console.log('Education updated successfully');
        }).catch(err => {
          console.error('Error updating education:', err);
        });
      });
    }

    // Update projects
    if (projects) {
      db.run('DELETE FROM projects WHERE profile_id = 1', (err) => {
        if (err) console.error('Error deleting projects:', err);

        const projPromises = projects.map(proj => {
          return new Promise((resolve, reject) => {
            const insertProj = `
              INSERT INTO projects (profile_id, project_name, description, github_url, demo_url, technologies, image_url, start_date, end_date)
              VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.run(insertProj, [
              proj.project_name, proj.description, proj.github_url, proj.demo_url,
              JSON.stringify(proj.technologies || []), proj.image_url, proj.start_date, proj.end_date
            ], function(err) {
              if (err) reject(err);
              else resolve();
            });
          });
        });

        Promise.all(projPromises).then(() => {
          console.log('Projects updated successfully');
        }).catch(err => {
          console.error('Error updating projects:', err);
        });
      });
    }

    res.json({ message: 'Profile updated successfully' });
  });
});

// GitHub API integration
app.get('/api/github/repos/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const response = await axios.get(`https://api.github.com/users/${username}/repos`, {
      params: {
        sort: 'updated',
        direction: 'desc',
        per_page: 10
      }
    });

    const repos = response.data.map(repo => ({
      name: repo.name,
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      updated_at: repo.updated_at,
      topics: repo.topics || []
    }));

    res.json(repos);
  } catch (error) {
    console.error('Error fetching GitHub repos:', error.message);
    res.status(500).json({ error: 'Failed to fetch GitHub repositories' });
  }
});

// PDF Resume generation
app.get('/api/resume/pdf', (req, res) => {
  const query = `
    SELECT 
      p.*,
      GROUP_CONCAT(s.skill_name || ':' || s.skill_level) as skills_data,
      GROUP_CONCAT(e.company_name || '|' || e.position || '|' || e.start_date || '|' || e.end_date || '|' || e.description) as experience_data,
      GROUP_CONCAT(ed.institution_name || '|' || ed.degree || '|' || ed.field_of_study || '|' || ed.start_date || '|' || ed.end_date) as education_data
    FROM profile p
    LEFT JOIN skills s ON p.id = s.profile_id
    LEFT JOIN experience e ON p.id = e.profile_id
    LEFT JOIN education ed ON p.id = ed.profile_id
    WHERE p.id = 1
    GROUP BY p.id
  `;

  db.get(query, (err, row) => {
    if (err) {
      console.error('Error fetching profile for PDF:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Create PDF
    const doc = new PDFDocument();
    const filename = `${row.first_name}_${row.last_name}_resume.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    doc.pipe(res);

    // PDF Content
    doc.fontSize(20).text(`${row.first_name} ${row.last_name} ${row.middle_name || ''}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Email: ${row.email}`, { align: 'center' });
    if (row.phone) doc.text(`Телефон: ${row.phone}`, { align: 'center' });
    if (row.location) doc.text(`Местоположение: ${row.location}`, { align: 'center' });
    
    doc.moveDown();

    // Skills
    if (row.skills_data) {
      doc.fontSize(16).text('Навыки', { underline: true });
      doc.moveDown(0.5);
      
      const skills = row.skills_data.split(',').map(skillStr => {
        const [skill_name, skill_level] = skillStr.split(':');
        return `${skill_name} (${skill_level}%)`;
      });
      
      doc.fontSize(12).text(skills.join(', '));
      doc.moveDown();
    }

    // Experience
    if (row.experience_data) {
      doc.fontSize(16).text('Опыт работы', { underline: true });
      doc.moveDown(0.5);
      
      const experiences = row.experience_data.split(',').map(expStr => {
        const [company_name, position, start_date, end_date, description] = expStr.split('|');
        const period = `${start_date} - ${end_date || 'н.в.'}`;
        return {
          company: company_name,
          position,
          period,
          description
        };
      });

      experiences.forEach(exp => {
        doc.fontSize(14).text(`${exp.position} в ${exp.company}`, { bold: true });
        doc.fontSize(10).text(exp.period, { italic: true });
        if (exp.description) {
          doc.fontSize(11).text(exp.description);
        }
        doc.moveDown(0.5);
      });
    }

    // Education
    if (row.education_data) {
      doc.fontSize(16).text('Образование', { underline: true });
      doc.moveDown(0.5);
      
      const educations = row.education_data.split(',').map(eduStr => {
        const [institution_name, degree, field_of_study, start_date, end_date] = eduStr.split('|');
        const period = `${start_date} - ${end_date || 'н.в.'}`;
        return {
          institution: institution_name,
          degree,
          field: field_of_study,
          period
        };
      });

      educations.forEach(edu => {
        doc.fontSize(14).text(edu.institution, { bold: true });
        doc.fontSize(11).text(`${edu.degree}${edu.field ? `, ${edu.field}` : ''}`);
        doc.fontSize(10).text(edu.period, { italic: true });
        doc.moveDown(0.5);
      });
    }

    // Bio
    if (row.bio) {
      doc.fontSize(16).text('О себе', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(row.bio);
    }

    doc.end();
  });
});

// Serve static files
app.use(express.static('public'));

// Fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;