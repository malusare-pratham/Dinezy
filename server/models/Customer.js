import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(

  {

    name:{
      type:String
    },

    phone:{
      type:String,
      required:true,
      unique:true
    },

    visitCount:{
      type:Number,
      default:1
    },

    totalSpent:{
      type:Number,
      default:0
    },

    lastVisit:{
      type:Date,
      default:Date.now
    }

  },

  {
    timestamps:true
  }

);

const Customer = mongoose.model(
  'Customer',
  customerSchema
);

export default Customer;
