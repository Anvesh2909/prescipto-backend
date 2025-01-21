import jwt from "jsonwebtoken";
export const authUser = async (req, res, next) => {
    try {
        const {utoken} = req.headers;
        if (!utoken) {
            return res.status(401).json({ message: "No token provided" });
        }
        const decoded = jwt.verify(utoken, process.env.JWT_SECRET_KEY);
        req.body.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};