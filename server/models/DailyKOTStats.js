import mongoose from 'mongoose';

const dailyKOTStatsSchema = new mongoose.Schema(
  {
    dateKey:{
      type:String,
      required:true,
      unique:true,
      index:true
    },

    receivedCount:{
      type:Number,
      default:0
    },

    preparingCount:{
      type:Number,
      default:0
    },

    readyCount:{
      type:Number,
      default:0
    },

    completedCount:{
      type:Number,
      default:0
    },

    totalCount:{
      type:Number,
      default:0
    }
  },
  {
    timestamps:true
  }
);

const DailyKOTStats = mongoose.model(
  'DailyKOTStats',
  dailyKOTStatsSchema
);

export default DailyKOTStats;

