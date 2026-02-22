const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');
require('dotenv').config();

// Helper: Calculate year in college based on registration number and current date
function calculateYearInCollege(registrationNumber) {
  // Extract first 2 digits to get join year
  const joinYearTwoDigits = registrationNumber.slice(0, 2);
  const joinYear = parseInt('20' + joinYearTwoDigits, 10);
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Academic year starts in August (month 8)
  // If current month is August or later: study_year = currentYear - joinYear + 1
  // If current month is before August: study_year = currentYear - joinYear
  let yearInCollege;
  if (currentMonth >= 8) {
    yearInCollege = currentYear - joinYear + 1;
  } else {
    yearInCollege = currentYear - joinYear;
  }

  return { joinYear, yearInCollege };
}

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, registration_number } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword || !registration_number) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate registration number has at least 4 digits (2 for year + at least 2 more)
    if (!/^\d{4,}$/.test(registration_number)) {
      return res.status(400).json({ error: 'Registration number must be at least 4 digits' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Calculate year in college
    const { joinYear, yearInCollege } = calculateYearInCollege(registration_number);

    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ? OR registration_number = ?', 
      [email, registration_number], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (row) {
        return res.status(400).json({ error: 'User already exists with that email or registration number' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      db.run(
        'INSERT INTO users (name, email, password, registration_number) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, registration_number],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Error creating user' });
          }

          // Generate JWT token
          const token = jwt.sign(
            { id: this.lastID, name, email, registration_number, yearInCollege },
            process.env.JWT_SECRET,
            { algorithm: process.env.JWT_ALGORITHM, expiresIn: '24h' }
          );

          res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: this.lastID, name, email, registration_number, yearInCollege }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Calculate year in college
      const { yearInCollege } = calculateYearInCollege(user.registration_number);

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, registration_number: user.registration_number, yearInCollege },
        process.env.JWT_SECRET,
        { algorithm: process.env.JWT_ALGORITHM, expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, name: user.name, email: user.email, registration_number: user.registration_number, yearInCollege }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;
