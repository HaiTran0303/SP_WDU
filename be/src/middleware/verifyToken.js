const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // Lấy token từ header Authorization
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(403).json({ message: "No Authorization header provided" });
  }

  const tokenParts = authHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0].toLowerCase() !== "bearer") {
    return res.status(400).json({ message: "Invalid Authorization format. Use Bearer <token>" });
  }

  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Lưu thông tin user vào req.user
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message); // Log lỗi để debug
    let message = "Invalid token";
    if (error.name === "TokenExpiredError") {
      message = "Token has expired";
    } else if (error.name === "JsonWebTokenError") {
      message = "Invalid token signature";
    }
    return res.status(401).json({ message });
  }
};

module.exports = verifyToken;