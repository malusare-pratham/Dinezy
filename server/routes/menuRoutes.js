import express from 'express';

import {

  createMenu,
  getMenus,
  updateMenu,
  deleteMenu

} from '../controllers/menuController.js';

import authMiddleware from
'../middleware/authMiddleware.js';

import roleMiddleware from
'../middleware/roleMiddleware.js';

const router = express.Router();

/*
CREATE MENU
OWNER + MANAGER
*/

router.post(

  '/create',

  authMiddleware,

  roleMiddleware(
    'OWNER',
    'MANAGER'
  ),

  createMenu

);

/*
GET ALL MENU
*/

router.get(

  '/all',

  authMiddleware,

  getMenus

);

/*
UPDATE MENU
OWNER + MANAGER
*/

router.put(

  '/update/:id',

  authMiddleware,

  roleMiddleware(
    'OWNER',
    'MANAGER'
  ),

  updateMenu

);

/*
DELETE MENU
OWNER + MANAGER
*/

router.delete(

  '/delete/:id',

  authMiddleware,

  roleMiddleware(
    'OWNER',
    'MANAGER'
  ),

  deleteMenu

);

export default router;
