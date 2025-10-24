const express = require('express')
const bodyParser = require('body-parser')
const dotenv = require('dotenv')
const connectDB = require('./config/db')
const routes = require('./routes/equipment')
const path = require('path')
const fs = require('fs')

dotenv.config()
const app = express()
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }))

// Make sure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory:', uploadsDir)
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Serve static files from uploads directory via both paths
// This enables image access at both:
// - http://localhost:5020/uploads/{filename}
// - http://localhost:5020/api/equipment/uploads/{filename}
app.use('/uploads', express.static(uploadsDir))
app.use('/api/equipment/uploads', express.static(uploadsDir))

app.use('/api/equipment', routes)

app.get('/health', (req, res) => res.json({ service: 'Equipment Service', status: 'OK' }))

const PORT = process.env.PORT || 5020

const start = async () => {
  await connectDB()
  app.listen(PORT, () => console.log(`Equipment Service running on port ${PORT}`))
}

start().catch(err => {
  console.error('Failed to start Equipment Service', err)
  process.exit(1)
})

module.exports = app
