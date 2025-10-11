import argon2 from 'argon2';
import crypto from 'crypto';
import { signAccessToken, createSession, issueRefreshToken } from '../utils/tokenService.js';
import { audit } from '../utils/audit.js';

// In-memory storage for demo - replace with actual database
const users = new Map();
const verificationCodes = new Map();

const JWT_SECRET = process.env.JWT_SECRET;
const ARGON_OPTS = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19MB
  timeCost: 2,
  parallelism: 1,
};

// Helper function to generate verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to validate Gmail
const isGmail = (email) => {
  return email && email.toLowerCase().endsWith('@gmail.com');
};

// Helper function to validate phone number
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// Register with Gmail
const registerWithGmail = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }

    if (!isGmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please use a Gmail address' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Check if user already exists
    if (users.has(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }

    // Hash password
    const hashedPassword = await argon2.hash(password, ARGON_OPTS);

    // Create user
    const userId = crypto.randomUUID();
    const user = {
      id: userId,
      name,
      email,
      password: hashedPassword,
      authMethod: 'gmail',
      verified: true, // Gmail accounts are considered verified
      createdAt: new Date(),
      lastLogin: new Date()
    };

    users.set(email, user);

    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'Server misconfigured' });
    }

    // Create cookie session tokens
    const sessionId = await createSession({ userId, userAgent: req.headers['user-agent'], ipAddress: req.ip });
    const accessToken = signAccessToken({ userId, email, authMethod: 'gmail' }, '15m');
    const { token: refreshToken, expiresAt } = await issueRefreshToken(sessionId);

    const domain = process.env.COOKIE_DOMAIN || '.nexusai.com';
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('nxa_access', accessToken, { httpOnly: true, secure: isProd, sameSite: 'Strict', domain, maxAge: 15 * 60 * 1000, path: '/' });
    res.cookie('nxa_refresh', refreshToken, { httpOnly: true, secure: isProd, sameSite: 'Strict', domain, maxAge: 30 * 24 * 60 * 60 * 1000, path: '/api/auth' });

    try { await audit(req, 'auth_register', 'user', userId, { method: 'gmail' }); } catch {}
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: userId,
          name,
          email,
          authMethod: 'gmail'
        },
        token: accessToken,
        refreshExpiresAt: expiresAt
      }
    });

  } catch (error) {
    console.error('Gmail registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Login with Gmail
const loginWithGmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    if (!isGmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please use a Gmail address' 
      });
    }

    // Find user
    const user = users.get(email);
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.password, password);
    if (!isValidPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    users.set(email, user);

    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'Server misconfigured' });
    }

    // Create cookie session tokens
    const sessionId = await createSession({ userId: user.id, userAgent: req.headers['user-agent'], ipAddress: req.ip });
    const accessToken = signAccessToken({ userId: user.id, email, authMethod: 'gmail' }, '15m');
    const { token: refreshToken, expiresAt } = await issueRefreshToken(sessionId);

    const domain = process.env.COOKIE_DOMAIN || '.nexusai.com';
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('nxa_access', accessToken, { httpOnly: true, secure: isProd, sameSite: 'Strict', domain, maxAge: 15 * 60 * 1000, path: '/' });
    res.cookie('nxa_refresh', refreshToken, { httpOnly: true, secure: isProd, sameSite: 'Strict', domain, maxAge: 30 * 24 * 60 * 60 * 1000, path: '/api/auth' });

    try { await audit(req, 'auth_login', 'user', user.id, { method: 'gmail' }); } catch {}
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          authMethod: 'gmail'
        },
        token: accessToken,
        refreshExpiresAt: expiresAt
      }
    });

  } catch (error) {
    console.error('Gmail login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Send phone verification code
const sendPhoneVerification = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid phone number is required' 
      });
    }

    // Generate verification code
    const code = generateVerificationCode();
    
    // Store verification code (expires in 10 minutes)
    verificationCodes.set(phone, {
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0
    });

    // In production, integrate with SMS service like Twilio
    console.log(`📱 Verification code for ${phone}: ${code}`);

    try { await audit(req, 'auth_login', 'user', user.id, { method: 'phone' }); } catch {}
    res.json({
      success: true,
      message: 'Verification code sent successfully',
      data: {
        phone,
        // For demo purposes only - remove in production
        code: process.env.NODE_ENV === 'development' ? code : undefined
      }
    });

  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send verification code' 
    });
  }
};

// Verify phone and login/register
const verifyPhoneAndAuth = async (req, res) => {
  try {
    const { phone, code, name } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and verification code are required' 
      });
    }

    // Check verification code
    const storedData = verificationCodes.get(phone);
    if (!storedData) {
      return res.status(400).json({ 
        success: false, 
        message: 'No verification code found for this phone number' 
      });
    }

    if (storedData.expiresAt < new Date()) {
      verificationCodes.delete(phone);
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code has expired' 
      });
    }

    if (storedData.attempts >= 3) {
      verificationCodes.delete(phone);
      return res.status(400).json({ 
        success: false, 
        message: 'Too many failed attempts. Please request a new code' 
      });
    }

    if (storedData.code !== code) {
      storedData.attempts++;
      verificationCodes.set(phone, storedData);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code' 
      });
    }

    // Code is valid, remove it
    verificationCodes.delete(phone);

    // Check if user exists
    let user = Array.from(users.values()).find(u => u.phone === phone);
    
    if (!user) {
      // Register new user
      if (!name) {
        return res.status(400).json({ 
          success: false, 
          message: 'Name is required for new users' 
        });
      }

      const userId = crypto.randomUUID();
      user = {
        id: userId,
        name,
        phone,
        authMethod: 'phone',
        verified: true,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      users.set(phone, user);
    } else {
      // Update last login for existing user
      user.lastLogin = new Date();
      users.set(phone, user);
    }

    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'Server misconfigured' });
    }

    // Create cookie session tokens
    const sessionId = await createSession({ userId: user.id, userAgent: req.headers['user-agent'], ipAddress: req.ip });
    const accessToken = signAccessToken({ userId: user.id, phone, authMethod: 'phone' }, '15m');
    const { token: refreshToken, expiresAt } = await issueRefreshToken(sessionId);

    const domain = process.env.COOKIE_DOMAIN || '.nexusai.com';
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('nxa_access', accessToken, { httpOnly: true, secure: isProd, sameSite: 'Strict', domain, maxAge: 15 * 60 * 1000, path: '/' });
    res.cookie('nxa_refresh', refreshToken, { httpOnly: true, secure: isProd, sameSite: 'Strict', domain, maxAge: 30 * 24 * 60 * 60 * 1000, path: '/api/auth' });

    res.json({
      success: true,
      message: user.createdAt.getTime() === user.lastLogin.getTime() ? 'Registration successful' : 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          authMethod: 'phone'
        },
        token: accessToken,
        refreshExpiresAt: expiresAt
      }
    });

  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.user; // From auth middleware

    // Find user by ID
    const user = Array.from(users.values()).find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          authMethod: user.authMethod,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Logout (invalidate token)
const logout = async (req, res) => {
  try {
    // In a real app, you'd add the token to a blacklist
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export {
  registerWithGmail,
  loginWithGmail,
  sendPhoneVerification,
  verifyPhoneAndAuth,
  getUserProfile,
  logout
};
