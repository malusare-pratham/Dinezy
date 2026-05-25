import Bill from '../models/Bill.js';
import KOT from '../models/KOT.js';
import Table from '../models/Table.js';

import { getIO } from '../config/socket.js';
import { getISTDateKey } from '../utils/istDate.js';
import { rebuildDailyItemSalesForDateKey } from '../services/dailyItemSalesService.js';

/*
CREATE BILL
*/

export const createBill = async (
  req,
  res
) => {

  try{

    const payload =
      req.body || {};

    // If client sent tableNumber but not tableCode, derive it.
    if(!payload.tableCode && payload.tableNumber != null){
      const tnum = Number(payload.tableNumber);
      const table =
        tnum
          ? await Table.findOne({ tableNumber:tnum })
          : null;

      payload.tableCode =
        table?.code || (tnum ? `T-${tnum}` : '');
    }

    const bill = await Bill.create(payload);

    res.status(201).json({

      success:true,

      message:'Bill Generated',

      bill

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
GET ALL BILLS
*/

export const getBills = async (
  req,
  res
) => {

  try{

    const bills = await Bill.find()
      .sort({createdAt:-1});

    res.status(200).json({

      success:true,

      bills

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
CREATE BILL FROM TABLE (merge all unbilled KOTs)
*/

export const createBillFromTable = async (
  req,
  res
) => {

  try{

    const {
      tableId,
      tableNumber,
      customerName,
      paymentMethod,
      paidAmount,
      items:itemsOverride
    } = req.body || {};

    const tid =
      tableId ? String(tableId) : '';

    const tnum =
      Number(tableNumber);

    if(!tid && !tnum){
      return res.status(400).json({
        success:false,
        message:'tableId or tableNumber is required'
      });
    }

    const table =
      tid
        ? await Table.findById(tid).populate('activeCaptain','name role')
        : await Table.findOne({ tableNumber:tnum }).populate('activeCaptain','name role');

    if(!table){
      return res.status(404).json({
        success:false,
        message:'Table not found'
      });
    }

    // If a CAPTAIN is calling this endpoint, ensure they can only bill their own table.
    // MANAGER can override for operational needs.
    const requesterRole =
      String(req.user?.role || '').toUpperCase();

    if(requesterRole === 'CAPTAIN' && table?.activeCaptain){
      const ownerId = String(table.activeCaptain?._id || table.activeCaptain || '');
      const requesterId = String(req.user?._id || '');
      if(ownerId && requesterId && ownerId !== requesterId){
        return res.status(403).json({
          success:false,
          message:'This table is currently assigned to another captain'
        });
      }
    }

    const method =
      String(paymentMethod || '').trim().toUpperCase();

    const allowed =
      new Set(['CASH','UPI','CARD','SPLIT']);

    if(!allowed.has(method)){
      return res.status(400).json({
        success:false,
        message:'paymentMethod must be CASH, UPI, CARD, or SPLIT'
      });
    }

    const kots = await KOT.find({
      ...(tid ? { table:tid } : { tableNumber:tnum }),
      isBilled:false
    }).sort({ createdAt:1 });

    if(!kots || kots.length === 0){
      return res.status(400).json({
        success:false,
        message:'No unbilled KOTs for this table'
      });
    }

    const hasOverride =
      Array.isArray(itemsOverride) && itemsOverride.length > 0;

    // Merge items (name + price + gst), unless client provides override items.
    const merged = new Map();
    let subTotal = 0;
    let gstAmount = 0;

    if(hasOverride){
      for(const it of itemsOverride){
        const name = String(it?.name || '').trim();
        const price = Number(it?.price || 0);
        const gst = Number(it?.gst ?? 0);
        const quantity = Number(it?.quantity || 0);

        if(!name || quantity <= 0) continue;

        const key = `${name}@@${price}@@${gst}`;
        const prev = merged.get(key);
        const nextQty = (prev?.quantity || 0) + quantity;

        merged.set(
          key,
          {
            name,
            quantity:nextQty,
            price
          }
        );
      }
    }
    else{
      for(const kot of kots){
        for(const it of (kot.items || [])){
          const name = String(it?.name || '').trim();
          const price = Number(it?.price || 0);
          const gst = Number(it?.gst ?? 0);
          const quantity = Number(it?.quantity || 0);

          if(!name || quantity <= 0) continue;

          const key = `${name}@@${price}@@${gst}`;
          const prev = merged.get(key);
          const nextQty = (prev?.quantity || 0) + quantity;

          merged.set(
            key,
            {
              name,
              quantity:nextQty,
              price
            }
          );
        }
      }
    }

    const items = Array.from(merged.values())
      .sort((a,b) => String(a.name).localeCompare(String(b.name)));

    for(const it of items){
      const line = Number(it.price || 0) * Number(it.quantity || 0);
      subTotal += line;
    }

    // GST computed from merged key (gst kept in key)
    for(const [key,val] of merged.entries()){
      const parts = String(key).split('@@');
      const gst = Number(parts[2] || 0);
      const line = Number(val.price || 0) * Number(val.quantity || 0);
      gstAmount += (line * gst / 100);
    }

    const totalAmount =
      subTotal + gstAmount;

    const paid =
      typeof paidAmount === 'number'
        ? Number(paidAmount)
        : totalAmount;

    const billNumber =
      `BILL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

    const billCaptainId =
      table?.activeCaptain?._id || req.user?._id;

    const billCaptainName =
      table?.activeCaptain?.name || req.user?.name || '';

    const bill = await Bill.create({
      billNumber,
      captain:billCaptainId,
      captainName:billCaptainName,
      tableCode:table?.code || (tnum ? `T-${tnum}` : ''),
      tableNumber:table?.tableNumber ?? tnum,
      customerName:customerName || '',
      items,
      subTotal,
      gstAmount,
      totalAmount,
      paymentMethod:method,
      paidAmount:paid,
      paymentStatus:'PAID'
    });

    const now = new Date();

    await KOT.updateMany(
      {
        _id:{ $in:kots.map((k) => k._id) }
      },
      {
        $set:{
          isBilled:true,
          billedAt:now,
          billId:bill._id,
          status:'COMPLETED',
          'statusTimestamps.completedAt':now
        }
      }
    );

    // Persist daily item sales report (IST day based on billedAt)
    try{
      const dayKey = getISTDateKey(now);
      if(dayKey){
        await rebuildDailyItemSalesForDateKey(dayKey);
      }
    }
    catch{
      // ignore reporting failure
    }

    const updatedTable =
      tid
        ? await Table.findByIdAndUpdate(
            tid,
            {
              status:'AVAILABLE',
              activeCaptain:null
            },
            { new:true }
          )
        : await Table.findOneAndUpdate(
            { tableNumber:tnum },
            {
              status:'AVAILABLE',
              activeCaptain:null
            },
            { new:true }
          );

    const io = getIO();

    if(updatedTable){
      io.emit(
        'table-updated',
        updatedTable
      );
    }

    res.status(201).json({
      success:true,
      message:'Bill Generated',
      bill
    });

  }
  catch(error){

    res.status(500).json({
      success:false,
      message:error.message
    });

  }

};
