import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from '../config/db.js';
import Menu from '../models/Menu.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname,'../.env')
});

const seedMenu = async () => {
  await connectDB();

  const items = [
    {
      name: 'Paneer Tikka',
      category: 'Starter',
      price: 280,
      hsn: '21069099',
      gst: 5,
      diet: 'VEG',
      subCategories: [
        'Malai',
        'Tandoor'
      ]
    },
    {
      name: 'Veg Manchurian',
      category: 'Starter',
      price: 220,
      hsn: '21069099',
      gst: 5,
      diet: 'VEG'
    },
    {
      name: 'Crispy Corn',
      category: 'Starter',
      price: 180,
      hsn: '21069099',
      gst: 5,
      diet: 'JAIN'
    },
    {
      name: 'Chicken Crispy',
      category: 'Starter',
      price: 320,
      hsn: '21069099',
      gst: 5,
      diet: 'NON-VEG'
    },
    {
      name: 'Masala Papad',
      category: 'Starter',
      price: 60,
      hsn: '21069099',
      gst: 5,
      diet: 'VEG'
    },
    {
      name: 'Chicken Tandoori',
      category: 'Starter',
      price: 420,
      hsn: '21069099',
      gst: 5,
      diet: 'NON-VEG',
      subCategories: [
        'Half',
        'Full'
      ]
    },
    {
      name: 'Paneer Butter Masala',
      category: 'Main Course',
      price: 320,
      hsn: '21069099',
      gst: 5,
      diet: 'VEG'
    },
    {
      name: 'Methi Masala',
      category: 'Main Course',
      price: 260,
      hsn: '21069099',
      gst: 5,
      diet: 'VEG'
    },
    {
      name: 'Paneer Masala',
      category: 'Main Course',
      price: 280,
      hsn: '21069099',
      gst: 5,
      diet: 'VEG'
    },
    {
      name: 'Chicken Masala',
      category: 'Main Course',
      price: 360,
      hsn: '21069099',
      gst: 5,
      diet: 'NON-VEG'
    },
    {
      name: 'Dal Tadka',
      category: 'Main Course',
      price: 220,
      hsn: '21069099',
      gst: 5,
      diet: 'JAIN'
    },
    {
      name: 'Veg Kolhapuri',
      category: 'Main Course',
      price: 280,
      hsn: '21069099',
      gst: 5,
      diet: 'VEG'
    },
    {
      name: 'Butter Naan',
      category: 'Breads',
      price: 60,
      hsn: '21069099',
      gst: 5,
      diet: 'VEG'
    },
    {
      name: 'Garlic Naan',
      category: 'Breads',
      price: 80,
      hsn: '21069099',
      gst: 5,
      diet: 'VEG'
    },
    {
      name: 'Tandoor Roti',
      category: 'Breads',
      price: 30,
      hsn: '21069099',
      gst: 5,
      diet: 'VEG',
      subCategories: [
        'Wheat Roti',
        'Tandoor Roti',
        'Butter'
      ]
    },
    {
      name: 'Steamed Rice',
      category: 'Rice & Biryani',
      price: 120,
      hsn: '21069099',
      gst: 5,
      diet: 'VEG'
    },
    {
      name: 'Veg Biryani',
      category: 'Rice & Biryani',
      price: 240,
      hsn: '21069099',
      gst: 5,
      diet: 'VEG'
    },
    {
      name: 'Chicken Biryani',
      category: 'Rice & Biryani',
      price: 320,
      hsn: '21069099',
      gst: 5,
      diet: 'NON-VEG'
    },
    {
      name: 'Ice Cream',
      category: 'Desserts',
      price: 80,
      hsn: '21069099',
      gst: 5,
      diet: 'VEG',
      subCategories: [
        'Vanilla',
        'Strawberry',
        'Chocolate'
      ]
    },
    {
      name: 'Brownie',
      category: 'Desserts',
      price: 180,
      hsn: '21069099',
      gst: 5,
      diet: 'VEG',
      subCategories: [
        'Mango Brownie',
        'Chocolate Brownie'
      ]
    },
    {
      name: 'Poha',
      category: 'Breakfast',
      price: 70,
      hsn: '21069099',
      gst: 5,
      diet: 'VEG',
      subCategories: [
        'Kanda Poha',
        'Batata Poha'
      ]
    },
    {
      name: 'Upma',
      category: 'Breakfast',
      price: 80,
      hsn: '21069099',
      gst: 5,
      diet: 'VEG'
    },
    {
      name: 'Water Bottle',
      category: 'Colddrinks',
      price: 20,
      hsn: '22019010',
      gst: 0,
      diet: 'VEG',
      subCategories: [
        '500ml',
        '1L'
      ]
    },
    {
      name: 'Cold Drink',
      category: 'Colddrinks',
      price: 50,
      hsn: '22021090',
      gst: 12,
      diet: 'VEG',
      subCategories: [
        'Coke',
        'Sprite',
        'Fanta'
      ]
    }
  ];

  for (const item of items) {
    await Menu.findOneAndUpdate(
      {
        name: item.name,
        category: item.category
      },
      {
        $set:{
          ...item,
          type: item.diet === 'NON-VEG' ? 'NON-VEG' : 'VEG',
          isAvailable: true
        }
      },
      {
        upsert:true,
        new:true,
        runValidators:true
      }
    );
  }

  console.log('========================================');
  console.log(' Seed Menu Completed');
  console.log('========================================');

  process.exit(0);
};

seedMenu().catch((error) => {
  console.error('Seed Menu Failed:', error?.message || error);
  process.exit(1);
});
