const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const speakeasy = require('speakeasy');
const { check, validationResult } = require('express-validator');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs'); // Added bcryptjs import
const useragent = require('useragent'); // For parsing user agent strings
const axios = require('axios'); // For inter-service communication
const auth = require('../middleware/auth'); // Import auth middleware

// Use a fallback service URL when environment variable is not set (use cluster DNS/service name)
const COMPANY_SERVICE_URL = process.env.COMPANY_SERVICE_URL || 'http://company-service:5001';

// Email verification and player signup routes have been moved to routes/verification.js for clarity and maintainability.
// Please add: app.use('/api/verification', require('./routes/verification')) in your main backend file (index.js).

// Helper function to parse device info from user agent
const parseDeviceInfo = (userAgent, ip) => {
  const agent = useragent.parse(userAgent);

  // Enhanced device type detection
  const getDeviceType = () => {
    const device = agent.device.toString();
    const family = agent.device.family;
    const ua = userAgent.toLowerCase();

    if (family && family !== 'Other') {
      return family;
    }

    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  };

  // Enhanced browser detection
  const getBrowserName = () => {
    const family = agent.family;
    const version = agent.major || '';

    if (family === 'Chrome') return version ? `Chrome ${version}` : 'Chrome';
    if (family === 'Firefox') return version ? `Firefox ${version}` : 'Firefox';
    if (family === 'Safari') return version ? `Safari ${version}` : 'Safari';
    if (family === 'Edge') return version ? `Microsoft Edge ${version}` : 'Microsoft Edge';
    if (family === 'Opera') return version ? `Opera ${version}` : 'Opera';

    return family ? (version ? `${family} ${version}` : family) : 'Unknown Browser';
  };

  // Enhanced OS detection
  const getOSName = () => {
    const os = agent.os;
    if (os.family === 'Windows') {
      const version = os.major;
      if (version === '10') return 'Windows 10';
      if (version === '11') return 'Windows 11';
      return version ? `Windows ${version}` : 'Windows';
    } else if (os.family === 'Mac OS X' || os.family === 'macOS') {
      return os.major ? `macOS ${os.major}` : 'macOS';
    } else if (os.family === 'iOS') {
      return os.major ? `iOS ${os.major}` : 'iOS';
    } else if (os.family === 'Android') {
      return os.major ? `Android ${os.major}` : 'Android';
    } else if (os.family === 'Ubuntu' || os.family === 'Linux') {
      return 'Linux';
    }

    return os.toString() || 'Unknown OS';
  };

  return {
    browser: getBrowserName(),
    os: getOSName(),
    deviceInfo: getDeviceType(),
    ipAddress: ip || 'Unknown IP',
    userAgent: userAgent || 'Unknown User Agent'
  };
};

// Handle OPTIONS requests for CORS preflight (temporarily commented out for debugging)
// router.options('*', (req, res) => {
//   res.header('Access-Control-Allow-Origin', 'http://localhost:8081');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
//   res.status(200).send();
// });

// Session configuration - use SESSION_SECRET if provided, otherwise fallback to JWT_SECRET
const sessionSecret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
if (!sessionSecret) {
  console.error('FATAL: No session secret configured. Set SESSION_SECRET or JWT_SECRET env var.');
}
// Session configuration
router.use(session({
  secret: sessionSecret,
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
    const uploadPath = path.join(__dirname, '..', 'uploads');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});
// Import auth middleware
const authMiddleware = require('../middleware/auth');

// Health endpoint for readiness/liveness checks
router.get('/health', (req, res) => {
  return res.status(200).json({ success: true, status: 'ok', service: 'auth' });
});

// @route   GET api/auth/user/:id
// @desc    Get user details by ID for inter-service communication
// @access  Private (Admin/Manager/Service)
router.get('/user/:id', async (req, res) => {
  try {
    console.log('=== GET /user/:id called ===');
    console.log('Requested user ID:', req.params.id);
    console.log('Auth token present:', !!req.header('x-auth-token'));

    // Check if request has auth token
    const token = req.header('x-auth-token');

    if (token) {
      // If token is provided, validate it
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
          return res.status(404).json({ success: false, msg: 'Authenticated user not found' });
        }

        // Allow Admin to access any user, or users to access their own profile
        if (user.role !== 'Admin' && user._id.toString() !== req.params.id) {
          return res.status(403).json({ success: false, msg: 'Not authorized to access this user' });
        }
      } catch (authError) {
        return res.status(401).json({ success: false, msg: 'Invalid token' });
      }
    }
    // If no token, allow service-to-service communication (company service calling auth service)
    console.log('Searching for user with ID:', req.params.id);

    // Validate ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid ObjectId format:', req.params.id);
      return res.status(400).json({ success: false, msg: 'Invalid user ID format' });
    }

    const user = await User.findById(req.params.id).select('_id fullName email role isVerified profileImage phoneNumber cin companyName');

    if (!user) {
      console.log('User not found with ID:', req.params.id);
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    console.log('User found:', { id: user._id, fullName: user.fullName, email: user.email, role: user.role });

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        id: user._id, // Include both _id and id for compatibility
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profileImage: user.profileImage ? `/uploads/${user.profileImage}` : null,
        phoneNumber: user.phoneNumber,
        cin: user.cin,
        companyName: user.companyName
      }
    });
  } catch (err) {
    console.error('Error fetching user by ID:', err);
    res.status(500).json({ success: false, error: 'Server error while fetching user', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// @route   GET api/auth/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, msg: 'Not authorized to access this resource' });
    }
    const users = await User.find().select('-password -twoFactorSecret -twoFactorRecoveryCodes');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, error: 'Server error while fetching users', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});
