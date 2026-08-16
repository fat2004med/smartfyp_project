import express from "express";
import { createUser, getUsers, getUserById, updateUser, deleteUser, toggleUserStatus, updateProfile, getSupervisors, resetUserPassword } from "../controller/userController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/profile", protect, (req, res) => res.json(req.user));
router.put("/profile/update", protect, updateProfile);
router.get("/supervisors", protect, getSupervisors);
router.post("/", protect, authorize("Admin", "HOD"), createUser);
router.get("/", protect, authorize("Admin", "HOD", "Supervisor", "Team Leader"), getUsers);
router.get("/:id", protect, authorize("Admin", "HOD"), getUserById);
router.put("/:id", protect, authorize("Admin", "HOD"), updateUser);
router.put("/:id/toggle-status", protect, authorize("Admin", "HOD"), toggleUserStatus);
router.post("/:id/reset-password", protect, authorize("Admin", "HOD"), resetUserPassword);
router.delete("/:id", protect, authorize("Admin", "HOD"), deleteUser);

export default router;
