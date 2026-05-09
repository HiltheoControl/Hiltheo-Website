import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// In-memory database (replace with real database in production)
let users = [];
let cars = [
  {id: 1, make: "Mercedes-Benz", model: "S-Class S 580 4MATIC Sedan", year: "2023", price: "$125,000", date: "Jun 11, 2024", status: "Available"},
  {id: 2, make: "BMW", model: "7 Series 760i xDrive M Sport", year: "2024", price: "$140,000", date: "Jun 9, 2024", status: "Available"},
  {id: 3, make: "Audi", model: "Q8 Prestige 55 TFSI quattro", year: "2023", price: "$95,000", date: "Jun 10, 2024", status: "Available"}
];

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Verify Google Token
async function verifyGoogleToken(token) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    return ticket.getPayload();
  } catch (error) {
    console.error('Google token verification failed:', error);
    return null;
  }
}

// Generate JWT
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
}

// Routes

// Google Sign-In
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Google token required' });
    }

    const googleUser = await verifyGoogleToken(token);
    
    if (!googleUser) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const { email, name, picture, sub: googleId } = googleUser;

    // Check if user exists
    let user = users.find(u => u.email === email);

    if (!user) {
      // Create new user
      user = {
        id: uuidv4(),
        name,
        email,
        googleId,
        picture,
        authType: 'google',
        createdAt: new Date().toISOString()
      };
      users.push(user);
    } else {
      // Update Google info if existing user
      user.googleId = googleId;
      user.picture = picture;
      user.name = name;
    }

    const jwtToken = generateToken(user);

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Regular Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    
    if (!user || user.authType === 'google') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Regular Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      authType: 'local',
      createdAt: new Date().toISOString()
    };

    users.push(user);

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Verify Token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture
    }
  });
});

// Protected Admin Routes
app.get('/api/admin/cars', authenticateToken, (req, res) => {
  res.json({ cars });
});

app.post('/api/admin/cars', authenticateToken, (req, res) => {
  const newCar = {
    id: cars.length + 1,
    ...req.body,
    status: 'Available'
  };
  cars.push(newCar);
  res.json({ success: true, car: newCar });
});

app.put('/api/admin/cars/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const index = cars.findIndex(c => c.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Car not found' });
  }
  
  cars[index] = { ...cars[index], ...req.body };
  res.json({ success: true, car: cars[index] });
});

app.delete('/api/admin/cars/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const index = cars.findIndex(c => c.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Car not found' });
  }
  
  cars.splice(index, 1);
  res.json({ success: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get Google Client ID
app.get('/api/config/google', (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
