import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRoute from "./routes/doctorRoute.js";
import userRoute from "./routes/userRoute.js";

const app = express();

// Connect to MongoDB and Cloudinary
connectDB();
connectCloudinary();

// Middleware
app.use(cors());
app.use(express.json());

// API endpoints
app.use('/api/admin', adminRouter);
app.use('/api/doctor', doctorRoute);
app.use('/api/user', userRoute);

// Set the port dynamically using the environment variable
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
