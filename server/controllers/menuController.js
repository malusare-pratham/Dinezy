import Menu from '../models/Menu.js';

const getStatusFromError = (error) => {

  if(
    error?.name === 'ValidationError' ||
    error?.name === 'CastError'
  ){
    return 400;
  }

  return 500;
};

const normalizeSubCategories = (value) => {

  if(value == null){
    return undefined;
  }

  const raw =
    Array.isArray(value)
      ? value
      : [value];

  const cleaned = raw
    .map((v) => (
      typeof v === 'string'
        ? v.trim()
        : ''
    ))
    .filter(Boolean);

  if(cleaned.length === 0){
    return [];
  }

  return Array.from(new Set(cleaned));
};

const normalizeType = (value) => {

  if(typeof value !== 'string'){
    return value;
  }

  const v = value.trim().toUpperCase();

  if(v === 'JAIN'){
    return 'VEG';
  }

  return v;
};

const coerceSubCategories = (payload) => {

  if(payload.subCategories !== undefined){
    return payload;
  }

  if(payload.subCategory !== undefined){
    payload.subCategories = payload.subCategory;
    delete payload.subCategory;
    return payload;
  }

  if(payload.subcategories !== undefined){
    payload.subCategories = payload.subcategories;
    delete payload.subcategories;
    return payload;
  }

  return payload;
};

/*
CREATE MENU
*/

export const createMenu = async (
  req,
  res
) => {

  try{

    const payload = {
      ...req.body
    };

    coerceSubCategories(payload);

    if(!payload.name && payload.item){
      payload.name = payload.item;
      delete payload.item;
    }

    if(!payload.type && payload.diet){
      payload.type = payload.diet;
    }

    if(payload.type && !payload.diet){
      payload.diet = payload.type;
    }

    if(payload.type){
      payload.type = normalizeType(payload.type);
    }

    if(payload.subCategories !== undefined){
      payload.subCategories =
        normalizeSubCategories(payload.subCategories) || [];
    }

    const menu = await Menu.create(payload);

    res.status(201).json({

      success:true,

      message:'Menu Created',

      menu

    });

  }
  catch(error){

    res.status(getStatusFromError(error)).json({

      success:false,

      message:error.message

    });

  }

};

/*
GET ALL MENU
*/

export const getMenus = async (
  req,
  res
) => {

  try{

    const menus = await Menu.find();

    res.status(200).json({

      success:true,

      menus

    });

  }
  catch(error){

    res.status(500).json({

      success:false,

      message:error.message

    });

  }

};

/*
UPDATE MENU
*/

export const updateMenu = async (
  req,
  res
) => {

  try{

    const payload = {
      ...req.body
    };

    coerceSubCategories(payload);

    if(!payload.name && payload.item){
      payload.name = payload.item;
      delete payload.item;
    }

    if(!payload.type && payload.diet){
      payload.type = payload.diet;
    }

    if(payload.type && !payload.diet){
      payload.diet = payload.type;
    }

    if(payload.type){
      payload.type = normalizeType(payload.type);
    }

    if(payload.subCategories !== undefined){
      payload.subCategories =
        normalizeSubCategories(payload.subCategories) || [];
    }

    const menu = await Menu.findByIdAndUpdate(

      req.params.id,

      payload,

      {
        new:true,
        runValidators:true
      }

    );

    res.status(200).json({

      success:true,

      message:'Menu Updated',

      menu

    });

  }
  catch(error){

    res.status(getStatusFromError(error)).json({

      success:false,

      message:error.message

    });

  }

};

/*
DELETE MENU
*/

export const deleteMenu = async (
  req,
  res
) => {

  try{

    await Menu.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({

      success:true,

      message:'Menu Deleted'

    });

  }
  catch(error){

    res.status(500).json({

      success:false,

      message:error.message

    });

  }

};
