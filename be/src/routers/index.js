const express = require("express");
const authRoutes = require("./authRoutes.js");
const userRoutes = require("./userRoutes.js");
const addressRoutes = require("./addressRoutes.js");
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/address", addressRoutes);

module.exports = router;
