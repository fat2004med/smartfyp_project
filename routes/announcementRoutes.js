import express from "express";
import { createAnnouncement, getAnnouncements, getPublishedAnnouncements, getAnnouncementById, updateAnnouncement, deleteAnnouncement, getMyAnnouncements } from "../controller/announcementController.js";
import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/", protect, authorize("Admin", "HOD", "Supervisor", "Team Leader"), upload.single("attachment"), createAnnouncement);
router.get("/", protect, getAnnouncements);
router.get("/published", protect, getPublishedAnnouncements);
router.get("/my", protect, getMyAnnouncements);
router.get("/:id", protect, getAnnouncementById);
router.put("/:id", protect, authorize("Admin", "HOD", "Supervisor", "Team Leader"), updateAnnouncement);
router.delete("/:id", protect, authorize("Admin", "HOD", "Supervisor", "Team Leader"), deleteAnnouncement);

export default router;
