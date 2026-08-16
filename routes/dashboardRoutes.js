import express from "express";
import { getAdminStats, getHODStats, getSupervisorStats, getTeamStats, getSystemLogs, clearSystemLogs } from "../controller/dashboardController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/admin", protect, authorize("Admin"), getAdminStats);
router.get("/hod", protect, authorize("HOD"), getHODStats);
router.get("/supervisor", protect, authorize("Supervisor"), getSupervisorStats);
router.get("/team", protect, authorize("Team Leader", "Team Member"), getTeamStats);
router.get("/logs", protect, authorize("Admin"), getSystemLogs);
router.delete("/logs", protect, authorize("Admin"), clearSystemLogs);

export default router;
