import express from 'express';

import cors from 'cors';

import dotenv from 'dotenv';

import morgan from 'morgan';

/*
ROUTES
*/

import authRoutes from './routes/authRoutes.js';

import menuRoutes from './routes/menuRoutes.js';

import kotRoutes from './routes/kotRoutes.js';

import tableRoutes from './routes/tableRoutes.js';

import billRoutes from './routes/billRoutes.js';

import reportRoutes from './routes/reportRoutes.js';

import customerRoutes from './routes/customerRoutes.js';

/*
MIDDLEWARE
*/

import errorMiddleware from
'./middleware/errorMiddleware.js';

/*
CONFIG
*/

dotenv.config();

/*
APP
*/

const app = express();

/*
MIDDLEWARES
*/

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
  extended:true
}));

app.use(morgan('dev'));

/*
API STATUS
*/

app.get('/',(req,res)=>{

  res.status(200).json({

    success:true,

    message:'Dinezy Server Running'

  });

});

/*
API ROUTES
*/

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/menu',
  menuRoutes
);

app.use(
  '/api/kot',
  kotRoutes
);

app.use(
  '/api/table',
  tableRoutes
);

app.use(
  '/api/bill',
  billRoutes
);

app.use(
  '/api/report',
  reportRoutes
);

app.use(
  '/api/customer',
  customerRoutes
);

/*
404 ROUTE
*/

app.use('*',(req,res)=>{

  res.status(404).json({

    success:false,

    message:'API Route Not Found'

  });

});

/*
ERROR HANDLER
*/

app.use(errorMiddleware);

export default app;
