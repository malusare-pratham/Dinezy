import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(

  {

    code:{
      type:String,
      required:true,
      unique:true,
      trim:true
    },

    tableNumber:{
      type:Number,
      required:true,
      index:true
    },

    section:{
      type:String,

      enum:[
        'AC',
        'HALL',
        'FAMILY',
        'BAR'
      ],

      required:true
    },

    capacity:{
      type:Number,
      required:true
    },

    status:{
      type:String,

      enum:[
        'AVAILABLE',
        'OCCUPIED',
        'RUNNING',
        'BILLING'
      ],

      default:'AVAILABLE'
    },

    activeCaptain:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'User',
      default:null
    },

    billDraftItems:[
      {
        name:{ type:String, trim:true },
        quantity:{ type:Number, default:1 },
        price:{ type:Number, default:0 },
        gst:{ type:Number, default:0 }
      }
    ],

    billDraftUpdatedAt:{
      type:Date,
      default:null
    },

    billDraftUpdatedBy:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'User',
      default:null
    }

  },

  {
    timestamps:true
  }

);

tableSchema.index(
  {
    section:1,
    tableNumber:1
  },
  {
    unique:true
  }
);

const Table = mongoose.model(
  'Table',
  tableSchema
);

export default Table;
