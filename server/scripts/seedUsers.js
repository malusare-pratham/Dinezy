import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

import connectDB from '../config/db.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname,'../.env')
});

const seedUsers = async () => {
  await connectDB();

  const password = 'Dinezy@123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const users = [
    {
      name: 'Demo Owner',
      email: 'owner@gmail.com',
      role: 'OWNER'
    },
    {
      name: 'Demo Manager',
      email: 'manager@gmail.com',
      role: 'MANAGER'
    },
    {
      name: 'Demo Captain',
      email: 'captain@gmail.com',
      role: 'CAPTAIN'
    },
    {
      name: 'Demo Kitchen',
      email: 'kitchen@gmail.com',
      role: 'KITCHEN'
    }
  ];

  for (const user of users) {
    const existing = await User.findOne({ email: user.email });
    if (existing) continue;

    await User.create({
      ...user,
      password: hashedPassword
    });
  }

  console.log('========================================');
  console.log(' Seed Users Completed');
  console.log(' Emails: owner@gmail.com, manager@gmail.com, captain@gmail.com, kitchen@gmail.com');
  console.log(` Password: ${password}`);
  console.log('========================================');

  process.exit(0);
};

seedUsers().catch((error) => {
  console.error('Seed Users Failed:', error?.message || error);
  process.exit(1);
});
