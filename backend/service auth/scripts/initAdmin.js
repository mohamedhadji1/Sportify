// scripts/initAdmin.js
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

const adminData = {
  _id: new mongoose.Types.ObjectId('6886a726ffc035d33abf8665'),
  email: 'm3dwell@gmail.com',
  password: '$2a$12$3Wui2717ydRfoXvh6fz.i.5TsUA9eOyFBym3k3FEVUomfsyozt2Iu',
  role: 'Admin',
  fullName: 'med hajji',
  phoneNumber: '+21624911669',
  attachment: [],
  preferredSports: ['padel', 'football'],
  position: 'midfielder',
  isVerified: true,
  activeSessions: [
    {
      sessionId: 'fa5f6eb9d9c30f344fa8aad2e3923c295349622dac1c852d01688ca3fd8acb5a',
      deviceInfo: 'Desktop',
      browser: 'Chrome 138',
      os: 'Windows 10',
      ipAddress: '::1',
      location: 'Unknown Location',
      loginTime: new Date('2025-07-28T09:18:51.405Z'),
      lastActivity: new Date('2025-07-28T09:19:35.854Z'),
      isCurrentSession: false,
  _id: new mongoose.Types.ObjectId('6887407b27b920b4f6208a35')
    },
    {
      sessionId: 'c0f3abbcad8bbec0aa8a7330e7961a58532363e2d88d0e8b0ebc74791adb8851',
      deviceInfo: 'Desktop',
      browser: 'Chrome 138',
      os: 'Windows 10',
      ipAddress: '::1',
      location: 'Unknown Location',
      loginTime: new Date('2025-08-03T19:11:04.828Z'),
      lastActivity: new Date('2025-08-03T19:11:23.554Z'),
      isCurrentSession: false,
  _id: new mongoose.Types.ObjectId('688fb448c84f8516a0af2d33')
    },
    {
      sessionId: '32deebb8f395804960665b970891afe0670226c7ceaf241d352dbef2aec435f3',
      deviceInfo: 'Desktop',
      browser: 'Chrome 138',
      os: 'Windows 10',
      ipAddress: '::1',
      location: 'Unknown Location',
      loginTime: new Date('2025-08-04T00:35:14.599Z'),
      lastActivity: new Date('2025-08-04T01:05:58.694Z'),
      isCurrentSession: false,
  _id: new mongoose.Types.ObjectId('68900042c84f8516a0af2f6e')
    },
    {
      sessionId: 'e8bccc5c3ff8972a18fa6da1af84a1ea09d63e98c339232a3296d9cab55d731e',
      deviceInfo: 'Desktop',
      browser: 'Chrome 138',
      os: 'Windows 10',
      ipAddress: '::1',
      location: 'Unknown Location',
      loginTime: new Date('2025-08-04T01:13:34.433Z'),
      lastActivity: new Date('2025-08-04T01:35:27.848Z'),
      isCurrentSession: false,
  _id: new mongoose.Types.ObjectId('6890093ec84f8516a0af2ff2')
    },
    {
      sessionId: 'b5afa5083b64347a2be3384cf134e12a8a05261aadf9be3a7aa252bfb9fa327b',
      deviceInfo: 'Desktop',
      browser: 'Chrome 138',
      os: 'Windows 10',
      ipAddress: '::1',
      location: 'Unknown Location',
      loginTime: new Date('2025-08-04T01:41:47.996Z'),
      lastActivity: new Date('2025-08-04T01:53:27.539Z'),
      isCurrentSession: true,
  _id: new mongoose.Types.ObjectId('68900fdbc84f8516a0af3145')
    }
  ],
  createdAt: new Date('2025-07-27T22:24:38.906Z'),
  __v: 13,
  profileImage: 'uploads/profileImage-1753655397100.png',
  cin: '07216674',
  twoFactorEnabled: false,
  twoFactorRecoveryCodes: []
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const admin = await User.findOne({ role: 'Admin' });
  if (admin) {
    console.log('Admin user already exists. Skipping.');
    process.exit(0);
  }
  await User.create(adminData);
  console.log('Admin user created.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
