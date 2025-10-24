// setup-uploads.js - Script to set up uploads directory with placeholder images
const fs = require('fs');
const path = require('path');

console.log('Setting up uploads directory...');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  console.log('Creating uploads directory:', uploadDir);
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set proper permissions on uploads directory
try {
  fs.chmodSync(uploadDir, '755');
  console.log('Set permissions on uploads directory to 755');
} catch (err) {
  console.error('Failed to set permissions on uploads directory:', err);
}

// Create equipment uploads subdirectory
const equipmentDir = path.join(uploadDir, 'equipment');
if (!fs.existsSync(equipmentDir)) {
  console.log('Creating equipment uploads directory:', equipmentDir);
  fs.mkdirSync(equipmentDir, { recursive: true });
}

// Create a placeholder image for equipment items
const placeholderPath = path.join(uploadDir, 'placeholder-equipment.png');
if (!fs.existsSync(placeholderPath)) {
  console.log('Creating placeholder equipment image');
  
  // Simple base64 encoded placeholder image (1x1 transparent PNG)
  const placeholderBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  
  try {
    const imageBuffer = Buffer.from(placeholderBase64, 'base64');
    fs.writeFileSync(placeholderPath, imageBuffer);
    console.log('Placeholder equipment image created successfully');
  } catch (err) {
    console.error('Failed to create placeholder image:', err);
  }
}

// Create a test MongoDB ObjectID format image (to test the nginx pattern matching)
const testMongoIdImage = path.join(uploadDir, '507f1f77bcf86cd799439011-1759014427709-123456789.png');
if (!fs.existsSync(testMongoIdImage)) {
  console.log('Creating test MongoDB ID format image');
  
  // Simple 1x1 pixel blue PNG in base64
  const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==';
  
  try {
    const imageBuffer = Buffer.from(base64Image, 'base64');
    fs.writeFileSync(testMongoIdImage, imageBuffer);
    console.log('Test MongoDB ID image created successfully');
  } catch (err) {
    console.error('Error creating test MongoDB ID image:', err);
  }
}

// List all files in the uploads directory
console.log('\nFiles in uploads directory:');
try {
  const files = fs.readdirSync(uploadDir);
  if (files.length === 0) {
    console.log('No files found in uploads directory');
  } else {
    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      console.log(`- ${file} (${stats.size} bytes)`);
    });
  }
} catch (err) {
  console.error('Error listing files in uploads directory:', err);
}

console.log('\nUploads directory setup complete!');