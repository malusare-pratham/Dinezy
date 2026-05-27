import Bill from '../models/Bill.js';
import DailyKOTStats from '../models/DailyKOTStats.js';
import DailyItemSales from '../models/DailyItemSales.js';

import { getISTDateKey } from '../utils/istDate.js';
import { getUtcRangeForISTDateKey } from '../utils/istDate.js';
import { rebuildDailyKOTStatsForDateKey } from '../services/dailyKotStatsService.js';
import { rebuildDailyItemSalesForDateKey } from '../services/dailyItemSalesService.js';

/*
TODAY SALES REPORT
*/

export const todaySalesReport =
async (
  req,
  res
) => {

  try{

    const dateKey =
      getISTDateKey(new Date());

    const range =
      getUtcRangeForISTDateKey(dateKey);

    if(!range){
      throw new Error('Failed to compute today range');
    }

    const bills = await Bill.find({

      createdAt:{
        $gte:range.start,
        $lt:range.end
      }

    });

    const totalSales =
      bills.reduce(

        (acc,bill)=>
          acc + bill.totalAmount,

        0

      );

    const totalTax =
      bills.reduce(
        (acc,bill)=>
          acc + bill.gstAmount,
        0
      );

    res.status(200).json({

      success:true,

      totalBills:bills.length,

      totalSales,

      totalTax

    });

  }
  catch(error){

    res.status(500).json({

      success:false,

      message:error.message

    });

  }

};

/*
PAYMENT METHOD REPORT
*/

export const paymentReport =
async (
  req,
  res
) => {

  try{

    const cashBills =
      await Bill.find({
        paymentMethod:'CASH'
      });

    const upiBills =
      await Bill.find({
        paymentMethod:'UPI'
      });

    const cardBills =
      await Bill.find({
        paymentMethod:'CARD'
      });

    res.status(200).json({

      success:true,

      cash:cashBills.length,

      upi:upiBills.length,

      card:cardBills.length

    });

  }
  catch(error){

    res.status(500).json({

      success:false,

      message:error.message

    });

  }

};

/*
DAILY KOT STATS (IST dayKey)
OWNER + MANAGER + KITCHEN
*/

export const dailyKOTStatsReport =
async (
  req,
  res
) => {

  try{

    const dateKeyRaw =
      String(req.query?.dateKey || '').trim();

    const dateKey =
      dateKeyRaw || getISTDateKey(new Date());

    let doc =
      await DailyKOTStats.findOne({ dateKey }).lean();

    if(!doc){
      const rebuilt = await rebuildDailyKOTStatsForDateKey(dateKey);
      doc = rebuilt?.toObject?.() || rebuilt;
    }

    res.status(200).json({
      success:true,
      dateKey,
      stats:doc || {
        dateKey,
        receivedCount:0,
        preparingCount:0,
        readyCount:0,
        completedCount:0,
        totalCount:0
      }
    });

  }
  catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }

};

/*
DAILY ITEM SALES (IST dayKey, billed orders only)
OWNER + MANAGER + KITCHEN
*/

export const dailyKOTItemsReport =
async (
  req,
  res
) => {

  try{

    const dateKeyRaw =
      String(req.query?.dateKey || '').trim();

    const dateKey =
      dateKeyRaw || getISTDateKey(new Date());

    let doc =
      await DailyItemSales.findOne({ dateKey }).lean();

    if(!doc){
      const rebuilt = await rebuildDailyItemSalesForDateKey(dateKey);
      doc = rebuilt?.toObject?.() || rebuilt;
    }

    res.status(200).json({
      success:true,
      dateKey,
      report:doc || {
        dateKey,
        totalQuantity:0,
        totalAmount:0,
        categories:[],
        items:[],
        topItems:[]
      }
    });

  }
  catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }

};