// @route   GET api/auth/players
// @desc    Get all players with advanced search
// @access  Private (Admin/Manager)
router.get('/players', authMiddleware, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'Admin' && req.user.role !== 'Player')) {
      return res.status(403).json({ success: false, msg: 'Not authorized to access this resource' });
    }

    // Build search query
    let query = { role: 'Player' };
    const { search, sport, position, status, sortBy, sortOrder, page = 1, limit = 10 } = req.query;

    // Text search across multiple fields
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex }
      ];
    }      // Filter by sport
    if (sport && sport !== 'all') {
      query.$or = [
        { preferredSport: sport }, // Old singular field
        { preferredSports: { $in: [sport] } } // New array field
      ];
    }

    // Filter by position
    if (position && position !== 'all') {
      query.position = position;
    }

    // Filter by status
    if (status && status !== 'all') {
      if (status === 'active') {
        query.isVerified = true;
      } else if (status === 'inactive') {
        query.isVerified = false;
      }
    }

    // Build sort object
    let sort = {};
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      sort[sortBy] = order;
    } else {
      sort.createdAt = -1; // Default sort by newest
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const players = await User.find(query)
      .select('-password -twoFactorSecret -twoFactorRecoveryCodes')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: players.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: players
    });
  } catch (err) {
    console.error('Error fetching players:', err);
    res.status(500).json({ success: false, error: 'Server error while fetching players', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});  // @route   GET api/auth/managers
// @desc    Get all managers with advanced search
// @access  Private (Admin)
router.get('/managers', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, msg: 'Not authorized to access this resource' });
    }

    // Build search query
    let query = { role: 'Manager' };
    const { search, status, sortBy, sortOrder, page = 1, limit = 10 } = req.query;

    // Text search across multiple fields
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { cin: searchRegex },
        { phoneNumber: searchRegex }
      ];
    }

    // Filter by status
    if (status && status !== 'all') {
      if (status === 'active') {
        query.isVerified = true;
      } else if (status === 'inactive') {
        query.isVerified = false;
      }
    }

    // Build sort object
    let sort = {};
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      sort[sortBy] = order;
    } else {
      sort.createdAt = -1; // Default sort by newest
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;      // Execute query with pagination
    const managers = await User.find(query)
      .select('_id fullName email isVerified attachment profileImage cin phoneNumber companyName createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: managers.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: managers
    });
  } catch (err) {
    console.error('Error fetching managers:', err);
    res.status(500).json({ success: false, error: 'Server error while fetching managers', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// @route   DELETE api/auth/player/:id
// @desc    Delete a player by ID
// @access  Private (Admin)
router.delete('/player/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, msg: 'Not authorized' });
    }
    const player = await User.findOneAndDelete({ _id: req.params.id, role: 'Player' });
    if (!player) {
      return res.status(404).json({ success: false, msg: 'Player not found' });
    }
    res.status(200).json({ success: true, msg: 'Player deleted successfully' });
  } catch (err) {
    console.error('Error deleting player:', err);
    res.status(500).json({ success: false, msg: 'Server error while deleting player' });
  }
});

// @route   PUT api/auth/player/:id
// @desc    Update a player by ID
// @access  Private (Admin)
router.put('/player/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, msg: 'Not authorized' });
    }
    const updates = req.body;
    const player = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'Player' },
      updates,
      { new: true, runValidators: true }
    ).select('-password -twoFactorSecret -twoFactorRecoveryCodes');
    if (!player) {
      return res.status(404).json({ success: false, msg: 'Player not found' });
    }
    res.status(200).json({ success: true, msg: 'Player updated successfully', data: player });
  } catch (err) {
    console.error('Error updating player:', err);
    res.status(500).json({ success: false, msg: 'Server error while updating player' });
  }
});

// @route   DELETE api/auth/manager/:id
// @desc    Delete a manager by ID
// @access  Private (Admin)
router.delete('/manager/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, msg: 'Not authorized' });
    }
    // Cascade delete: delete companies owned by this manager, then delete courts for those companies.
    const managerId = req.params.id;
    const companyApiBase = `${COMPANY_SERVICE_URL}/api/companies`;
    const courtApiBase = `${process.env.COURT_SERVICE_URL || 'http://court-service:5002'}/api/courts`;

    // 1) Find companies owned by manager via company service internal endpoint
    try {
      const ownerResp = await axios.get(`${companyApiBase}/internal/owner/${managerId}`);
      if (ownerResp && ownerResp.data && Array.isArray(ownerResp.data)) {
        const companies = ownerResp.data;
        for (const comp of companies) {
          const companyId = comp._id || comp.id;
          // Delete courts belonging to this company via court service
          try {
            await axios.delete(`${courtApiBase}/company/${companyId}/internal`, { headers: { 'x-internal-call': 'true' } });
            console.log('Deleted courts for company', companyId);
          } catch (courtErr) {
            console.warn('Failed to delete courts for company', companyId, courtErr.response ? courtErr.response.data : courtErr.message);
          }

          // Delete the company itself
          try {
            await axios.delete(`${companyApiBase}/${companyId}`, { headers: { 'x-internal-call': 'true' } });
            console.log('Deleted company', companyId);
          } catch (compErr) {
            console.warn('Failed to delete company', companyId, compErr.response ? compErr.response.data : compErr.message);
          }
        }
      }
    } catch (ownerErr) {
      console.log('Company owner lookup failed or none found. Proceeding to delete manager only. Details:', ownerErr.response ? ownerErr.response.data : ownerErr.message);
    }

    // 2) Finally delete the manager user record
    const manager = await User.findOneAndDelete({ _id: managerId, role: 'Manager' });
    if (!manager) {
      return res.status(404).json({ success: false, msg: 'Manager not found' });
    }

    res.status(200).json({ success: true, msg: 'Manager and related resources deleted (where applicable)' });
  } catch (err) {
    console.error('Error deleting manager:', err);
    res.status(500).json({ success: false, msg: 'Server error while deleting manager' });
  }
});

// @route   PUT api/auth/manager/:id
// @desc    Update a manager by ID
// @access  Private (Admin)
router.put('/manager/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, msg: 'Not authorized' });
    }
    const updates = req.body;
    const manager = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'Manager' },
      updates,
      { new: true, runValidators: true }
    ).select('-password -twoFactorSecret -twoFactorRecoveryCodes');
    if (!manager) {
      return res.status(404).json({ success: false, msg: 'Manager not found' });
    }
    res.status(200).json({ success: true, msg: 'Manager updated successfully', data: manager });
  } catch (err) {
    console.error('Error updating manager:', err);
    res.status(500).json({ success: false, msg: 'Server error while updating manager' });
  }
});

