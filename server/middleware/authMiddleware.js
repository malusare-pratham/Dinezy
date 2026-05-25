import jwt from 'jsonwebtoken';

import User from '../models/User.js';

const authMiddleware = async (
  req,
  res,
  next
) => {

  try{

    let token;

    /*
    CHECK TOKEN
    */

    if(

      req.headers.authorization &&

      req.headers.authorization.startsWith(
        'Bearer'
      )

    ){

      token =
        req.headers.authorization.split(
          ' '
        )[1];

    }

    /*
    TOKEN NOT FOUND
    */

    if(!token){

      return res.status(401).json({

        success:false,

        message:'Unauthorized Access'

      });

    }

    /*
    VERIFY TOKEN
    */

    const decoded = jwt.verify(

      token,

      process.env.JWT_SECRET

    );

    /*
    FIND USER
    */

    const user = await User.findById(
      decoded.id
    ).select('-password');

    if(!user){

      return res.status(404).json({

        success:false,

        message:'User Not Found'

      });

    }

    /*
    ATTACH USER
    */

    req.user = user;

    next();

  }
  catch(error){

    return res.status(401).json({

      success:false,

      message:'Invalid Token',

      error:error.message

    });

  }

};

export default authMiddleware;