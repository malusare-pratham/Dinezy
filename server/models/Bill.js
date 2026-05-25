import mongoose from 'mongoose';

const billSchema = new mongoose.Schema(

  {

    billNumber:{
      type:String,
      required:true,
      unique:true
    },

    captain:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'User'
    },

    captainName:{
      type:String,
      default:''
    },

    tableCode:{
      type:String,
      required:true,
      trim:true
    },

    // Kept for backward compatibility (older flows + reporting).
    // New UI/flows should prefer `tableCode`.
    tableNumber:{
      type:Number
    },

    customerName:{
      type:String
    },

    items:[

      {

        name:String,

        quantity:Number,

        price:Number

      }

    ],

    subTotal:{
      type:Number,
      required:true
    },

    gstAmount:{
      type:Number,
      required:true
    },

    totalAmount:{
      type:Number,
      required:true
    },

    paymentMethod:{
      type:String,

      enum:[
        'CASH',
        'UPI',
        'CARD',
        'SPLIT'
      ],

      required:true
    },

    paidAmount:{
      type:Number,
      required:true
    },

    paymentStatus:{
      type:String,

      enum:[
        'PENDING',
        'PAID'
      ],

      default:'PAID'
    }

  },

  {
    timestamps:true
  }

);

const Bill = mongoose.model(
  'Bill',
  billSchema
);

export default Bill;
