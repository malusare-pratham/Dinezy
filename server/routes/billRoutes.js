import express from 'express';

import {

  createBill,
  createBillFromTable,
  getBills

} from '../controllers/billController.js';

import authMiddleware from
'../middleware/authMiddleware.js';

import roleMiddleware from
'../middleware/roleMiddleware.js';

const router = express.Router();

/*
CREATE BILL
CAPTAIN + MANAGER
*/

router.post(

  '/create',

  authMiddleware,

  roleMiddleware(
    'CAPTAIN',
    'MANAGER'
  ),

  createBill

);

/*
CREATE BILL FROM TABLE (merge KOTs)
CAPTAIN + MANAGER
*/

router.post(

  '/create-from-table',

  authMiddleware,

  roleMiddleware(
    'CAPTAIN',
    'MANAGER'
  ),

  createBillFromTable

);

/*
GET ALL BILLS
*/

router.get(

  '/all',

  authMiddleware,

  getBills

);

export default router;
