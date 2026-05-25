import KOT from '../models/KOT.js';
import DailyKOTStats from '../models/DailyKOTStats.js';

import { getUtcRangeForISTDateKey } from '../utils/istDate.js';

export const rebuildDailyKOTStatsForDateKey = async (dateKey) => {
  const range = getUtcRangeForISTDateKey(dateKey);
  if(!range){
    throw new Error('Invalid dateKey. Expected YYYY-MM-DD');
  }

  const match = {
    createdAt:{
      $gte:range.start,
      $lt:range.end
    }
  };

  const grouped = await KOT.aggregate([
    { $match:match },
    {
      $group:{
        _id:'$status',
        count:{ $sum:1 }
      }
    }
  ]);

  const counts = {
    receivedCount:0,
    preparingCount:0,
    readyCount:0,
    completedCount:0
  };

  for(const row of grouped){
    const status = String(row?._id || '').toUpperCase();
    const c = Number(row?.count || 0);

    if(status === 'RECEIVED') counts.receivedCount = c;
    else if(status === 'PREPARING') counts.preparingCount = c;
    else if(status === 'READY') counts.readyCount = c;
    else if(status === 'COMPLETED') counts.completedCount = c;
  }

  const totalCount =
    counts.receivedCount +
    counts.preparingCount +
    counts.readyCount +
    counts.completedCount;

  const doc = await DailyKOTStats.findOneAndUpdate(
    { dateKey:String(dateKey) },
    {
      $set:{
        dateKey:String(dateKey),
        ...counts,
        totalCount
      }
    },
    {
      new:true,
      upsert:true
    }
  );

  return doc;
};

