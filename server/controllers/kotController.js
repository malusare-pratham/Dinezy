import KOT from '../models/KOT.js';
import Menu from '../models/Menu.js';
import Table from '../models/Table.js';

import { emitToUser, getIO } from '../config/socket.js';
import { getISTDateKey } from '../utils/istDate.js';
import { rebuildDailyKOTStatsForDateKey } from '../services/dailyKotStatsService.js';

const canAssignTableToCaptain = async ({
  table,
  requesterId
}) => {
  if(!table) return { ok:false, reason:'Table not found' };
  if(!requesterId) return { ok:false, reason:'Unauthorized' };

  const status =
    String(table.status || '').toUpperCase();

  // If table is AVAILABLE, any captain can start it.
  if(status === 'AVAILABLE'){
    return { ok:true, ownerId:requesterId };
  }

  // If table has an active captain, only that captain can continue.
  if(table.activeCaptain){
    const ownerId = String(table.activeCaptain);
    if(ownerId === String(requesterId)){
      return { ok:true, ownerId };
    }
    return {
      ok:false,
      reason:'This table is currently assigned to another captain'
    };
  }

  // Backward compatibility / data-fix:
  // If table is not AVAILABLE but activeCaptain is missing, infer ownership
  // from existing unbilled KOTs to prevent another captain from hijacking.
  const existingKOT =
    await KOT.findOne({
      table:table._id,
      isBilled:false,
      captain:{ $ne:null }
    })
      .select('captain createdAt')
      .sort({ createdAt:1 });

  if(existingKOT?.captain){
    const inferredOwner = String(existingKOT.captain);
    if(inferredOwner !== String(requesterId)){
      return {
        ok:false,
        reason:'This table is currently assigned to another captain'
      };
    }
    return { ok:true, ownerId:inferredOwner };
  }

  // No active captain + no unbilled KOTs: allow requester to take over.
  return { ok:true, ownerId:requesterId };
};

/*
CREATE KOT
*/

