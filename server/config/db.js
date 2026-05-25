import mongoose from 'mongoose';

const connectDB = async () => {

  try{

    mongoose.set('strictQuery', true);

    const connection = await mongoose.connect(

      process.env.MONGO_URI,

      {
        autoIndex:true
      }

    );

    console.log(`
========================================
 MongoDB Connected Successfully
 HOST : ${connection.connection.host}
 DATABASE : ${connection.connection.name}
========================================
`);

    mongoose.connection.on('connected',()=>{

      console.log('MongoDB Connection Active');

    });

    mongoose.connection.on('error',(error)=>{

      console.log(`
MongoDB Error : ${error.message}
`);

    });

    mongoose.connection.on('disconnected',()=>{

      console.log(`
MongoDB Disconnected
`);

    });

  }
  catch(error){

    console.log(`
========================================
 MongoDB Connection Failed
 ERROR : ${error.message}
========================================
`);

    process.exit(1);

  }

};

export default connectDB;