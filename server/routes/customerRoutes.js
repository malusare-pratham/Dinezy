import express from 'express';

import {
  upsertCustomer
} from '../controllers/customerController.js';

import authMiddleware from
'../middleware/authMiddleware.js';

import roleMiddleware from
'../middleware/roleMiddleware.js';

const router = express.Router();

/*
UPSERT CUSTOMER
CAPTAIN + MANAGER
*/

router.post(

  '/upsert',

  authMiddleware,

  roleMiddleware(
    'CAPTAIN',
    'MANAGER'
  ),

  upsertCustomer

);

export default router;