export const createKOT = async (
  req,
  res
) => {

  try{

    const {
      tableId,
      tableNumber,
      customerName,
      items
    } = req.body || {};

    if(!tableNumber && !tableId){
      return res.status(400).json({
        success:false,
        message:'tableNumber or tableId is required'
      });
    }

    if(!Array.isArray(items) || items.length === 0){
      return res.status(400).json({
        success:false,
        message:'items are required'
      });
    }

    const normalized = items
      .map((i) => ({
        menuItem:i?.menuItem,
        quantity:Number(i?.quantity || 0),
        variant:typeof i?.variant === 'string' ? i.variant.trim() : ''
      }))
      .filter((i) => i.menuItem && i.quantity > 0);

    if(normalized.length === 0){
      return res.status(400).json({
        success:false,
        message:'Valid items are required'
      });
    }

    const menuIds =
      normalized.map((i) => i.menuItem);

    const menus =
      await Menu.find({ _id:{ $in:menuIds } });

    const menuMap = new Map(
      menus.map((m) => [String(m._id),m])
    );

    const kotItems = [];
    let totalAmount = 0;

    for(const entry of normalized){
      const menu =
        menuMap.get(String(entry.menuItem));

      if(!menu){
        return res.status(400).json({
          success:false,
          message:'Invalid menu item in order'
        });
      }

      const baseName = menu.name;
      const name =
        entry.variant
          ? `${baseName} - ${entry.variant}`
          : baseName;

      const price = Number(menu.price || 0);
      const gst = Number(menu.gst ?? 0);
      const quantity = entry.quantity;

      kotItems.push({
        menuItem:menu._id,
        name,
        quantity,
        price,
        gst
      });

      totalAmount += price * quantity;
    }

    const tokenNumber =
      `KOT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

    let table = null;

    if(tableId){
      table = await Table.findById(tableId);
    }
    if(!table && tableNumber){
      table = await Table.findOne({ tableNumber:Number(tableNumber) });
    }

    if(!table){
      return res.status(404).json({
        success:false,
        message:'Table not found'
      });
    }

    const requesterId =
      String(req.user?._id || '');

    const access =
      await canAssignTableToCaptain({
        table,
        requesterId
      });

    if(!access.ok){
      return res.status(403).json({
        success:false,
        message:access.reason || 'Access denied'
      });
    }

    const kot = await KOT.create({
      tokenNumber,
      table:table?._id,
      tableCode:table?.code || '',
      tableNumber:table?.tableNumber ?? Number(tableNumber),
      captain:req.user?._id,
      customerName:customerName || '',
      items:kotItems,
      status:'RECEIVED',
      statusTimestamps:{
        receivedAt:new Date()
      },
      totalAmount
    });

    // Keep daily stats persisted (IST day based on createdAt)
    try{
      const dayKey = getISTDateKey(kot?.createdAt || new Date());
      if(dayKey){
        await rebuildDailyKOTStatsForDateKey(dayKey);
      }
    }
    catch{
      // ignore stats failure
    }

    const updatedTable =
      await Table.findByIdAndUpdate(
        table._id,
        {
          status:'RUNNING',
          activeCaptain: access.ownerId || req.user?._id || null
        },
        { new:true }
      );

    const io = getIO();

    io.emit(
      'receive-kot',
      kot
    );

    if(updatedTable){
      io.emit(
        'table-updated',
        updatedTable
      );
    }

    res.status(201).json({

      success:true,

      message:'KOT Generated',

      kot

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
GET ALL KOT
*/

export const getKOTs = async (
  req,
  res
) => {

  try{

    const query = {};

    if(req.query.status){
      query.status = req.query.status;
    }

    if(req.query.captain){
      query.captain = req.query.captain;
    }

    if(req.query.tableNumber){
      query.tableNumber = Number(req.query.tableNumber);
    }

    const kots = await KOT.find(query)
      .populate('captain','name role')
      .sort({createdAt:-1});

    res.status(200).json({

      success:true,

      kots

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
GET KOT BY TABLE (optionally unbilled)
*/

export const getKOTsByTable = async (
  req,
  res
) => {

  try{

    const tableId =
      req.query.tableId ? String(req.query.tableId) : '';

    const tableNumber =
      Number(req.query.tableNumber);

    if(!tableId && !tableNumber){
      return res.status(400).json({
        success:false,
        message:'tableId or tableNumber is required'
      });
    }

    const query = {};

    if(tableId){
      query.table = tableId;
    }
    else{
      query.tableNumber = tableNumber;
    }

    if(String(req.query.unbilled || '').toLowerCase() === 'true'){
      query.isBilled = false;
    }

    const kots = await KOT.find(query)
      .sort({ createdAt:1 });

    res.status(200).json({
      success:true,
      kots
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
COMPLETE ORDER FOR TABLE (mark unbilled KOTs completed + set table billing)
*/

export const completeOrderForTable = async (
  req,
  res
) => {

  try{

    const {
      tableId,
      tableNumber
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

    const requesterId =
      String(req.user?._id || '');

    const table =
      tid
        ? await Table.findById(tid).select('status activeCaptain tableNumber')
        : await Table.findOne({ tableNumber:tnum }).select('status activeCaptain tableNumber');

    if(!table){
      return res.status(404).json({
        success:false,
        message:'Table not found'
      });
    }

    if(
      table?.activeCaptain &&
      String(table.activeCaptain) !== requesterId
    ){
      return res.status(403).json({
        success:false,
        message:'This table is currently assigned to another captain'
      });
    }

    const now = new Date();

    const updateResult = await KOT.updateMany(
      {
        ...(tid ? { table:tid } : { tableNumber:tnum }),
        isBilled:false
      },
      {
        $set:{
          status:'COMPLETED',
          'statusTimestamps.completedAt':now
        }
      }
    );

    // Update daily stats for "today" in IST (bulk operation)
    try{
      const dayKey = getISTDateKey(now);
      if(dayKey){
        await rebuildDailyKOTStatsForDateKey(dayKey);
      }
    }
    catch{
      // ignore stats failure
    }

    const updatedTable =
      tid
        ? await Table.findByIdAndUpdate(
            tid,
            { status:'BILLING' },
            { new:true }
          )
        : await Table.findOneAndUpdate(
            { tableNumber:tnum },
            { status:'BILLING' },
            { new:true }
          );

    const io = getIO();

    if(updatedTable){
      io.emit(
        'table-updated',
        updatedTable
      );
    }

    res.status(200).json({
      success:true,
      message:'Order completed',
      updatedCount:updateResult?.modifiedCount ?? 0,
      table:updatedTable
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
CLOSE BILL FOR TABLE (mark unbilled KOTs billed + free table)
*/

export const closeBillForTable = async (
  req,
  res
) => {

  try{

    const {
      tableId,
      tableNumber
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

    const requesterId =
      String(req.user?._id || '');

    const table =
      tid
        ? await Table.findById(tid).select('status activeCaptain tableNumber')
        : await Table.findOne({ tableNumber:tnum }).select('status activeCaptain tableNumber');

    if(!table){
      return res.status(404).json({
        success:false,
        message:'Table not found'
      });
    }

    if(
      table?.activeCaptain &&
      String(table.activeCaptain) !== requesterId
    ){
      return res.status(403).json({
        success:false,
        message:'This table is currently assigned to another captain'
      });
    }

    const now = new Date();

    const updateResult = await KOT.updateMany(
      {
        ...(tid ? { table:tid } : { tableNumber:tnum }),
        isBilled:false
      },
      {
        $set:{
          isBilled:true,
          billedAt:now
        }
      }
    );

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

    res.status(200).json({
      success:true,
      message:'Bill closed',
      updatedCount:updateResult?.modifiedCount ?? 0
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
UPDATE KOT STATUS
*/

export const updateKOTStatus =
async (
  req,
  res
) => {

  try{

    const {
      status
    } = req.body;

    if(!status){
      return res.status(400).json({
        success:false,
        message:'status is required'
      });
    }

    const now = new Date();
    const statusTimestamps = {};

    if(status === 'RECEIVED'){
      statusTimestamps['statusTimestamps.receivedAt'] = now;
    }
    if(status === 'PREPARING'){
      statusTimestamps['statusTimestamps.preparingAt'] = now;
    }
    if(status === 'READY'){
      statusTimestamps['statusTimestamps.readyAt'] = now;
    }
    if(status === 'COMPLETED'){
      statusTimestamps['statusTimestamps.completedAt'] = now;
    }

    const kot =
      await KOT.findByIdAndUpdate(

        req.params.id,

        {
          status,
          ...statusTimestamps
        },

        {
          new:true
        }

      );

    // Update daily stats (IST day based on kot.createdAt)
    try{
      const dayKey = getISTDateKey(kot?.createdAt || new Date());
      if(dayKey){
        await rebuildDailyKOTStatsForDateKey(dayKey);
      }
    }
    catch{
      // ignore stats failure
    }

    const io = getIO();

    io.emit(
      'kot-status-updated',
      kot
    );

    if(
      (status === 'PREPARING' || status === 'READY') &&
      kot?.captain
    ){
      const tableLabel =
        String(kot?.tableCode || '').trim() ||
        (kot?.tableNumber ? `T-${kot.tableNumber}` : 'Table');

      const message =
        status === 'PREPARING'
          ? `Table ${tableLabel} - KOT ${kot?.tokenNumber || ''} is now being prepared.`
          : `Table ${tableLabel} - KOT ${kot?.tokenNumber || ''} is ready to serve.`;

      emitToUser(
        kot.captain,
        'captain-notification',
        {
          type:'KOT_STATUS',
          status,
          kotId:kot?._id,
          tokenNumber:kot?.tokenNumber || '',
          tableCode:tableLabel,
          message,
          createdAt:new Date().toISOString()
        }
      );
    }

    res.status(200).json({

      success:true,

      message:'KOT Updated',

      kot

    });

  }
  catch(error){

    res.status(500).json({

      success:false,

      message:error.message

    });

  }

};
