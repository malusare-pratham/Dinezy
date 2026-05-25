import Table from '../models/Table.js';

const sectionPrefix = (section) => {
  switch(String(section || '').toUpperCase()){
    case 'HALL':
      return 'M';
    case 'AC':
      return 'A';
    case 'FAMILY':
      return 'F';
    case 'BAR':
      return 'B';
    default:
      return 'T';
  }
};

/*
CREATE TABLE
*/

export const createTable = async (
  req,
  res
) => {

  try{

    const payload = {
      ...req.body
    };

    if(payload.section && payload.tableNumber && !payload.code){
      payload.code = `${sectionPrefix(payload.section)}-${payload.tableNumber}`;
    }

    const table = await Table.create(payload);

    res.status(201).json({

      success:true,

      table

    });

  }
  catch(error){

    res.status(500).json({

      success:false,

      message:error.message

    });

  }

};

/*
GET ALL TABLES
*/

export const getTables = async (
  req,
  res
) => {

  try{

    const tables = await Table.find()
      .populate('activeCaptain','name role');

    res.status(200).json({

      success:true,

      tables

    });

  }
  catch(error){

    res.status(500).json({

      success:false,

      message:error.message

    });

  }

};

/*
UPDATE TABLE STATUS
*/

export const updateTableStatus =
async (
  req,
  res
) => {

  try{

    const table =
      await Table.findByIdAndUpdate(

        req.params.id,

        req.body,

        {
          new:true
        }

      );

    res.status(200).json({

      success:true,

      message:'Table Updated',

      table

    });

  }
  catch(error){

    res.status(500).json({

      success:false,

      message:error.message

    });

  }

};

/*
GET BILL DRAFT (manager-created items for bill preview)
*/

export const getBillDraft = async (
  req,
  res
) => {

  try{

    const table =
      await Table.findById(req.params.id)
        .select('billDraftItems billDraftUpdatedAt billDraftUpdatedBy');

    if(!table){
      return res.status(404).json({
        success:false,
        message:'Table not found'
      });
    }

    res.status(200).json({
      success:true,
      billDraftItems:table.billDraftItems || [],
      billDraftUpdatedAt:table.billDraftUpdatedAt || null,
      billDraftUpdatedBy:table.billDraftUpdatedBy || null
    });

  }
  catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }

};

/*
SET BILL DRAFT (persist manager-added items so captain sees them too)
*/

export const setBillDraft = async (
  req,
  res
) => {

  try{

    const items =
      Array.isArray(req.body?.items) ? req.body.items : [];

    const normalized = items
      .map((it) => ({
        name:String(it?.name || '').trim(),
        quantity:Math.max(1,Number(it?.quantity || 1)),
        price:Number(it?.price || 0),
        gst:Number(it?.gst ?? 0)
      }))
      .filter((it) => it.name);

    const table =
      await Table.findByIdAndUpdate(
        req.params.id,
        {
          billDraftItems:normalized,
          billDraftUpdatedAt:new Date(),
          billDraftUpdatedBy:req.user?._id || null
        },
        { new:true }
      ).select('billDraftItems billDraftUpdatedAt billDraftUpdatedBy');

    if(!table){
      return res.status(404).json({
        success:false,
        message:'Table not found'
      });
    }

    res.status(200).json({
      success:true,
      message:'Bill draft updated',
      billDraftItems:table.billDraftItems || []
    });

  }
  catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }

};
