const roleMiddleware = (...roles) => {

  return (
    req,
    res,
    next
  ) => {

    /*
    USER ROLE CHECK
    */

    if(
      !roles.includes(req.user.role)
    ){

      return res.status(403).json({

        success:false,

        message:`
Access Denied :
Role ${req.user.role}
Not Authorized
`

      });

    }

    next();

  };

};

export default roleMiddleware;