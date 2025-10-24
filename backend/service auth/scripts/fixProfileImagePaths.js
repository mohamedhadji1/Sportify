require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};

const fixProfileImagePaths = async () => {
  try {
    console.log('🔧 Starting profile image path migration...');
    
    // Find all users with profile images
    const users = await User.find({ 
      profileImage: { $exists: true, $ne: null, $ne: '' } 
    });
    
    console.log(`Found ${users.length} users with profile images`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      const originalPath = user.profileImage;
      
      // Check if it's already just a filename
      if (!originalPath.includes('/') && !originalPath.includes('\\')) {
        console.log(`✅ User ${user.email} already has correct format: ${originalPath}`);
        continue;
      }
      
      // Extract filename from path
      let filename = originalPath;
      
      // Handle Windows paths with backslashes
      if (originalPath.includes('\\')) {
        filename = originalPath.split('\\').pop();
      }
      // Handle Unix paths with forward slashes
      else if (originalPath.includes('/')) {
        filename = originalPath.split('/').pop();
      }
      
      // Update the user
      user.profileImage = filename;
      await user.save();
      
      console.log(`✅ Updated ${user.email}: ${originalPath} → ${filename}`);
      updatedCount++;
    }
    
    console.log(`🎉 Migration completed! Updated ${updatedCount} users.`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run the migration
const runMigration = async () => {
  await connectDB();
  await fixProfileImagePaths();
};

runMigration();