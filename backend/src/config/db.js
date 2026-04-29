import mongoose from 'mongoose';

import { env } from "./env.js";

 const connectDB = async () =>{
    try{
        await mongoose.connect(env.MONGO_URI)
         console.log('MongoDB Atlas Connected Successfully')

    }catch(error){
        console.log("Error Connecting MongoDB Atlas", error.message);
        process.exit(1);
    }
}


export default connectDB;
