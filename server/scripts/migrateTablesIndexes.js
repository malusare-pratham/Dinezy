import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from '../config/db.js';
import Table from '../models/Table.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname,'../.env')
});

const migrate = async () => {
  await connectDB();

  const collection = Table.collection;

  const indexes = await collection.indexes();

  const hasOldUnique =
    indexes.some((idx) => idx?.name === 'tableNumber_1');

  if(hasOldUnique){
    await collection.dropIndex('tableNumber_1');
    console.log('Dropped index: tableNumber_1');
  }
  else{
    console.log('Index not found: tableNumber_1');
  }

  await Table.syncIndexes();
  console.log('Synced indexes for Table model');

  console.log('========================================');
  console.log(' Migrate Table Indexes Completed');
  console.log('========================================');

  process.exit(0);
};

migrate().catch((error) => {
  console.error('Migrate Table Indexes Failed:', error?.message || error);
  process.exit(1);
});
