import validator from "validator";
import bcrypt from "bcrypt";
import {v2 as cloudinary} from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";

//add doctor
const addDoctor = async (req, res) => {
    try {
        const {name, email, password, speciality, degree, experience, about, fees, address} = req.body;
        const imageFile = req.file;

        if(!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address || !imageFile){
            return res.status(400).json({message:"All fields are required"});
        }
        if(!validator.isEmail(email)){
            return res.status(400).json({message:"Invalid email"});
        }
        if(password.length<8){
            return res.status(400).json({message:"Password must be at least 8 characters"});
        }

        //hashing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //upload
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type:"image"});
        const imageUrl = imageUpload.secure_url;

        // Handle address - ensure it's stored as a string
        let formattedAddress = address;
        if (typeof address === 'object') {
            formattedAddress = JSON.stringify(address);
        } else if (typeof address === 'string') {
            // If it's already a string, don't try to parse and stringify it again
            formattedAddress = address;
        }

        const doctorData = {
            name,
            email,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address: formattedAddress,  // Use the formatted address
            image: imageUrl,
            date: Date.now(),
        }

        const doctor = await doctorModel.create(doctorData);
        return res.status(200).json({message: "Doctor added successfully", doctor});
    } catch (e) {
        console.log("Error "+ e);
        return res.status(400).json({
            success: false,
            message: "Something went wrong",
            error: e.message
        });
    }
}

const loginAdmin = async (req,res) => {
    try{
        const {email,password} = req.body;
        console.log('Login attempt:', { email, expectedEmail: process.env.ADMIN_EMAIL });

        if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
            const token = jwt.sign(
                { email: email },
                process.env.JWT_SECRET_KEY,
                { expiresIn: '1d' }
            );
            console.log('Generated token:', token);
            res.json({success:true,message:"Login successful",token});
        }else{
            res.json({success:false,message:"Invalid credentials"});
        }
    }catch (e){
        console.log("Error "+ e);
        res.json({success:false,message:"Something went wrong"});
    }
}
const allDoctors = async (req,res)=>{
    try{
        const doctors = await doctorModel.find({}).select('-password');
        res.json({success:true,doctors});
    }catch (e){
        console.log(e);
        res.json({success:false,message:e.message})
    }
}
export {addDoctor,loginAdmin,allDoctors};