const errorMiddleware = (
  err,
  req,
  res,
  next
) => {

  console.log(`
========================================
 SERVER ERROR
========================================
`);

  console.log(err);

  /*
  MONGODB INVALID OBJECT ID
  */

  if(err.name === 'CastError'){

    return res.status(400).json({

      success:false,

      message:'Invalid ID'

    });

  }

  /*
  DUPLICATE KEY ERROR
  */

  if(err.code === 11000){

    return res.status(400).json({

      success:false,

      message:'Duplicate Field Value'

    });

  }

  /*
  VALIDATION ERROR
  */

  if(err.name === 'ValidationError'){

    const messages =
      Object.values(err.errors).map(
        val => val.message
      );

    return res.status(400).json({

      success:false,

      message:messages

    });

  }

  /*
  DEFAULT ERROR
  */

  return res.status(500).json({

    success:false,

    message:err.message ||
      'Internal Server Error'

  });

};

export default errorMiddleware;