import express from "express";
import { login, resetPassword, forgotPassword, updatePassword, getEmailStatus, testSendEmail } from "../controller/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.patch("/updatePassword", protect, updatePassword);
router.get("/email-status", getEmailStatus);
router.post("/test-email", protect, testSendEmail);

export default router;
