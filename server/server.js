import http from 'http';

import dotenv from 'dotenv';

import app from './app.js';

import connectDB from './config/db.js';

import { initSocket } from './config/socket.js';

/*
CONFIG
*/

dotenv.config();

/*
PORT
*/

const PORT =
  process.env.PORT || 5000;

/*
START SERVER
*/

const startServer = async () => {

  try{

    /*
    DATABASE CONNECT
    */

    await connectDB();

    /*
    HTTP SERVER
    */

    const server =
      http.createServer(app);

    /*
    SOCKET INITIALIZE
    */

    initSocket(server);

    /*
    LISTEN SERVER
    */

    server.listen(PORT,()=>{

      console.log(`
========================================
 DINEZY SERVER STARTED
 PORT : ${PORT}
 MODE : DEVELOPMENT
========================================
`);

    });

  }
  catch(error){

    console.log(`
========================================
 SERVER FAILED
 ERROR : ${error.message}
========================================
`);

    process.exit(1);

  }

};

/*
RUN SERVER
*/

startServer();