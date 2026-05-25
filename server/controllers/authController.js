import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';

/*
REGISTER USER
*/

export const registerUser = async (
  req,
  res
) => {

  try{

    const {
      name,
      email,
      password,
      role
    } = req.body;

    const existingUser = await User.findOne({
      email
    });

    if(existingUser){

      return res.status(400).json({
        success:false,
        message:'User Already Exists'
      });

    }

    const hashedPassword =
      await bcrypt.hash(password,10);

    const user = await User.create({

      name,
      email,

      password:hashedPassword,

      role

    });

    res.status(201).json({

      success:true,

      message:'User Registered',

      user

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
LOGIN USER
*/

export const loginUser = async (
  req,
  res
) => {

  try{

    const {
      email,
      password
    } = req.body;

    const user = await User.findOne({
      email
    });

    if(!user){

      return res.status(404).json({
        success:false,
        message:'User Not Found'
      });

    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if(!isMatch){

      return res.status(400).json({
        success:false,
        message:'Invalid Credentials'
      });

    }

    const token = jwt.sign(

      {
        id:user._id,
        role:user.role
      },

      process.env.JWT_SECRET,

      {
        expiresIn:'7d'
      }

    );

    res.status(200).json({

      success:true,

      message:'Login Success',

      token,

      user

    });

  }
  catch(error){

    res.status(500).json({

      success:false,

      message:error.message

    });

  }

};