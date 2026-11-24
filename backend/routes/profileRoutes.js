const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
    getProfile,
    updateProfile,
    getAllUsers,
    updateUserStatus
} = require("../controllers/profileController");

// List all users
router.get("/", getAllUsers);

// GET Profile - Protected with Authentication
router.get("/profile", authMiddleware, getProfile);

// UPDATE Profile - Protected with Authentication
router.put("/profile", authMiddleware, updateProfile);

// UPDATE user status (block/activate)
router.put("/:id/status", updateUserStatus);

module.exports = router;
