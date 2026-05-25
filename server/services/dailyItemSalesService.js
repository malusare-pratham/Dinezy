import mongoose from 'mongoose';

import KOT from '../models/KOT.js';
import DailyItemSales from '../models/DailyItemSales.js';

import { getUtcRangeForISTDateKey } from '../utils/istDate.js';

export const rebuildDailyItemSalesForDateKey = async (dateKey) => {
  const range = getUtcRangeForISTDateKey(dateKey);
  if(!range){
    throw new Error('Invalid dateKey. Expected YYYY-MM-DD');
  }

  const match = {
    isBilled:true,
    billedAt:{
      $gte:range.start,
      $lt:range.end
    }
  };

  const rows = await KOT.aggregate([
    { $match:match },
    { $unwind:'$items' },
    {
      $project:{
        menuItem:'$items.menuItem',
        name:'$items.name',
        quantity:{ $ifNull:['$items.quantity',0] },
        price:{ $ifNull:['$items.price',0] }
      }
    },
    {
      $lookup:{
        from:'menus',
        localField:'menuItem',
        foreignField:'_id',
        as:'menu'
      }
    },
    {
      $addFields:{
        menu:{ $first:'$menu' },
        category:{
          $ifNull:[
            { $ifNull:[ { $first:'$menu.category' }, null ] },
            'Unknown'
          ]
        }
      }
    },
    {
      $addFields:{
        amount:{
          $multiply:[
            { $toDouble:'$price' },
            { $toDouble:'$quantity' }
          ]
        }
      }
    },
    {
      $group:{
        _id:{
          menuItem:'$menuItem',
          name:'$name',
          category:'$category'
        },
        quantity:{ $sum:{ $toDouble:'$quantity' } },
        amount:{ $sum:'$amount' }
      }
    },
    {
      $project:{
        _id:0,
        menuItem:'$_id.menuItem',
        name:'$_id.name',
        category:'$_id.category',
        quantity:1,
        amount:1
      }
    }
  ]);

  const items = rows
    .map((r) => ({
      menuItem:r.menuItem ? new mongoose.Types.ObjectId(r.menuItem) : null,
      name:String(r.name || '').trim(),
      category:String(r.category || 'Unknown').trim() || 'Unknown',
      quantity:Number(r.quantity || 0),
      amount:Number(r.amount || 0)
    }))
    .filter((r) => r.name && r.quantity > 0);

  items.sort((a,b) => (
    String(a.category).localeCompare(String(b.category)) ||
    String(a.name).localeCompare(String(b.name))
  ));

  const categoryMap = new Map();
  let totalQuantity = 0;
  let totalAmount = 0;

  for(const it of items){
    totalQuantity += Number(it.quantity || 0);
    totalAmount += Number(it.amount || 0);

    const key = String(it.category || 'Unknown') || 'Unknown';
    const prev = categoryMap.get(key) || { category:key, quantity:0, amount:0 };
    prev.quantity += Number(it.quantity || 0);
    prev.amount += Number(it.amount || 0);
    categoryMap.set(key, prev);
  }

  const categories = Array.from(categoryMap.values())
    .sort((a,b) => Number(b.quantity) - Number(a.quantity));

  const topItems = [...items]
    .sort((a,b) => (Number(b.quantity) - Number(a.quantity)) || (Number(b.amount) - Number(a.amount)))
    .slice(0,20);

  const doc = await DailyItemSales.findOneAndUpdate(
    { dateKey:String(dateKey) },
    {
      $set:{
        dateKey:String(dateKey),
        totalQuantity,
        totalAmount,
        categories,
        items,
        topItems
      }
    },
    {
      new:true,
      upsert:true
    }
  );

  return doc;
};

