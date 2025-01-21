import jwt from "jsonwebtoken";
export const authAdmin = async (req, res, next) => {
    try {
        const token = req.headers.token || req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (decoded.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};