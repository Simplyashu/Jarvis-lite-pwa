const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use(session({
  secret: 'your_secret_key', // Change this in production!
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Use true if HTTPS
}));

// Helper functions for file-based persistence
function readJSON(filename) {
  const filepath = path.resolve(__dirname, filename);
  if (!fs.existsSync(filepath)) return [];
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function writeJSON(filename, data) {
  const filepath = path.resolve(__dirname, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

const USERS_FILE = './users.json';
const DATA_FILE = './data.json';

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  let users = readJSON(USERS_FILE);

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  writeJSON(USERS_FILE, users);

  res.status(201).json({ message: 'User registered' });
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let users = readJSON(USERS_FILE);
  const user = users.find(u => u.username === username);

  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  req.session.user = { username };
  res.json({ message: 'Logged in' });
});

// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.status(401).json({ message: 'Unauthorized' });
}

// Logout endpoint
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

// Example persistent memory (file storage) usage
app.get('/data', isAuthenticated, (req, res) => {
  const data = readJSON(DATA_FILE);
  res.json(data);
});

app.post('/data', isAuthenticated, (req, res) => {
  let data = readJSON(DATA_FILE);
  data.push(req.body);
  writeJSON(DATA_FILE, data);
  res.status(201).json({ message: 'Data saved' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
