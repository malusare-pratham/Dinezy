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

const sectionPrefix = (section) => {
  switch(String(section || '').toUpperCase()){
    case 'HALL':
      return 'M';
    case 'AC':
      return 'A';
    case 'FAMILY':
      return 'F';
    case 'BAR':
      return 'B';
    default:
      return 'T';
  }
};

const makeTables = () => {
  const list = [];

  for(let n = 1; n <= 8; n += 1){
    list.push({
      section:'HALL',
      tableNumber:n,
      capacity:4
    });
  }

  for(let n = 1; n <= 6; n += 1){
    list.push({
      section:'AC',
      tableNumber:n,
      capacity:4
    });
  }

  for(let n = 1; n <= 4; n += 1){
    list.push({
      section:'FAMILY',
      tableNumber:n,
      capacity:6
    });
  }

  for(let n = 1; n <= 3; n += 1){
    list.push({
      section:'BAR',
      tableNumber:n,
      capacity:2
    });
  }

  return list.map((t) => ({
    ...t,
    code:`${sectionPrefix(t.section)}-${t.tableNumber}`,
    status:'AVAILABLE'
  }));
};

const seedTables = async () => {
  await connectDB();

  const tables = makeTables();

  for(const t of tables){
    const existing = await Table.findOne({ code:t.code });
    if(existing) continue;

    await Table.create(t);
  }

  console.log('========================================');
  console.log(' Seed Tables Completed');
  console.log('========================================');

  process.exit(0);
};

seedTables().catch((error) => {
  console.error('Seed Tables Failed:', error?.message || error);
  process.exit(1);
});
