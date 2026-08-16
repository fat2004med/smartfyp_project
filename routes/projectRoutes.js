import express from "express";
import { 
    createProject, 
    getProjects, 
    getPublicProjects, 
    getProjectById, 
    updateProject, 
    deleteProject,
    addProjectFeedback,
    getMyProject,
    publishProject,
    approveProject,
    rejectProject,
    activateProject,
    completeProject
} from "../controller/projectController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getProjects);
router.get("/public", getPublicProjects);
router.get("/my-project", protect, getMyProject);
router.get("/:id", protect, getProjectById);
router.post("/", protect, authorize("HOD", "Admin", "Supervisor"), createProject);
router.put("/:id/publish", protect, authorize("Admin"), publishProject);
router.put("/:id/approve", protect, authorize("HOD", "Admin", "Supervisor"), approveProject);
router.put("/:id/reject", protect, authorize("HOD", "Admin", "Supervisor"), rejectProject);
router.put("/:id/activate", protect, authorize("HOD", "Admin", "Supervisor"), activateProject);
router.put("/:id/complete", protect, authorize("HOD", "Admin", "Supervisor", "Team Leader"), completeProject);
router.put("/:id", protect, authorize("HOD", "Admin", "Supervisor", "Team Leader"), updateProject);
router.put("/:id/feedback", protect, addProjectFeedback);
router.delete("/:id", protect, authorize("HOD", "Admin"), deleteProject);

export default router;
