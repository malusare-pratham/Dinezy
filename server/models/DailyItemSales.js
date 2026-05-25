import mongoose from 'mongoose';

const dailyItemSalesSchema = new mongoose.Schema(
  {
    dateKey:{
      type:String,
      required:true,
      unique:true,
      index:true
    },

    totalQuantity:{
      type:Number,
      default:0
    },

    totalAmount:{
      type:Number,
      default:0
    },

    categories:[
      {
        category:{ type:String, default:'Unknown' },
        quantity:{ type:Number, default:0 },
        amount:{ type:Number, default:0 }
      }
    ],

    items:[
      {
        menuItem:{ type:mongoose.Schema.Types.ObjectId, ref:'Menu', default:null },
        name:{ type:String, default:'' },
        category:{ type:String, default:'Unknown' },
        quantity:{ type:Number, default:0 },
        amount:{ type:Number, default:0 }
      }
    ],

    topItems:[
      {
        menuItem:{ type:mongoose.Schema.Types.ObjectId, ref:'Menu', default:null },
        name:{ type:String, default:'' },
        category:{ type:String, default:'Unknown' },
        quantity:{ type:Number, default:0 },
        amount:{ type:Number, default:0 }
      }
    ]
  },
  {
    timestamps:true
  }
);

const DailyItemSales = mongoose.model(
  'DailyItemSales',
  dailyItemSalesSchema
);

export default DailyItemSales;

