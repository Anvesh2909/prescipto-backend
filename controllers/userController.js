import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import {v2 as cloudinary} from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import razorpay from "razorpay";
const registerUser = async (req, res) => {
    try{
        const {name,email,password} = req.body;
        if(!name || !email || !password){
            return res.json({success:false,message:"All fields are required"});
        }
        if(!validator.isEmail(email)){
            return res.json({success:false,message:"Invalid email"});
        }
        if(password.length<8){
            return res.json({success:false,message:"Password must be at least 8 characters"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userData = {name,email,password:hashedPassword};
        const newUser = await userModel.create(userData);
        const token = jwt.sign({id:newUser._id},process.env.JWT_SECRET_KEY,{expiresIn:'1d'});
        res.json({success:true,token});
    }catch (e) {
        console.log(e);
        res.json({success:false,message:e.message});
    }
}
const loginUser = async (req, res) => {
    try{
        const {email,password} = req.body;
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success:false,message:"User not found"});
        }
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.json({success:false,message:"Invalid credentials"});
        }
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET_KEY,{expiresIn:'1d'});
        res.json({success:true,token});
    }catch (e) {
        console.log(e);
    }
}
const getProfile = async (req, res) => {
    try{
        const {userId} = req.body;
        const userData = await userModel.findById(userId).select('-password');
        res.json({success:true,userData});
    }catch (e) {
        console.log(e);
        res.json({success:false,message:e.message});
    }
}
const updateProfile = async (req, res) => {
    try {
        const {userId, name, phone, address, dob, gender} = req.body;
        const imageFile = req.file;
        if(!userId) {
            return res.json({
                success: false,
                message: "User ID is required"
            });
        }
        const updateFields = {};
        if (name) updateFields.name = name;
        if (phone) updateFields.phone = phone;
        if (address) updateFields.address = address;
        if (dob) updateFields.dob = dob;
        if (gender) updateFields.gender = gender;
        if(imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
                resource_type: "image"
            });
            updateFields.image = imageUpload.secure_url;
        }
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            updateFields,
            { new: true, runValidators: true }
        );
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        return res.json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            success: false,
            message: "Error updating profile",
            error: e.message
        });
    }
};
const bookAppointment = async (req, res) => {
    try {
        const { userId, docId, date, time } = req.body;
        if (!userId || !docId || !date || !time) {
            return res.status(400).json({
                success: false,
                message: "All fields (userId, docId, date, time) are required"
            });
        }
        const doc = await doctorModel.findById(docId);
        if (!doc) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        if (!doc.available) {
            return res.status(400).json({
                success: false,
                message: "Doctor not available"
            });
        }

        const userData = await userModel.findById(userId).select('-password');
        if (!userData) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check slot availability
        let slots = { ...doc.slots_booked };
        if (slots[date]?.includes(time)) {
            return res.status(400).json({
                success: false,
                message: "Slot already booked"
            });
        }

        slots[date] = slots[date] || [];
        slots[date].push(time);

        const docDataToSend = {
            _id: doc._id,
            name: doc.name,
            specialization: doc.speciality,
            fees: doc.fees,
            available: doc.available,
            image: doc.image,
            address: {
                line1: doc.address?.line1,
                line2: doc.address?.line2
            }
        };

        const appointment = {
            userId,
            docId,
            slotDate: date,
            slotTime: time,
            userData,
            docData: docDataToSend,
            amount: doc.fees,
            date: Date.now()
        };

        const [newAppointment] = await Promise.all([
            appointmentModel.create(appointment),
            doctorModel.findByIdAndUpdate(docId,
                { slots_booked: slots },
                { new: true }
            )
        ]);

        return res.status(201).json({
            success: true,
            message: "Appointment booked successfully",
            appointment: newAppointment
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            success: false,
            message: "Error booking appointment",
            error: error.message
        });
    }
};
const listAppointment = async (req, res) => {
    try {
        const userId = req.body.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }
        const appointments = await appointmentModel.find({ userId });
        res.json({ success: true, appointments });
    } catch (error) {
        console.error('Error listing appointments:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const cancelAppointment = async (req, res) => {
    try{
        const userId = req.body.userId;
        const {appointmentId} = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);
        if(appointmentData.userId !== userId){
            return res.status(403).json({
                success: false,
                message: "You are not authorized to cancel this appointment"
            });
        }
        await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true},{new:true});
        const {docId,slotDate,slotTime} = appointmentData;
        const doctorData = await doctorModel.findById(docId);
        let slots_booked = doctorData.slots_booked;
        slots_booked[slotDate] = slots_booked[slotDate].filter((time) => time !== slotTime);
        await doctorModel.findByIdAndUpdate(docId,{slots_booked},{new:true});
        res.status(200).json({
            success: true,
            message: "Appointment cancelled successfully"
        });

    }catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
const razorPayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})
const paymentRazorPay = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        console.log('Appointment ID:', appointmentId);

        const appointmentData = await appointmentModel.findById(appointmentId);
        console.log('Appointment Data:', appointmentData);

        if(!appointmentData || appointmentData.cancelled) {
            return res.json({success: false, message: "Invalid appointment or Appointment Cancelled"});
        }

        const options = {
            amount: appointmentData.amount * 100,
            currency: process.env.CURRENCY || 'INR',
            receipt: appointmentId,
            payment_capture: 1
        };
        console.log('Razorpay Options:', options);

        const order = await razorPayInstance.orders.create(options);
        res.json({success: true, order});
    } catch (error) {
        console.error('Razorpay Error Details:', {
            message: error.message,
            stack: error.stack,
            details: error.response?.data
        });
        res.status(500).json({
            success: false,
            message: error.message,
            details: error.response?.data
        });
    }
}
export {registerUser,loginUser,getProfile, updateProfile,bookAppointment,listAppointment,cancelAppointment,paymentRazorPay};