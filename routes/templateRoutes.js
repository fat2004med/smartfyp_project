import express from "express";
import { createTemplate, getTemplates, deleteTemplate, updateTemplate } from "../controller/templateController.js";
import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/", protect, authorize("Admin", "HOD"), upload.single("file"), createTemplate);
router.get("/", protect, getTemplates);
router.put("/:id", protect, authorize("Admin", "HOD"), upload.single("file"), updateTemplate);
router.delete("/:id", protect, authorize("Admin", "HOD"), deleteTemplate);

export default router;
