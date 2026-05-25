import Bill from '../models/Bill.js';

/*
TODAY SALES
*/

export const getTodaySales =
async () => {

  try{

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const bills = await Bill.find({

      createdAt:{
        $gte:today
      }

    });

    const totalSales =
      bills.reduce(

        (acc,bill)=>

          acc + bill.totalAmount,

        0

      );

    return {

      totalBills:
        bills.length,

      totalSales

    };

  }
  catch(error){

    throw new Error(
      error.message
    );

  }

};

/*
PAYMENT METHOD REPORT
*/

export const getPaymentReport =
async () => {

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

    const splitBills =
      await Bill.find({
        paymentMethod:'SPLIT'
      });

    return {

      cash:cashBills.length,

      upi:upiBills.length,

      card:cardBills.length,

      split:splitBills.length

    };

  }
  catch(error){

    throw new Error(
      error.message
    );

  }

};

/*
GST REPORT
*/

export const getGSTReport =
async () => {

  try{

    const bills = await Bill.find();

    const totalGST =
      bills.reduce(

        (acc,bill)=>

          acc + bill.gstAmount,

        0

      );

    return {

      totalGST

    };

  }
  catch(error){

    throw new Error(
      error.message
    );

  }

};

/*
TOP SELLING ITEMS
*/

export const getTopSellingItems =
async () => {

  try{

    const bills = await Bill.find();

    const itemMap = {};

    bills.forEach((bill)=>{

      bill.items.forEach((item)=>{

        if(itemMap[item.name]){

          itemMap[item.name] +=
            item.quantity;

        }
        else{

          itemMap[item.name] =
            item.quantity;

        }

      });

    });

    return itemMap;

  }
  catch(error){

    throw new Error(
      error.message
    );

  }

};