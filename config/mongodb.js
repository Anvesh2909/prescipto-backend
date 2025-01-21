import mongoose from "mongoose";

const connectDB = async ()=>{
    try{
        mongoose.connection.on('connected', () => {
            console.log('Connected to MongoDB');
        })
        await mongoose.connect(`${process.env.MONGODB_URI}/prescripto`);
    }catch (e){
        console.log("Not connected" + e);
    }
}
export default connectDB;