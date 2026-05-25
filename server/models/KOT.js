import mongoose from 'mongoose';

const kotSchema = new mongoose.Schema(

  {

    tokenNumber:{
      type:String,
      required:true,
      default:() =>
        `KOT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`
    },

    table:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Table'
    },

    tableCode:{
      type:String,
      default:''
    },

    tableNumber:{
      type:Number,
      required:true
    },

    captain:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'User'
    },

    customerName:{
      type:String
    },

    items:[

      {

        menuItem:{
          type:mongoose.Schema.Types.ObjectId,
          ref:'Menu'
        },

        name:String,

        quantity:Number,

        price:Number,

        gst:{
          type:Number,
          default:0
        }

      }

    ],

    status:{
      type:String,

      enum:[
        'RECEIVED',
        'PREPARING',
        'READY',
        'COMPLETED'
      ],

      default:'RECEIVED'
    },

    isBilled:{
      type:Boolean,
      default:false
    },

    billedAt:{
      type:Date
    },

    billId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Bill'
    },

    statusTimestamps:{
      receivedAt:{
        type:Date
      },
      preparingAt:{
        type:Date
      },
      readyAt:{
        type:Date
      },
      completedAt:{
        type:Date
      }
    },

    totalAmount:{
      type:Number,
      default:0
    }

  },

  {
    timestamps:true
  }

);

const KOT = mongoose.model(
  'KOT',
  kotSchema
);

export default KOT;
