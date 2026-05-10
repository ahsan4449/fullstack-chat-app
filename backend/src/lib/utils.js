import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const isProduction = process.env.NODE_ENV !== "development";

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true,       // prevent XSS attacks
    sameSite: isProduction ? "none" : "lax", // "none" needed for Capacitor APK cross-origin requests
    secure: isProduction, // "none" requires Secure=true
  });

  return token;
};