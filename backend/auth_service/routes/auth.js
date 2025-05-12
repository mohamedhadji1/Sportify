const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const { check, validationResult } = require('express-validator');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const path = require('path');

// Session configuration
router.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure 'uploads/' directory exists
  },
  filename: function (req, file, cb) {
    // cb(null, Date.now() + '-' + file.originalname);
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Utility function to send token and create session
const sendTokenResponse = (user, statusCode, res, req) => {
  const token = user.getSignedJwtToken();
  
  // Create session
  req.session.userId = user._id;
  req.session.role = user.role;
  
  res.status(statusCode).json({
    success: true,
    token,
    role: user.role,
    sessionId: req.sessionID
  });
};

// @route   POST api/auth/manager/signup
// @desc    Register Manager
// @access  Public
router.post(
  '/manager/signup',
  upload.single('attachment'), // Multer middleware for single file upload expecting a field named 'attachment'
  [
    check('email', 'Please include a valid email').isEmail(),
    check('fullName', 'Full name is required').not().isEmpty(),
    check('cin', 'CIN is required and must be 8 digits').isLength({ min: 8, max: 8 }).isNumeric(),
    check('phoneNumber', 'Phone number is required and must be 8 digits').isLength({ min: 8, max: 8 }).isNumeric()
    // Attachment validation can be handled by multer or similar middleware if needed, or checked if req.file exists
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, fullName, cin, phoneNumber } = req.body;
    const attachment = req.file ? req.file.path : null;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Create user object based on role and provided fields
      const newUserFields = {
        email,
        role: 'Manager', // Automatically set to Manager
        fullName,
        cin,
        phoneNumber,
        attachment
      };

      if (!cin || !phoneNumber || !attachment) {
        return res.status(400).json({ msg: 'Manager registration requires CIN, phone number, and attachment.' });
      }

      // Additional security validation for manager
      if (!/^\d{8}$/.test(cin)) {
        return res.status(400).json({ msg: 'CIN must be 8 digits' });
      }
      if (!/^\d{8}$/.test(phoneNumber)) {
        return res.status(400).json({ msg: 'Phone number must be 8 digits' });
      }

      user = new User(newUserFields);
      await user.save();
      
      sendTokenResponse(user, 200, res, req); // Pass req for session creation

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/auth/player/signup
// @desc    Register Player
// @access  Public
router.post(
  '/player/signup',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required and must be at least 6 characters').isLength({ min: 6 }),
    check('fullName', 'Full name is required').not().isEmpty(),
    check('phoneNumber', 'Phone number is required').not().isEmpty(), // Add more specific validation if needed
    check('preferredSport', 'Preferred sport is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName, phoneNumber, preferredSport, position } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      const newUserFields = {
        email,
        password,
        role: 'Player', // Automatically set to Player
        fullName,
        phoneNumber,
        preferredSport,
      };

      if (preferredSport === 'football' && position) {
        newUserFields.position = position;
      } else if (preferredSport === 'football' && !position) {
        return res.status(400).json({ msg: 'Position is required for football players.' });
      }

      user = new User(newUserFields);
      await user.save();
      
      sendTokenResponse(user, 200, res, req); // Pass req for session creation

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token (Login)
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      const isMatch = await user.matchPassword(password);

      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      sendTokenResponse(user, 200, res, req); // Pass req for session creation

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// TODO: Add a /me route to get current user (requires authentication middleware)
// Example:
// const authMiddleware = require('../middleware/auth'); // You'll need to create this
// router.get('/me', authMiddleware, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('-password');
//     res.json(user);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });

// @route   GET api/auth/google
// @desc    Authenticate user with Google
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, send token
    sendTokenResponse(req.user, 200, res);
  }
);

// @route   GET api/auth/facebook
// @desc    Authenticate user with Facebook
// @access  Public
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// @route   GET api/auth/facebook/callback
// @desc    Facebook OAuth callback
// @access  Public
router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, send token
    sendTokenResponse(req.user, 200, res);
  }
);

module.exports = router;