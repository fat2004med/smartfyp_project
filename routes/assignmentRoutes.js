import express from "express";
import { 
  getAssignments, 
  getPublishedAssignments,
  getAssignedToMeAssignments,
  createAssignment, 
  submitAssignment, 
  provideFeedback 
} from "../controller/assignmentController.js";
import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.get("/", getAssignments);
router.get("/published", getPublishedAssignments);
router.get("/assigned", getAssignedToMeAssignments);
router.post("/", authorize("Admin", "HOD", "Supervisor", "Team Leader"), upload.single("template"), createAssignment);
router.post("/:id/submit", upload.single("attachment"), submitAssignment);
router.post("/feedback", authorize("Admin", "HOD", "Supervisor", "Team Leader"), provideFeedback);
router.post("/:id/feedback", authorize("Admin", "HOD", "Supervisor", "Team Leader"), provideFeedback);

export default router;
