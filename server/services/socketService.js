import { getIO } from '../config/socket.js';

/*
SEND NEW KOT
*/

export const emitNewKOT = (
  kotData
) => {

  const io = getIO();

  io.emit(
    'receive-kot',
    kotData
  );

};

/*
UPDATE KOT STATUS
*/

export const emitKOTStatusUpdate = (
  kotData
) => {

  const io = getIO();

  io.emit(
    'kot-status-updated',
    kotData
  );

};

/*
TABLE STATUS UPDATE
*/

export const emitTableUpdate = (
  tableData
) => {

  const io = getIO();

  io.emit(
    'table-updated',
    tableData
  );

};

/*
NEW BILL GENERATED
*/

export const emitBillGenerated = (
  billData
) => {

  const io = getIO();

  io.emit(
    'bill-generated',
    billData
  );

};

/*
PAYMENT SUCCESS
*/

export const emitPaymentCollected = (
  paymentData
) => {

  const io = getIO();

  io.emit(
    'payment-collected',
    paymentData
  );

};

/*
SEND NOTIFICATION
*/

export const emitNotification = (
  notification
) => {

  const io = getIO();

  io.emit(
    'receive-notification',
    notification
  );

};