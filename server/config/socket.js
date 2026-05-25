import { Server } from 'socket.io';

let io;

const connectedUsers = new Map();

export const initSocket = (server) => {

  const rawCorsOrigins =
    process.env.CORS_ORIGINS || '';

  const corsOrigins =
    rawCorsOrigins
      .split(',')
      .map((o)=>o.trim())
      .filter(Boolean);

  io = new Server(server, {

    cors:{
      origin:corsOrigins.length > 0 ? corsOrigins : '*',
      methods:['GET','POST']
    }

  });

  io.on('connection',(socket)=>{

    console.log(`
========================================
 SOCKET CONNECTED : ${socket.id}
========================================
`);

    /*
    USER REGISTER
    */

    socket.on('register-user',(data)=>{

      const userId =
        data?.userId ? String(data.userId) : '';

      if(userId){
        socket.join(`user:${userId}`);
      }

      connectedUsers.set(

        socket.id,

        {
          userId:userId,
          role:data.role,
          name:data.name
        }

      );

      console.log(`
User Registered :
${data.name}
${data.role}
`);

    });

    /*
    NEW KOT GENERATED
    */

    socket.on('new-kot',(kotData)=>{

      io.emit(
        'receive-kot',
        kotData
      );

      console.log(`
New KOT Broadcasted
`);

    });

    /*
    KOT STATUS UPDATE
    */

    socket.on('update-kot-status',(data)=>{

      io.emit(
        'kot-status-updated',
        data
      );

      console.log(`
KOT Status Updated :
${data.status}
`);

    });

    /*
    TABLE STATUS UPDATE
    */

    socket.on('table-status-update',(data)=>{

      io.emit(
        'table-updated',
        data
      );

    });

    /*
    BILL GENERATED
    */

    socket.on('bill-generated',(billData)=>{

      io.emit(
        'new-bill-generated',
        billData
      );

      console.log(`
Bill Generated
`);

    });

    /*
    PAYMENT RECEIVED
    */

    socket.on('payment-collected',(paymentData)=>{

      io.emit(
        'payment-success',
        paymentData
      );

      console.log(`
Payment Collected
`);

    });

    /*
    NOTIFICATION
    */

    socket.on('send-notification',(notification)=>{

      io.emit(
        'receive-notification',
        notification
      );

    });

    /*
    DISCONNECT
    */

    socket.on('disconnect',()=>{

      connectedUsers.delete(socket.id);

      console.log(`
========================================
 SOCKET DISCONNECTED : ${socket.id}
========================================
`);

    });

  });

};

export const emitToUser = (
  userId,
  event,
  payload
) => {

  if(!io) return;
  if(!userId) return;

  io.to(`user:${String(userId)}`)
    .emit(event,payload);

};

export const getIO = () => {

  if(!io){

    throw new Error(
      'Socket.io Not Initialized'
    );

  }

  return io;
};

export const getConnectedUsers = () => {

  return connectedUsers;

};
