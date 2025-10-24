// fix-specific-image.js
// Script to check for and create a specific missing image

const fs = require('fs');
const path = require('path');

// The specific image file that's causing the 404
const specificImageFilename = '68d86e1b04baa0904a2d12ec-1759014427709-468884599.png';
const uploadDir = path.join(__dirname, 'uploads');
const specificImagePath = path.join(uploadDir, specificImageFilename);

console.log('Checking for specific image:', specificImagePath);

// Make sure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  console.log('Creating uploads directory:', uploadDir);
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Check if the specific image exists
if (!fs.existsSync(specificImagePath)) {
  console.log('Missing image detected! Creating a placeholder for:', specificImageFilename);
  
  // Create a simple colored placeholder image (1x1 blue pixel PNG in base64)
  const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  try {
    const imageBuffer = Buffer.from(base64Image, 'base64');
    fs.writeFileSync(specificImagePath, imageBuffer);
    console.log('Successfully created placeholder for missing image!');
    
    // Check permissions on the file
    fs.chmodSync(specificImagePath, '644');
    console.log('Set file permissions to 644');
  } catch (err) {
    console.error('Error creating placeholder image:', err);
  }
} else {
  console.log('Image already exists:', specificImagePath);
  
  // Check and update permissions
  try {
    fs.chmodSync(specificImagePath, '644');
    console.log('Updated file permissions to 644');
  } catch (err) {
    console.error('Error updating permissions:', err);
  }
}

// Verify all image files in uploads directory
console.log('\nAll files in uploads directory:');
try {
  const files = fs.readdirSync(uploadDir);
  
  if (files.length === 0) {
    console.log('No files found in uploads directory');
  } else {
    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      console.log(`- ${file} (${stats.size} bytes, permissions: ${(stats.mode & 0o777).toString(8)})`);
    });
  }
} catch (err) {
  console.error('Error listing files in uploads directory:', err);
}

// Verify image access via the API endpoints
console.log('\nVerify these URLs are accessible:');
console.log(`1. http://localhost:5020/uploads/${specificImageFilename}`);
console.log(`2. http://localhost:5020/api/equipment/uploads/${specificImageFilename}`);

// Instructions for testing in the browser
console.log('\nTEST INSTRUCTIONS:');
console.log('1. Run this script on the equipment service container');
console.log('2. Try accessing the image URLs directly in the browser');
console.log('3. Check the nginx logs for routing issues');