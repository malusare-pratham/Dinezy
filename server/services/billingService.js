import Bill from '../models/Bill.js';

import Payment from '../models/Payment.js';
import Table from '../models/Table.js';

import {
  generateBillNumber
} from '../utils/generateBillNumber.js';

import {
  calculateGST
} from '../utils/calculateGST.js';

/*
CREATE BILL SERVICE
*/

export const createBillService =
async (
  data
) => {

  try{

    /*
    CALCULATE SUBTOTAL
    */

    const subTotal =
      data.items.reduce(

        (acc,item)=>

          acc + (
            item.price *
            item.quantity
          ),

        0

      );

    /*
    GST
    */

    const gstAmount =
      calculateGST(subTotal);

    /*
    FINAL TOTAL
    */

    const totalAmount =
      subTotal + gstAmount;

    /*
    GENERATE BILL NUMBER
    */

    const billNumber =
      generateBillNumber();

    /*
    CREATE BILL
    */

    let tableCode =
      typeof data.tableCode === 'string'
        ? data.tableCode.trim()
        : '';

    const tnum =
      data.tableNumber != null
        ? Number(data.tableNumber)
        : null;

    if(!tableCode && tnum){
      const table =
        await Table.findOne({ tableNumber:tnum });

      tableCode =
        table?.code || `T-${tnum}`;
    }

    const bill = await Bill.create({

      billNumber,

      tableCode,

      tableNumber:data.tableNumber,

      customerName:
        data.customerName,

      items:data.items,

      subTotal,

      gstAmount,

      totalAmount,

      paymentMethod:
        data.paymentMethod,

      paidAmount:
        data.paidAmount,

      paymentStatus:'PAID'

    });

    /*
    CREATE PAYMENT
    */

    await Payment.create({

      bill:bill._id,

      amount:totalAmount,

      paymentMethod:
        data.paymentMethod,

      transactionId:
        data.transactionId || '',

      collectedBy:
        data.collectedBy

    });

    return bill;

  }
  catch(error){

    throw new Error(
      error.message
    );

  }

};
