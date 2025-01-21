import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
const appointmentSchema = new Schema(
    {
        docId: { type: String, required: true },
        userId: { type: String, required: true },
        slotDate: { type: String, required: true },
        slotTime: { type: String, required: true },
        userData: {type:Object, required:true},
        docData: {type:Object, required:true},
        amount: { type: Number, required: true },
        date: {type: Number, required: true},
        cancelled: {type: Boolean, default: false},
        payload: {type:Boolean, default: false},
        isCompleted: {type: Boolean, default: false}
    }
);
const appointmentModel = models.appointment || model("appointment", appointmentSchema);
export default appointmentModel;