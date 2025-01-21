import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
const doctorSchema = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    image: {type: String, required: true},
    speciality: {type: String, required: true},
    degree: {type: String, required: true},
    experience: {type: String, required: true},
    about: {type: String, required: true},
    fees: {type: Number, required: true},
    address: {type: String, required: true},
    available: {type: Boolean, default:true},
    date: {type: Date, required: true},
    slots_booked: {type:Object, default:{}}
},{minimize:false});
const doctorModel = models.doctor || model("doctor", doctorSchema);
export default doctorModel;