// @route   PUT api/auth/manager/approve/:id
// @desc    Approve a manager by ID and send login password
// @access  Private (Admin)
router.put('/manager/approve/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, msg: 'Not authorized' });
    }

    // Generate random password
    const rawPassword = crypto.randomBytes(8).toString('hex'); // Renamed for clarity
    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const manager = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'Manager' },
      {
        isVerified: true,
        password: hashedPassword // Store the hashed password
      },
      { new: true, runValidators: true }
    ).select('-password -twoFactorSecret -twoFactorRecoveryCodes');

    if (!manager) {
      return res.status(404).json({ success: false, msg: 'Manager not found' });
    }
    // Also ensure the manager's company exists and is approved
    const companyApiBase = `${COMPANY_SERVICE_URL}/api/companies`;

    const ensureCompanyAndApprove = async (mgr) => {
      try {
        // 1) Check internal owner endpoint for existing companies
        try {
          const ownerResp = await axios.get(`${companyApiBase}/internal/owner/${mgr._id}`);
          if (ownerResp && ownerResp.data && Array.isArray(ownerResp.data) && ownerResp.data.length > 0) {
            // Company exists, attempt to approve
            await axios.put(`${companyApiBase}/approve-by-owner/${mgr._id}`);
            console.log('Company approved successfully for manager (existing):', mgr._id);
            return;
          }
        } catch (ownerErr) {
          // If the internal owner lookup failed with 404 or similar, we'll proceed to create
          console.log('Owner lookup returned no companies or failed, will attempt auto-create. Details:', ownerErr.response ? ownerErr.response.data : ownerErr.message);
        }

        // 2) No existing company found — create via auto-create then approve
        const payload = {
          id: mgr._id,
          role: mgr.role,
          email: mgr.email,
          fullName: mgr.fullName
        };
        const tempToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        const autoCreatePayload = {
          companyName: mgr.companyName || `${mgr.fullName} Company`,
          ownerId: mgr._id,
          ownerInfo: {
            _id: mgr._id,
            fullName: mgr.fullName,
            email: mgr.email
          },
          ownerRole: 'Manager',
          address: {
            street: 'To be completed',
            city: 'Tunis',
            state: 'Tunis',
            zipCode: '1000',
            country: 'Tunisia'
          },
          description: 'Auto-created company entry during manager approval.'
        };

        try {
          const createResp = await axios.post(`${companyApiBase}/auto-create`, autoCreatePayload, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tempToken}`
            }
          });
          console.log('Auto-created company for manager:', mgr._id, 'companyId:', createResp.data._id || createResp.data.company?._id || createResp.data._id);

          // Approve newly created company
          try {
            await axios.put(`${companyApiBase}/approve-by-owner/${mgr._id}`);
            console.log('Company auto-approved for manager:', mgr._id);
          } catch (secondApproveErr) {
            console.error('Failed to auto-approve company after creation for manager:', mgr._id, secondApproveErr.response ? secondApproveErr.response.data : secondApproveErr.message);
          }
        } catch (createErr) {
          console.error('Failed to auto-create company for manager:', mgr._id, createErr.response ? createErr.response.data : createErr.message);
        }
      } catch (err) {
        console.error('ensureCompanyAndApprove unexpected error for manager:', mgr._id, err.response ? err.response.data : err.message);
      }
    };

    try {
      await ensureCompanyAndApprove(manager);
    } catch (companyError) {
      console.error('Company approval/creation process encountered an error for manager:', manager._id, companyError.message || companyError);
    }

    // Send email with password
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME || process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Verify transporter connection
    try {
      await transporter.verify();
      console.log('Server is ready to take our messages');
    } catch (error) {
      console.error('Error verifying transporter:', error);
      return res.status(500).json({
        success: false,
        msg: 'Failed to initialize email service',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME || process.env.EMAIL_USER,
      to: manager.email,
      subject: '🎉 Your Sportify Manager Account Has Been Approved',
      text: `Welcome to Sportify!\n\nYour manager account has been approved and is now active!\n\nYour temporary password is: ${rawPassword}\n\nImportant: Please login and change your password immediately for security.\n\nLogin at: https://sportify.com/manager-signin\n\nIf you have any questions, contact our support team at support@sportify.com\n\nBest regards,\nThe Sportify Team`,
      html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Manager Account Approved - Sportify</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #374151;
                background-color: #f9fafb;
              }
              
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
              }
              
              .header {
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
              }
              
              .logo {
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 8px;
                letter-spacing: -1px;
              }
              
              .tagline {
                font-size: 16px;
                opacity: 0.9;
                font-weight: 500;
              }
              
              .content {
                padding: 40px 30px;
              }
              
              .welcome-title {
                font-size: 28px;
                font-weight: 700;
                color: #111827;
                margin-bottom: 12px;
                text-align: center;
              }
              
              .welcome-subtitle {
                font-size: 18px;
                color: #6b7280;
                text-align: center;
                margin-bottom: 32px;
                font-weight: 500;
              }
              
              .approval-section {
                background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                border: 2px solid #10b981;
                border-radius: 12px;
                padding: 32px;
                text-align: center;
                margin: 32px 0;
              }
              
              .approval-icon {
                font-size: 48px;
                margin-bottom: 16px;
              }
              
              .approval-text {
                font-size: 18px;
                color: #047857;
                font-weight: 600;
                margin-bottom: 24px;
              }
              
              .password-section {
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                padding: 32px;
                text-align: center;
                margin: 32px 0;
              }
              
              .password-label {
                font-size: 16px;
                color: #475569;
                margin-bottom: 16px;
                font-weight: 600;
              }
              
              .temporary-password {
                display: inline-block;
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                font-size: 24px;
                font-weight: 700;
                letter-spacing: 4px;
                padding: 16px 24px;
                border-radius: 12px;
                margin: 16px 0;
                box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.05);
                font-family: 'Courier New', monospace;
              }
              
              .security-warning {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border: 2px solid #f59e0b;
                border-radius: 8px;
                padding: 16px;
                margin: 24px 0;
                text-align: center;
              }
              
              .security-text {
                color: #92400e;
                font-weight: 600;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
              }
              
              .instructions {
                background: #f8fafc;
                border-left: 4px solid #10b981;
                padding: 20px;
                margin: 24px 0;
                border-radius: 0 8px 8px 0;
              }
              
              .instructions-title {
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                margin-bottom: 12px;
              }
              
              .instructions-list {
                list-style: none;
                padding: 0;
              }
              
              .instructions-list li {
                padding: 8px 0;
                color: #475569;
                font-size: 15px;
                position: relative;
                padding-left: 24px;
              }
              
              .instructions-list li:before {
                content: "✓";
                position: absolute;
                left: 0;
                color: #10b981;
                font-weight: bold;
              }
              
              .login-button {
                display: inline-block;
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
                color: white;
                text-decoration: none;
                padding: 16px 32px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                margin: 16px 0;
                transition: all 0.3s ease;
              }
              
              .footer {
                background: #f8fafc;
                padding: 32px 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
              }
              
              .footer-text {
                color: #6b7280;
                font-size: 14px;
                margin-bottom: 16px;
              }
              
              .support-text {
                color: #9ca3af;
                font-size: 13px;
                line-height: 1.5;
              }
              
              .highlight {
                color: #059669;
                font-weight: 600;
              }
              
              @media only screen and (max-width: 600px) {
                .container {
                  margin: 0;
                  border-radius: 0;
                }
                
                .header, .content, .footer {
                  padding: 24px 20px;
                }
                
                .temporary-password {
                  font-size: 20px;
                  letter-spacing: 3px;
                  padding: 12px 20px;
                }
                
                .welcome-title {
                  font-size: 24px;
                }
                
                .welcome-subtitle {
                  font-size: 16px;
                }
              }
            </style>
          </head>
          <body>
            <div style="padding: 20px;">
              <div class="container">
                <div class="header">
                  <div class="logo">🏆 Sportify</div>
                  <div class="tagline">Your Sports Management Platform</div>
                </div>
                
                <div class="content">
                  <h1 class="welcome-title">Welcome to Sportify!</h1>
                  <p class="welcome-subtitle">Your manager account has been approved</p>
                  
                  <div class="approval-section">
                    <div class="approval-icon">🎉</div>
                    <div class="approval-text">
                      Congratulations! Your manager account has been approved and is now active.
                    </div>
                  </div>
                  
                  <div class="password-section">
                    <div class="password-label">Your Temporary Password</div>
                    <div class="temporary-password">${rawPassword}</div>
                    <p style="color: #64748b; font-size: 14px; margin-top: 12px;">
                      Use this password to access your manager dashboard
                    </p>
                  </div>
                  
                  <div class="security-warning">
                    <div class="security-text">
                      <span>⚠️</span>
                      <span>Please change this password immediately after your first login</span>
                    </div>
                  </div>
                  
                  <div class="instructions">
                    <div class="instructions-title">Next Steps:</div>
                    <ul class="instructions-list">
                      <li>Click the login button below or visit the manager sign-in page</li>
                      <li>Use your email and the temporary password above</li>
                      <li>Change your password in Account Settings</li>
                      <li>Complete your facility profile setup</li>
                      <li>Start managing your sports facilities!</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="https://sportify.com/manager-signin" class="login-button">
                      Access Manager Dashboard
                    </a>
                  </div>
                </div>
                
                <div class="footer">
                  <p class="footer-text">
                    Welcome to the <span class="highlight">Sportify</span> management team! We're excited to have you on board.
                  </p>
                  <p class="support-text">
                    Need help? Contact our support team at <a href="mailto:support@sportify.com" style="color: #059669;">support@sportify.com</a><br>
                    This is an automated message, please do not reply to this email.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully to:', manager.email);
    } catch (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({
        success: false,
        msg: 'Failed to send email',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    res.status(200).json({
      success: true,
      msg: 'Manager approved successfully. Password sent to email.',
      data: manager
    });
  } catch (err) {
    console.error('Error approving manager:', err);
    res.status(500).json({
      success: false,
      msg: 'Server error while approving manager',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   POST api/auth/manager/signup
// @desc    Register a new manager
// @access  Public
router.post('/manager/signup',
  upload.single('attachment'), // Middleware for single file upload, field name 'attachment'
  [
    check('fullName', 'Full name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('cin', 'CIN must be exactly 8 digits').isLength({ min: 8, max: 8 }).isNumeric(),
    check('phoneNumber', 'Phone number must be exactly 8 digits').isLength({ min: 8, max: 8 }).isNumeric(),
    check('companyName', 'Company name is required').not().isEmpty(),
    // No password validation here as managers might not have passwords initially or it's handled differently
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); } const { fullName, email, cin, phoneNumber, companyName } = req.body;

    try {
      // Check for existing user with same email
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ success: false, errors: [{ msg: 'Manager already exists with this email' }] });
      }

      // Check for existing user with same phone number
      let userWithPhone = await User.findOne({ phoneNumber });
      if (userWithPhone) {
        return res.status(400).json({ success: false, errors: [{ msg: 'Phone number is already in use' }] });
      }        // Check for existing user with same CIN
      let userWithCin = await User.findOne({ cin });
      if (userWithCin) {
        return res.status(400).json({ success: false, errors: [{ msg: 'CIN is already in use' }] });
      }

      // Check for existing user with same company name
      let userWithCompanyName = await User.findOne({ companyName });
      if (userWithCompanyName) {
        return res.status(400).json({ success: false, errors: [{ msg: 'Company name is already taken. Please choose a different company name' }] });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, errors: [{ msg: 'Attachment is required' }] });
      }

      const newUser = new User({
        fullName,
        email,
        cin,
        phoneNumber,
        companyName,
        role: 'Manager',
        attachment: req.file ? [req.file.filename] : [],
      });

      await newUser.save();        // Automatically create a company record for the new manager
      try {
        console.log('=== CREATING COMPANY FOR MANAGER ===');
        console.log('Manager ID:', newUser._id);
        console.log('Company Service URL:', COMPANY_SERVICE_URL);
        const companyData = {
          companyName: companyName,
          ownerId: newUser._id,
          ownerInfo: {
            _id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email
          },
          ownerRole: 'Manager',
          address: {
            street: 'To be completed',
            city: 'Tunis',
            state: 'Tunis',
            zipCode: '1000',
            country: 'Tunisia'
          },
          description: 'Company created during manager registration',
          status: 'Pending'
        };

        console.log('Company data to send:', companyData);

        const managerToken = newUser.getSignedJwtToken();
        console.log('Manager token generated:', managerToken ? 'YES' : 'NO');

        const companyResponse = await axios.post(
          `${COMPANY_SERVICE_URL}/api/companies/auto-create`,
          companyData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${managerToken}` // Use manager's token for auth
            }
          }
        );

        console.log('Company creation response status:', companyResponse.status);
        console.log('Company created successfully for manager:', companyResponse.data);
      } catch (companyError) {
        console.error('=== COMPANY CREATION FAILED ===');
        console.error('Error details:', companyError.message);
        if (companyError.response) {
          console.error('Response status:', companyError.response.status);
          console.error('Response data:', companyError.response.data);
        }
        console.error('================================');
        // Don't fail the manager signup if company creation fails
        // The manager can create/edit their company later through the dashboard
      }

      // Generate token (manager might not need immediate login, but token can be useful)
      const token = newUser.getSignedJwtToken();

      res.status(201).json({
        success: true,
        msg: 'Manager account created successfully! Your application is pending admin approval. You will receive an email with login credentials once approved.',
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
          isVerified: newUser.isVerified
        }
      });
    } catch (err) {
      console.error('Manager signup error:', err.message);
      // Handle MongoDB duplicate key errors
      if (err.code === 11000) {
        let errorMessage = 'A user with this information already exists';

        if (err.keyPattern && err.keyPattern.phoneNumber) {
          errorMessage = 'This phone number is already registered with another account';
        } else if (err.keyPattern && err.keyPattern.cin) {
          errorMessage = 'This CIN (National ID) is already registered with another account';
        } else if (err.keyPattern && err.keyPattern.email) {
          errorMessage = 'This email is already registered with another account';
        } else if (err.keyPattern && err.keyPattern.companyName) {
          errorMessage = 'This company name is already taken. Please choose a different company name';
        }

        // Cleanup uploaded file if user save fails
        if (req.file && require('fs').existsSync(req.file.path)) {
          require('fs').unlinkSync(req.file.path);
        }

        return res.status(400).json({
          success: false,
          msg: errorMessage,
          errors: [{ msg: errorMessage }]
        });
      }

      // Cleanup uploaded file if user save fails
      if (req.file && require('fs').existsSync(req.file.path)) {
        require('fs').unlinkSync(req.file.path);
      }
      res.status(500).json({ success: false, msg: 'Server error during manager registration' });
    }
  }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
    check('role', 'Role is required').isIn(['Admin', 'Manager', 'Player'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, role } = req.body;

    try {
      let user = await User.findOne({ email }).select('+password');

      if (!user) {
        if (role === 'Player') {
          const pendingUser = await PendingUser.findOne({ email }).select('+password');
          if (pendingUser) {
            // Check if password matches the one in PendingUser
            // Ensure pendingUser.password exists and is a string
            if (!pendingUser.password || typeof pendingUser.password !== 'string') {
              return res.status(400).json({
                success: false,
                msg: 'Account verification incomplete. Please complete your registration.',
                details: 'Pending user password not set'
              });
            }

            const isMatchPending = await bcrypt.compare(password, pendingUser.password);
            if (!isMatchPending) {
              return res.status(400).json({
                success: false,
                msg: 'Invalid credentials',
                details: 'Password incorrect for pending user'
              });
            }
            // If password matches, then prompt for verification
            return res.status(403).json({
              success: false,
              msg: 'Please verify your email address to complete registration. Check your email for verification code.',
              needsVerification: true,
              email: email
            });
          }
        }
        // If not a Player attempting login, or Player not found in PendingUser, then truly invalid credentials.
        return res.status(400).json({
          success: false,
          msg: 'Invalid credentials',
          details: 'Email not found or password incorrect.' // Keep it generic
        });
      }

      // Early role check
      if (user.role !== role) {
        return res.status(403).json({
          success: false,
          msg: `Access denied. You are attempting to log in as ${role}, but your account role is ${user.role}.`
        });
      }

      // Password validation
      let isMatch = false;
      if (user.role === 'Manager') {
        if (!user.password) {
          return res.status(400).json({
            success: false,
            msg: 'Login failed. Password for this manager account is not set. It may require admin approval or password setup.',
            details: 'Manager password not set'
          });
        }
        isMatch = await user.matchPassword(password);
      } else { // For Admin or Player
        if (!user.password) {
          return res.status(400).json({
            success: false,
            msg: 'Login failed. Password not set for this account.',
            details: 'Password not set'
          });
        }
        isMatch = await user.matchPassword(password);
      } if (!isMatch) {
        return res.status(400).json({
          success: false,
          msg: 'Invalid credentials',
          details: 'Incorrect password'
        });
      }

      // Check if Player account is verified
      if (user.role === 'Player' && !user.isVerified) {
        // Generate and send verification code for unverified users
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 15 * 60 * 1000);

        user.verificationCode = verificationCode;
        user.verificationExpires = expires;
        await user.save();
        // Send verification email
        try {
          const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
              user: process.env.EMAIL_USERNAME || process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD
            }
          });

          const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME || process.env.EMAIL_USER,
            to: user.email,
            subject: 'Email Verification Required - Sportify',
            text: `Your verification code is: ${verificationCode}\n\nThis code will expire in 15 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Email Verification Required</h2>
                  <p>Please verify your email address to complete your login.</p>
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <h3 style="color: #059669;">Verification Code</h3>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #059669;">${verificationCode}</div>
                  </div>
                  <p><strong>This code will expire in 15 minutes.</strong></p>
                  <p>If you didn't request this verification, please ignore this email.</p>
                </div>
              `
          };

          await transporter.sendMail(mailOptions);

          return res.status(403).json({
            success: false,
            msg: 'Email verification required. Please check your email for verification code.',
            needsVerification: true,
            email: user.email
          });
        } catch (emailError) {
          console.error('Error sending verification email:', emailError);
          return res.status(500).json({
            success: false,
            msg: 'Failed to send verification email. Please try again later.'
          });
        }
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        // Generate temporary token for 2FA verification
        const tempToken = jwt.sign(
          { id: user._id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '15m' } // Temporary token expires in 15 minutes
        );

        return res.status(401).json({
          success: false,
          msg: '2FA required',
          tempToken: tempToken
        });
      }

      // Generate token
      const token = user.getSignedJwtToken();

      // Create session tracking
      const sessionId = crypto.createHash('sha256').update(token).digest('hex');
      const userAgent = req.headers['user-agent'] || '';
      const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'Unknown IP';

      const deviceInfo = parseDeviceInfo(userAgent, ip);

      // Add new session to user's active sessions
      const newSession = {
        sessionId: sessionId,
        deviceInfo: deviceInfo.deviceInfo,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ipAddress: deviceInfo.ipAddress,
        location: 'Unknown Location', // You can integrate with IP geolocation service later
        loginTime: new Date(),
        lastActivity: new Date(),
        isCurrentSession: true
      };

      // Ensure activeSessions is an array. Some broken imports create bracketed keys like
      // 'activeSessions[0]' instead of a real array which would cause a runtime error here.
      if (!Array.isArray(user.activeSessions)) {
        try {
          // Try to collect bracketed keys (activeSessions[0], activeSessions[1], ...)
          const doc = (typeof user.toObject === 'function') ? user.toObject() : user;
          const bracketKeys = Object.keys(doc).filter(k => /^activeSessions\[\d+\]$/.test(k));
          if (bracketKeys.length) {
            // sort by index
            bracketKeys.sort((a, b) => {
              const ia = Number(a.match(/\[(\d+)\]/)[1]);
              const ib = Number(b.match(/\[(\d+)\]/)[1]);
              return ia - ib;
            });
            user.activeSessions = bracketKeys.map(k => doc[k]);
            console.warn('Normalized bracketed activeSessions into array for user', user.email || user._id);
          } else {
            user.activeSessions = [];
          }
        } catch (e) {
          user.activeSessions = [];
        }
      }

      // Remove old sessions if more than 5 active sessions
      if (user.activeSessions.length >= 5) {
        user.activeSessions.sort((a, b) => new Date(a.lastActivity) - new Date(b.lastActivity));
        user.activeSessions = user.activeSessions.slice(-4); // Keep only 4 most recent
      }

      // Set all other sessions as not current
      user.activeSessions.forEach(session => {
        session.isCurrentSession = false;
      });

      // Use an atomic update to avoid VersionError and concurrent modification issues.
      // Set any existing sessions' isCurrentSession to false and push the new session,
      // keeping only the most recent 5 sessions.
      try {
        await User.findByIdAndUpdate(user._id, {
          $push: { activeSessions: { $each: [newSession], $slice: -5 } },
          $set: { 'activeSessions.$[].isCurrentSession': false }
        }, { new: true });
      } catch (atomicErr) {
        // Some MongoDB versions/drivers do not allow positional-all ($[]) with $set and $push
        // in the same update for nested arrays; fallback to a safe two-step update.
        const sess = await User.findById(user._id).select('activeSessions');
        const sessionsArray = Array.isArray(sess?.activeSessions) ? sess.activeSessions : [];
        sessionsArray.forEach(s => { if (s && s.isCurrentSession) s.isCurrentSession = false; });
        sessionsArray.push(newSession);
        const trimmed = sessionsArray.slice(-5);
        await User.findByIdAndUpdate(user._id, { $set: { activeSessions: trimmed } });
      }

      res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          profileImage: user.profileImage ? `/uploads/${user.profileImage}` : null
        }
      });

    } catch (err) {
      console.error('Login error:', err);

      if (err.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          msg: 'Validation error',
          errors: Object.values(err.errors).map(e => e.message)
        });
      }

      if (err.name === 'CastError') {
        return res.status(400).json({
          success: false,
          msg: 'Invalid data format'
        });
      }

      res.status(500).json({
        success: false,
        msg: 'Server error during login',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

// @route   POST api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authMiddleware, [
  check('currentPassword', 'Current password is required').exists(),
  check('newPassword', 'New password is required').isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches('[A-Z]').withMessage('Password must contain at least one uppercase letter')
    .matches('[0-9]').withMessage('Password must contain at least one number')
    .matches('[!@#$%^&*]').withMessage('Password must contain at least one special character (!@#$%^&*)'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  try {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, msg: 'Incorrect current password' });
    }

    // Hash new password (the pre-save hook in User model will handle this if using user.save())
    // For direct update or if pre-save hook is not guaranteed for all scenarios:
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save(); // This will trigger the pre-save hook if it's set up to hash

    res.status(200).json({ success: true, msg: 'Password changed successfully' });

  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({
      success: false,
      msg: 'Server error during password change',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   GET api/auth/sessions
// @desc    Get all active sessions for the current user
// @access  Private
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('activeSessions');
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    // Mark the current session and sort
    const currentToken = req.header('x-auth-token');
    const sessions = user.activeSessions.map(session => ({
      ...session.toObject(),
      isCurrentSession: req.sessionId === session.sessionId,
      id: session._id
    })).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

    res.json({
      success: true,
      sessions: sessions
    });

  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({
      success: false,
      msg: 'Server error while fetching sessions',
      errorDetails: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   DELETE api/auth/sessions/:sessionId
// @desc    Terminate a specific session
// @access  Private
router.delete('/sessions/:sessionId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    const sessionIndex = user.activeSessions.findIndex(
      session => session._id.toString() === req.params.sessionId
    );

    if (sessionIndex === -1) {
      return res.status(404).json({ success: false, msg: 'Session not found' });
    }

    // Remove the session
    user.activeSessions.splice(sessionIndex, 1);
    await user.save();

    res.json({
      success: true,
      msg: 'Session terminated successfully'
    });

  } catch (err) {
    console.error('Error terminating session:', err);
    res.status(500).json({
      success: false,
      msg: 'Server error while terminating session',
      errorDetails: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   DELETE api/auth/sessions
// @desc    Terminate all sessions except current
// @access  Private
router.delete('/sessions', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    // Keep only current session if it exists
    const currentSession = user.activeSessions.find(
      session => session.sessionId === req.sessionId
    );

    user.activeSessions = currentSession ? [currentSession] : [];
    await user.save();

    res.json({
      success: true,
      msg: 'All other sessions terminated successfully'
    });

  } catch (err) {
    console.error('Error terminating all sessions:', err);
    res.status(500).json({
      success: false,
      msg: 'Server error while terminating sessions',
      errorDetails: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   POST api/auth/upload-profile-image
// @desc    Upload user profile image
// @access  Private
router.post('/upload-profile-image', authMiddleware, (req, res, next) => {
  upload.single('profileImage')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          msg: 'File too large. Maximum size allowed is 5MB.'
        });
      }
      if (err.message === 'Only image files are allowed!') {
        return res.status(400).json({
          success: false,
          msg: 'Only image files are allowed. Please upload a valid image file.'
        });
      }
      return res.status(400).json({
        success: false,
        msg: 'File upload error: ' + err.message
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, msg: 'No image file provided' });
    }

    // Update user's profile image path
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    // Remove old profile image if it exists
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, '..', 'uploads', user.profileImage);
      if (require('fs').existsSync(oldImagePath)) {
        try {
          require('fs').unlinkSync(oldImagePath);
        } catch (error) {
          console.log('Could not delete old profile image:', error.message);
        }
      }
    }

    // Store just the filename, not the full path
    user.profileImage = req.file.filename;
    await user.save();

    // Construct the URL for the frontend
    const imageUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      msg: 'Profile image uploaded successfully',
      imageUrl: imageUrl,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profileImage: imageUrl
      }
    });

  } catch (err) {
    console.error('Profile image upload error:', err);
    // Cleanup uploaded file if user save fails
    if (req.file && require('fs').existsSync(req.file.path)) {
      require('fs').unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      msg: 'Server error during profile image upload',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   DELETE api/auth/remove-profile-image
// @desc    Remove user profile image
// @access  Private
router.delete('/remove-profile-image', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    // Remove profile image file if it exists
    if (user.profileImage && require('fs').existsSync(user.profileImage)) {
      try {
        require('fs').unlinkSync(user.profileImage);
      } catch (error) {
        console.log('Could not delete profile image file:', error.message);
      }
    }

    user.profileImage = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      msg: 'Profile image removed successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profileImage: null
      }
    });

  } catch (err) {
    console.error('Profile image removal error:', err);
    res.status(500).json({
      success: false,
      msg: 'Server error during profile image removal',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   GET api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -twoFactorSecret -twoFactorRecoveryCodes');
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    } res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        profileImage: user.profileImage ? `/uploads/${user.profileImage}` : null,
        preferredSports: user.preferredSports, // Changed to plural
        position: user.position,
        phoneNumber: user.phoneNumber,
        cin: user.cin,
        companyName: user.companyName,
        location: user.location,
        attachment: user.attachment
      }
    });

  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({
      success: false,
      msg: 'Server error while fetching profile',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   GET api/auth/me
// @desc    Get current user (alias for profile)
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -twoFactorSecret -twoFactorRecoveryCodes');
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    // Return user data in the format expected by frontend
    res.status(200).json({
      _id: user._id,
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      profileImage: user.profileImage ? `/uploads/${user.profileImage}` : null,
      preferredSports: user.preferredSports,
      position: user.position,
      phoneNumber: user.phoneNumber,
      companyName: user.companyName,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({
      success: false,
      msg: 'Server error while fetching user data',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   POST api/auth/validate-token
// @desc    Validate JWT token for inter-service communication
// @access  Public (for services)
router.post('/validate-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ valid: false, msg: 'Token is required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from database
    const user = await User.findById(decoded.id).select('-password -twoFactorSecret -twoFactorRecoveryCodes');

    if (!user) {
      return res.status(404).json({ valid: false, msg: 'User not found' });
    }

    res.status(200).json({
      valid: true,
      user: {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    console.error('Token validation error:', err);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ valid: false, msg: 'Invalid or expired token' });
    }
    res.status(500).json({ valid: false, msg: 'Server error during token validation' });
  }
});

// @route   POST api/auth/forgot-password
// @desc    Send password reset email for both Players and Managers
// @access  Public
router.post('/forgot-password', [
  check('email', 'Valid email is required').isEmail(),
  check('role', 'Role is required').optional().isIn(['Player', 'Manager'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide a valid email',
        errors: errors.array()
      });
    }

    const { email, role } = req.body;

    // Build query - if role is provided, search by both email and role
    const query = { email: email.toLowerCase() };
    if (role) {
      query.role = role;
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: `No ${role || 'user'} account found with that email address`
      });
    }

    // Check if user is verified (for players) or approved (for managers)
    if (user.role === 'Player' && !user.isVerified) {
      return res.status(400).json({
        success: false,
        msg: 'Please verify your account first before resetting password'
      });
    }

    if (user.role === 'Manager' && !user.isVerified) {
      return res.status(400).json({
        success: false,
        msg: 'Your manager account is not yet approved. Please wait for admin approval.'
      });
    }


    // Get reset token
    const resetToken = user.getResetPasswordToken();
    // Save token using atomic update to avoid optimistic concurrency (VersionError)
    await User.updateOne(
      { _id: user._id },
      { $set: { resetPasswordToken: user.resetPasswordToken, resetPasswordExpire: user.resetPasswordExpire } }
    );

    // Create reset URL - point to frontend
    const resetUrl = `http://localhost:8081/reset-password/${resetToken}`;      // Email transporter setup
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Email template
    const message = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - Sportify</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 10px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
              padding: 30px;
            }
            .content {
              padding: 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              background: #f8f9fa;
              text-align: center;
              padding: 20px;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              color: #856404;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset</h1>
            </div>
            <div class="content">
              <div class="greeting">Hello ${user.fullName || `${user.role}`},</div>
              <div class="message">
                We received a request to reset your password for your Sportify ${user.role.toLowerCase()} account. If you made this request, please click the button below to reset your password.
              </div>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
              </div>
              <div class="message">
                If the button doesn't work, you can copy and paste the following link into your browser:
              </div>
              <div style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
                ${resetUrl}
              </div>
              <div class="warning">
                ⚠️ <strong>Important:</strong> This password reset link will expire in 10 minutes for security reasons. If you didn't request this password reset, please ignore this email.
              </div>
            </div>
            <div class="footer">
              <div>This email was sent from Sportify Platform</div>
              <div>If you have any questions, please contact our support team.</div>
            </div>
          </div>
        </body>
        </html>
      `;

    try {
      await transporter.sendMail({
        from: `"Sportify Platform" <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`,
        to: user.email,
        subject: 'Password Reset Request - Sportify',
        html: message
      });

      res.status(200).json({
        success: true,
        msg: 'Password reset email sent successfully',
        data: {
          email: user.email,
          role: user.role,
          expiresIn: '10 minutes'
        }
      });
    } catch (err) {
      console.error('Email send error:', err);

      // Remove reset token from user if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        msg: 'Email could not be sent'
      });
    }

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({
      success: false,
      msg: 'Server error'
    });
  }
});

// @route   GET api/auth/validate-reset-token/:token
// @desc    Validate reset password token for both Players and Managers
// @access  Public
router.get('/validate-reset-token/:token', async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = require('crypto')
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      msg: 'Reset token is valid',
      data: {
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Validate reset token error:', err);
    res.status(500).json({
      success: false,
      msg: 'Server error'
    });
  }
});

// @route   PUT api/auth/reset-password/:token
// @desc    Reset password for both Players and Managers
// @access  Public
router.put('/reset-password/:token', [
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: 'Validation failed',
        errors: errors.array()
      });
    }

    const { password } = req.body;

    // Get hashed token
    const resetPasswordToken = require('crypto')
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user by reset token and check if token hasn't expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();      // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Password reset confirmation email template
    const confirmationMessage = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Successful - Sportify</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 10px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
              color: white;
              text-align: center;
              padding: 30px;
            }
            .content {
              padding: 30px;
            }
            .success-icon {
              text-align: center;
              font-size: 48px;
              margin: 20px 0;
            }
            .footer {
              background: #f8f9fa;
              text-align: center;
              padding: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Reset Successful</h1>
            </div>
            <div class="content">
              <div class="success-icon">🎉</div>
              <div class="greeting">Hello ${user.fullName || `${user.role}`},</div>
              <div class="message">
                Your password has been successfully reset! You can now sign in to your Sportify ${user.role.toLowerCase()} account using your new password.
              </div>
              <div class="message">
                For your security, if you didn't make this change, please contact our support team immediately.
              </div>
            </div>
            <div class="footer">
              <div>This email was sent from Sportify Platform</div>
              <div>If you have any questions, please contact our support team.</div>
            </div>
          </div>
        </body>
        </html>
      `;

    try {
      await transporter.sendMail({
        from: `"Sportify Platform" <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`,
        to: user.email,
        subject: 'Password Reset Successful - Sportify',
        html: confirmationMessage
      });
    } catch (emailError) {
      console.error('Confirmation email error:', emailError);
      // Don't fail the request if confirmation email fails
    }

    res.status(200).json({
      success: true,
      msg: 'Password reset successful',
      data: {
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({
      success: false,
      msg: 'Server error'
    });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile-duplicate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        preferredSports: user.preferredSports,
        position: user.position,
        companyName: user.companyName,
        cin: user.cin,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({
      success: false,
      msg: 'Server error'
    });
  }
});

// @route   GET /api/auth/verify
// @desc    Verify user token and return user info
// @access  Private
router.get('/verify-duplicate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        preferredSports: user.preferredSports,
        position: user.position,
        companyName: user.companyName,
        cin: user.cin,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('User verification error:', err);
    res.status(401).json({
      success: false,
      message: 'User verification failed.'
    });
  }
});

// Also expose the same verification endpoint at `/verify` so other services
// that expect `/api/auth/verify` (gateway/bookings) continue to work.
router.get('/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        preferredSports: user.preferredSports,
        position: user.position,
        companyName: user.companyName,
        cin: user.cin,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('User verification error:', err);
    res.status(401).json({
      success: false,
      message: 'User verification failed.'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile-duplicate', auth, async (req, res) => {
  try {
    const { fullName, phoneNumber, preferredSports, position, companyName } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }    // Update fields if provided
    if (fullName !== undefined) user.fullName = fullName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (preferredSports !== undefined) user.preferredSports = preferredSports;
    if (position !== undefined) user.position = position;

    // Special handling for companyName to ensure uniqueness across users
    if (companyName !== undefined) {
      if (Array.isArray(companyName)) {
        // Check if any of the company names are already used by other users
        for (const company of companyName) {
          const existingUser = await User.findOne({
            _id: { $ne: user._id }, // Exclude current user
            companyName: { $in: [company] }
          });
          if (existingUser) {
            return res.status(400).json({
              success: false,
              msg: `Company name "${company}" is already assigned to another user`
            });
          }
        }
      } else if (typeof companyName === 'string') {
        // Check if the company name is already used by other users
        const existingUser = await User.findOne({
          _id: { $ne: user._id }, // Exclude current user
          companyName: { $in: [companyName] }
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            msg: `Company name "${companyName}" is already assigned to another user`
          });
        }
      }
      user.companyName = companyName;
    }

    await user.save();

    res.json({
      success: true,
      msg: 'Profile updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        preferredSports: user.preferredSports,
        position: user.position,
        companyName: user.companyName,
        cin: user.cin,
        profileImage: user.profileImage,
        isVerified: user.isVerified, createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({
      success: false,
      msg: 'Server error'
    });
  }
});

// Bulk user data endpoint for microservice communication
router.post('/users/bulk', async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        msg: 'userIds array is required'
      });
    }

    const users = await User.find({
      _id: { $in: userIds }
    }).select('_id fullName email profileImage role createdAt');

    res.json({
      success: true,
      users: users
    });
  } catch (err) {
    console.error('Bulk user fetch error:', err);
    res.status(500).json({
      success: false,
      msg: 'Server error'
    });
  }
});

module.exports = router;