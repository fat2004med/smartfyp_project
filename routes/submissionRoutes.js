import express from "express";
import { 
    createSubmission, 
    approveSubmission, 
    rejectSubmission,
    forwardSubmission,
    resubmitSubmission,
    getSubmissions, 
    getSubmissionById,
    addFeedback,
    getMyFeedbacks,
    markFeedbackRead,
    triggerPlagiarismCheck
} from "../controller/submissionController.js";
import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/", protect, authorize("Admin", "HOD", "Supervisor", "Team Leader", "Team Member"), upload.single("file"), createSubmission);
router.put("/:id/resubmit", protect, authorize("Team Leader", "Team Member"), upload.single("file"), resubmitSubmission);
router.get("/", protect, getSubmissions);
router.get("/my-feedback", protect, getMyFeedbacks);
router.patch("/feedback/:id/read", protect, markFeedbackRead);
router.get("/:id", protect, getSubmissionById);
router.post("/:id/plagiarism-check", protect, authorize("Admin", "HOD", "Supervisor", "Team Leader", "Team Member"), triggerPlagiarismCheck);
router.put("/:id/approve", protect, authorize("Team Leader", "Supervisor", "HOD", "Admin"), approveSubmission);
router.put("/:id/reject", protect, authorize("Team Leader", "Supervisor", "HOD", "Admin"), rejectSubmission);
router.put("/:id/forward", protect, authorize("Team Leader", "Supervisor", "HOD"), forwardSubmission);
router.post("/:id/feedback", protect, authorize("Team Leader", "Supervisor", "HOD", "Admin"), addFeedback);

export default router;
