import express from "express";
import { createDepartment, getDepartments, getDepartmentById, updateDepartment, deleteDepartment, toggleDepartmentStatus } from "../controller/departmentController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getDepartments);
router.get("/:id", getDepartmentById);
router.post("/", protect, authorize("Admin"), createDepartment);
router.put("/:id", protect, authorize("Admin"), updateDepartment);
router.patch("/:id/toggle-status", protect, authorize("Admin"), toggleDepartmentStatus);
router.delete("/:id", protect, authorize("Admin"), deleteDepartment);

export default router;
