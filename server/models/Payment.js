import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(

  {

    bill:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Bill'
    },

    amount:{
      type:Number,
      required:true
    },

    paymentMethod:{
      type:String,

      enum:[
        'CASH',
        'UPI',
        'CARD'
      ],

      required:true
    },

    transactionId:{
      type:String
    },

    collectedBy:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'User'
    }

  },

  {
    timestamps:true
  }

);

const Payment = mongoose.model(
  'Payment',
  paymentSchema
);

export default Payment;