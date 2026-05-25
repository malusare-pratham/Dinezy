import express from 'express';

import {

  todaySalesReport,
  paymentReport,
  dailyKOTStatsReport,
  dailyKOTItemsReport

} from '../controllers/reportController.js';

import authMiddleware from
'../middleware/authMiddleware.js';

import roleMiddleware from
'../middleware/roleMiddleware.js';

const router = express.Router();

/*
TODAY SALES REPORT
OWNER + MANAGER
*/

router.get(

  '/today-sales',

  authMiddleware,

  roleMiddleware(
    'OWNER',
    'MANAGER'
  ),

  todaySalesReport

);

/*
PAYMENT REPORT
OWNER + MANAGER
*/

router.get(

  '/payment-report',

  authMiddleware,

  roleMiddleware(
    'OWNER',
    'MANAGER'
  ),

  paymentReport

);

/*
DAILY KOT STATS
OWNER + MANAGER + KITCHEN
*/

router.get(

  '/kot-daily-stats',

  authMiddleware,

  roleMiddleware(
    'OWNER',
    'MANAGER',
    'KITCHEN'
  ),

  dailyKOTStatsReport

);

/*
DAILY ITEM SALES (billed orders)
OWNER + MANAGER + KITCHEN
*/

router.get(

  '/kot-daily-items',

  authMiddleware,

  roleMiddleware(
    'OWNER',
    'MANAGER',
    'KITCHEN'
  ),

  dailyKOTItemsReport

);

export default router;
