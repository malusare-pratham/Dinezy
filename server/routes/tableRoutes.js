import express from 'express';

import {

  createTable,
  getTables,
  updateTableStatus,
  getBillDraft,
  setBillDraft

} from '../controllers/tableController.js';

import authMiddleware from
'../middleware/authMiddleware.js';

import roleMiddleware from
'../middleware/roleMiddleware.js';

const router = express.Router();

/*
CREATE TABLE
OWNER + MANAGER
*/

router.post(

  '/create',

  authMiddleware,

  roleMiddleware(
    'OWNER',
    'MANAGER'
  ),

  createTable

);

/*
GET ALL TABLES
*/

router.get(

  '/all',

  authMiddleware,

  getTables

);

/*
UPDATE TABLE STATUS
*/

router.put(

  '/update/:id',

  authMiddleware,

  updateTableStatus

);

/*
BILL DRAFT (MANAGER + CAPTAIN)
*/

router.get(
  '/bill-draft/:id',
  authMiddleware,
  roleMiddleware(
    'MANAGER',
    'CAPTAIN'
  ),
  getBillDraft
);

router.put(
  '/bill-draft/:id',
  authMiddleware,
  roleMiddleware(
    'MANAGER',
    'CAPTAIN'
  ),
  setBillDraft
);

export default router;
