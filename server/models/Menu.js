import mongoose from 'mongoose';

const MENU_CATEGORIES = [
  'Starter',
  'Main Course',
  'Breads',
  'Rice & Biryani',
  'Colddrinks',
  'Desserts',
  'Breakfast'
];

const normalizeCategory = (value) => {

  if(typeof value !== 'string'){
    return value;
  }

  const input =
    value.trim().toLowerCase();

  const mapping = {
    'starter':'Starter',
    'starters':'Starter',

    'main course':'Main Course',
    'maincourse':'Main Course',

    'bread':'Breads',
    'breads':'Breads',

    'rice & biryani':'Rice & Biryani',
    'rice and biryani':'Rice & Biryani',
    'rice&biryani':'Rice & Biryani',
    'biryani':'Rice & Biryani',

    'cold drinks':'Colddrinks',
    'cold drink':'Colddrinks',
    'colddrinks':'Colddrinks',
    'cold-drinks':'Colddrinks',

    'dessert':'Desserts',
    'desserts':'Desserts',

    'breakfast':'Breakfast'
  };

  return mapping[input] || value.trim();
};

const menuSchema = new mongoose.Schema(

  {

    menuId:{
      type:String,
      unique:true,
      default:() => (
        `MENU-${Date.now()}-${Math.random().toString(36).slice(2,6)}`
      )
    },

    category:{
      type:String,
      trim:true,
      set:normalizeCategory,
      enum:MENU_CATEGORIES,
      required:true
    },

    name:{
      type:String,
      required:true
    },

    price:{
      type:Number,
      required:true
    },

    hsn:{
      type:String,
      trim:true,
      default:''
    },

    gst:{
      type:Number,
      default:5
    },

    diet:{
      type:String,
      enum:[
        'VEG',
        'NON-VEG',
        'JAIN'
      ],
      default:'VEG'
    },

    type:{
      type:String,

      enum:[
        'VEG',
        'NON-VEG'
      ],
      default:'VEG'
    },

    subCategories:{
      type:[String],
      default:[]
    },

    image:{
      type:String
    },

    isAvailable:{
      type:Boolean,
      default:true
    }

  },

  {
    timestamps:true
  }

);

const Menu = mongoose.model(
  'Menu',
  menuSchema
);

export default Menu;
