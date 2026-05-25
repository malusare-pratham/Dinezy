import Customer from '../models/Customer.js';

/*
UPSERT CUSTOMER (by phone)
*/

export const upsertCustomer = async (
  req,
  res
) => {

  try{

    const {
      name,
      phone
    } = req.body || {};

    const normalizedPhone =
      String(phone || '')
        .replace(/\D/g,'')
        .trim();

    if(!normalizedPhone){
      return res.status(400).json({
        success:false,
        message:'phone is required'
      });
    }

    const normalizedName =
      String(name || '').trim();

    const existing =
      await Customer.findOne({
        phone:normalizedPhone
      });

    if(existing){
      if(normalizedName){
        existing.name = normalizedName;
      }
      existing.visitCount =
        Number(existing.visitCount || 0) + 1;
      existing.lastVisit = new Date();

      await existing.save();

      return res.status(200).json({
        success:true,
        message:'Customer updated',
        customer:existing
      });
    }

    const customer =
      await Customer.create({
        name:normalizedName,
        phone:normalizedPhone
      });

    res.status(201).json({
      success:true,
      message:'Customer created',
      customer
    });

  }
  catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }

};

