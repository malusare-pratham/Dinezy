import KOT from '../models/KOT.js';

import Table from '../models/Table.js';

/*
KOT SOCKET HANDLER
*/

const kotSocket = (io,socket) => {

  /*
  CREATE KOT
  */

  socket.on(
    'create-kot',

    async (data)=>{

      try{

        /*
        CREATE KOT
        */

        const newKOT =
          await KOT.create({

            tokenNumber:
              data.tokenNumber,

            tableNumber:
              data.tableNumber,

            captain:
              data.captain,

            customerName:
              data.customerName,

            items:data.items,

            totalAmount:
              data.totalAmount,

            status:'RECEIVED'

          });

        /*
        UPDATE TABLE STATUS
        */

        await Table.findOneAndUpdate(

          {
            tableNumber:
              data.tableNumber
          },

          {
            status:'RUNNING'
          }

        );

        /*
        SEND TO KITCHEN
        */

        io.emit(
          'receive-kot',
          newKOT
        );

        /*
        SEND TABLE UPDATE
        */

        io.emit(
          'table-updated',
          {

            tableNumber:
              data.tableNumber,

            status:'RUNNING'

          }

        );

        console.log(`
========================================
 NEW KOT GENERATED
 TOKEN : ${newKOT.tokenNumber}
 TABLE : ${data.tableNumber}
========================================
`);

      }
      catch(error){

        socket.emit(
          'kot-error',

          {
            message:error.message
          }

        );

      }

    }

  );

  /*
  UPDATE KOT STATUS
  */

  socket.on(

    'update-kot-status',

    async (data)=>{

      try{

        const updatedKOT =
          await KOT.findByIdAndUpdate(

            data.kotId,

            {
              status:data.status
            },

            {
              new:true
            }

          );

        /*
        BROADCAST STATUS
        */

        io.emit(

          'kot-status-updated',

          updatedKOT

        );

        console.log(`
========================================
 KOT STATUS UPDATED
 STATUS : ${data.status}
========================================
`);

      }
      catch(error){

        socket.emit(

          'kot-error',

          {
            message:error.message
          }

        );

      }

    }

  );

  /*
  READY TO SERVE
  */

  socket.on(

    'order-served',

    async (data)=>{

      try{

        const updatedKOT =
          await KOT.findByIdAndUpdate(

            data.kotId,

            {
              status:'COMPLETED'
            },

            {
              new:true
            }

          );

        io.emit(

          'order-completed',

          updatedKOT

        );

        console.log(`
========================================
 ORDER SERVED
========================================
`);

      }
      catch(error){

        socket.emit(

          'kot-error',

          {
            message:error.message
          }

        );

      }

    }

  );

  /*
  BILL GENERATED
  */

  socket.on(

    'bill-generated',

    async (data)=>{

      try{

        /*
        FREE TABLE
        */

        await Table.findOneAndUpdate(

          {
            tableNumber:
              data.tableNumber
          },

          {
            status:'AVAILABLE'
          }

        );

        /*
        SEND UPDATE
        */

        io.emit(

          'table-updated',

          {

            tableNumber:
              data.tableNumber,

            status:'AVAILABLE'

          }

        );

        console.log(`
========================================
 BILL GENERATED
 TABLE FREE NOW
========================================
`);

      }
      catch(error){

        socket.emit(

          'kot-error',

          {
            message:error.message
          }

        );

      }

    }

  );

  /*
  DISCONNECT
  */

  socket.on(
    'disconnect',

    ()=>{

      console.log(`
========================================
 SOCKET DISCONNECTED
 ${socket.id}
========================================
`);

    }

  );

};

export default kotSocket;
