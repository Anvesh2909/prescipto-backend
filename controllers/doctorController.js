import doctorModel from "../models/doctorModel.js";

const changeAvailability = async (req, res) => {
    try {
        const { docId } = req.body;
        const doctor = await doctorModel.findById(docId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }
        const docData = await doctorModel.findByIdAndUpdate(
            docId,
            { available: !doctor.available },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Availability changed successfully",
            available: docData.available
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            success: false,
            message: "Error changing availability",
            error: e.message
        });
    }
}
const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select(['-password', '-email']);
        res.json({success: true, doctors});
    } catch (e) {
        console.log(e);
        res.json({success: false, message: e.message});
    }
}
export { changeAvailability,doctorList };