import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

import connectDB from '../config/db.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../.env')
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

    // 5 Captains
    {
      name: 'Captain C1',
      email: 'c1@gmail.com',
      role: 'CAPTAIN'
    },
    {
      name: 'Captain C2',
      email: 'c2@gmail.com',
      role: 'CAPTAIN'
    },
    {
      name: 'Captain C3',
      email: 'c3@gmail.com',
      role: 'CAPTAIN'
    },
    {
      name: 'Captain C4',
      email: 'c4@gmail.com',
      role: 'CAPTAIN'
    },
    {
      name: 'Captain C5',
      email: 'c5@gmail.com',
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

    if (existing) {
      console.log(`User already exists: ${user.email}`);
      continue;
    }

    await User.create({
      ...user,
      password: hashedPassword
    });

    console.log(`Created: ${user.email}`);
  }

  console.log('========================================');
  console.log(' Seed Users Completed');
  console.log(`
Owner   : owner@gmail.com
Manager : manager@gmail.com
Captain : c1@gmail.com
Captain : c2@gmail.com
Captain : c3@gmail.com
Captain : c4@gmail.com
Captain : c5@gmail.com
Kitchen : kitchen@gmail.com
  `);

  console.log(`Password : ${password}`);
  console.log('========================================');

  process.exit(0);
};

seedUsers().catch((error) => {
  console.error('Seed Users Failed:', error?.message || error);
  process.exit(1);
});