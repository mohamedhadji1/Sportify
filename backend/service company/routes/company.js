const express = require('express');
const router = express.Router();
const {
  createCompany,
  autoCreateCompany,
  getAllCompanies,
  getCompanyById,
  getCompaniesByOwner,
  updateCompany,
  verifyCompany,
  suspendCompany,
  deleteCompany,
  getVerifiedCompanies,
  updateCompanyStats,
  uploadCompanyLogo,
  approveCompanyByOwner,
  getCompanyListForSignup,
  getCompanyFilterOptions
} = require('../controllers/companyController');
const upload = require('../middleware/upload');

const { 
  authenticateToken, 
  requireRole, 
  requireOwnershipOrAdmin 
} = require('../middleware/auth');

// Public routes
router.get('/list/signup', getCompanyListForSignup); // New public route for signup
router.get('/verified', getVerifiedCompanies);
router.get('/filter-options', authenticateToken, requireRole(['Admin']), getCompanyFilterOptions);

// Internal route to backfill ownerInfo for existing companies (run manually)
router.post('/internal/backfill-ownerinfo', async (req, res) => {
  const { backfillOwnerInfo } = require('../controllers/companyController');
  try {
    const result = await backfillOwnerInfo(req, res);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', getCompanyById);

// Private routes (require authentication)
router.post('/', authenticateToken, requireRole(['Manager', 'Admin']), createCompany);
// Allow auto-create without auth so auth service can create companies even if token validation fails
router.post('/auto-create', autoCreateCompany); // Removed authentication requirement for auto-create
router.get('/owner/:ownerId', authenticateToken, getCompaniesByOwner);
router.put('/:id', authenticateToken, updateCompany);
router.delete('/:id', authenticateToken, requireOwnershipOrAdmin, deleteCompany);
router.post('/:id/upload-logo', authenticateToken, upload.single('logo'), uploadCompanyLogo);

// Admin only routes
router.get('/', authenticateToken, requireRole(['Admin']), getAllCompanies);
router.patch('/:id/verify', authenticateToken, requireRole(['Admin']), verifyCompany);
router.patch('/:id/suspend', authenticateToken, requireRole(['Admin']), suspendCompany);

// Internal service routes (no auth required for microservice communication)
router.put('/approve-by-owner/:ownerId', approveCompanyByOwner);
// Internal route to backfill ownerInfo for existing companies (run manually)
router.post('/internal/backfill-ownerinfo', async (req, res) => {
  const { backfillOwnerInfo } = require('../controllers/companyController');
  try {
    const result = await backfillOwnerInfo(req, res);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.patch('/:id/stats', updateCompanyStats);
router.get('/internal/owner/:ownerId', getCompaniesByOwner); // Internal route for microservice communication

module.exports = router;
