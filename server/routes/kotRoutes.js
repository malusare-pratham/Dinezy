import express from 'express';

import {

  createKOT,
  getKOTs,
  getKOTsByTable,
  completeOrderForTable,
  closeBillForTable,
  updateKOTStatus

} from '../controllers/kotController.js';

import authMiddleware from
'../middleware/authMiddleware.js';

import roleMiddleware from
'../middleware/roleMiddleware.js';

const router = express.Router();

/*
CREATE KOT
CAPTAIN
*/

router.post(

  '/create',

  authMiddleware,

  roleMiddleware(
    'CAPTAIN'
  ),

  createKOT

);

/*
GET ALL KOTS
*/

router.get(

  '/all',

  authMiddleware,

  getKOTs

);

/*
GET KOTS BY TABLE
CAPTAIN + MANAGER
*/

router.get(

  '/by-table',

  authMiddleware,

  roleMiddleware(
    'CAPTAIN',
    'MANAGER'
  ),

  getKOTsByTable

);

/*
COMPLETE ORDER FOR TABLE (no payment)
CAPTAIN
*/

router.post(

  '/complete-order',

  authMiddleware,

  roleMiddleware(
    'CAPTAIN'
  ),

  completeOrderForTable

);

/*
CLOSE BILL FOR TABLE
CAPTAIN
*/

router.post(

  '/close-bill',

  authMiddleware,

  roleMiddleware(
    'CAPTAIN'
  ),

  closeBillForTable

);

/*
UPDATE KOT STATUS
KITCHEN
*/

router.put(

  '/update-status/:id',

  authMiddleware,

  roleMiddleware(
    'KITCHEN'
  ),

  updateKOTStatus

);

export default router;
