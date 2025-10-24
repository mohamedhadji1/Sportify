const express = require('express')
const router = express.Router()
const Product = require('../models/Product')
const mongoose = require('mongoose')

// Use a local copy of the auth middleware
const auth = require('../middleware/auth')

// Helper: check if a user is admin - case insensitive
function isAdmin(user) {
  if (!user) return false
  
  // Log the user information for debugging
  console.log("User role check:", {
    id: user.id || user._id,
    role: user.role,
    roles: user.roles
  })
  
  // Case-insensitive role check
  const role = user.role ? user.role.toLowerCase() : null
  const isAdminRole = role === 'admin' || role === 'administrator' || role === 'manager'
  
  // Check roles array if it exists
  const hasAdminInRoles = Array.isArray(user.roles) && 
    user.roles.some(r => {
      if (typeof r !== 'string') return false
      const lowerRole = r.toLowerCase()
      return lowerRole === 'admin' || lowerRole === 'administrator' || lowerRole === 'manager'
    })
  
  return isAdminRole || hasAdminInRoles
}

// Helper: check if user is seller or owner
function isSellerOrOwner(user, sellerId) {
  if (!user) return false
  if (isAdmin(user)) return true
  try {
    const uId = user._id ? String(user._id) : String(user.id || user._id)
    return uId === String(sellerId) || (Array.isArray(user.roles) && user.roles.includes('seller'))
  } catch (e) {
    return false
  }
}

// Public: submit a product (by seller)
// Seller: submit a product (authenticated)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, price, currency = 'USD', images = [], sellerId } = req.body
    // Use authenticated user as seller if sellerId not provided
    const effectiveSellerId = sellerId || (req.user && (req.user._id || req.user.id))
    if (!title || !price || !effectiveSellerId) return res.status(400).json({ error: 'Missing required fields' })

    if (!isSellerOrOwner(req.user, effectiveSellerId)) return res.status(403).json({ error: 'Not authorized to submit product for this seller' })

    const sellerObjectId = new mongoose.Types.ObjectId(effectiveSellerId)
    const product = new Product({ title, description, price: Number(price), currency, images, sellerId: sellerObjectId })
    await product.save()
    res.json({ message: 'Product submitted', product })
  } catch (err) {
    console.error('Submit product error:', err)
    res.status(500).json({ error: 'Failed to submit product' })
  }
})

// Admin: list pending products
// Admin: list pending products
router.get('/pending', auth, async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ error: 'Not authorized' })
    const pending = await Product.find({ status: 'PENDING' }).sort({ createdAt: -1 })
    res.json({ products: pending })
  } catch (err) {
    console.error('List pending error:', err)
    res.status(500).json({ error: 'Failed to list pending products' })
  }
})

// Admin: approve product
// Admin: approve product
router.post('/:id/approve', auth, async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ error: 'Not authorized' })
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Not found' })
    product.status = 'APPROVED'
    product.approvedBy = req.body.adminId ? new mongoose.Types.ObjectId(req.body.adminId) : undefined
    product.approvedAt = new Date()
    await product.save()
    res.json({ message: 'Product approved', product })
  } catch (err) {
    console.error('Approve product error:', err)
    res.status(500).json({ error: 'Failed to approve product' })
  }
})

// Admin: reject product
// Admin: reject product
router.post('/:id/reject', auth, async (req, res) => {
  try {
    if (!isAdmin(req.user)) return res.status(403).json({ error: 'Not authorized' })
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Not found' })
    product.status = 'REJECTED'
    await product.save()
    res.json({ message: 'Product rejected', product })
  } catch (err) {
    console.error('Reject product error:', err)
    res.status(500).json({ error: 'Failed to reject product' })
  }
})

// Public: list approved products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ status: 'APPROVED' }).sort({ createdAt: -1 })
    res.json({ products })
  } catch (err) {
    console.error('List approved error:', err)
    res.status(500).json({ error: 'Failed to list products' })
  }
})

// Upload images for a product
router.post('/:id/images', auth, async (req, res) => {
  try {
    // Check if product exists and user is authorized
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: 'Product not found' })
    
    // Verify user is seller or admin
    if (!isSellerOrOwner(req.user, product.sellerId)) {
      return res.status(403).json({ error: 'Not authorized to upload images for this product' })
    }

    // If multer middleware is not set up yet, we need to install it
    const multer = require('multer')
    const fs = require('fs')
    const path = require('path')

    // Ensure uploads directory exists
    const uploadDir = path.join(__dirname, '../uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Configure storage
    const storage = multer.diskStorage({
      destination: function(req, file, cb) {
        cb(null, uploadDir)
      },
      filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname)
        cb(null, `${req.params.id}-${uniqueSuffix}${ext}`)
      }
    })

    // Set up upload middleware
    const upload = multer({
      storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true)
        } else {
          cb(new Error('Only images are allowed'))
        }
      }
    }).array('images', 4) // Accept up to 4 images

    // Handle file upload
    upload(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err)
        return res.status(400).json({ error: err.message })
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No images uploaded' })
      }

      // Update product with image paths
      const imagePaths = req.files.map(file => `/uploads/${file.filename}`)
      product.images = product.images.concat(imagePaths)
      await product.save()

      res.json({ message: 'Images uploaded successfully', product })
    })
  } catch (err) {
    console.error('Image upload error:', err)
    res.status(500).json({ error: 'Failed to upload images' })
  }
})

module.exports = router
