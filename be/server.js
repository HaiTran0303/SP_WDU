const express = require("express");
const connectDB = require("./config/db");
const router = require("./src/routers/index");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const authRoutes = require("./src/routers/authRoutes.js");
const userRoutes = require("./src/routers/userRoutes.js");
const addressRoutes = require("./src/routers/addressRoutes.js");
const productRoutes = require("./src/routers/productRoutes.js");
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use("/", router);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/address", addressRoutes);
router.use("/products", productRoutes)
const PORT = process.env.PORT || 9999;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`)
    await connectDB()
  });
