import express from "express";
import { 
  createTask, 
  getTasks, 
  getTaskById, 
  updateTaskStatus, 
  updateTask, 
  deleteTask,
  submitTask,
  reviewTask,
  getTaskStats
} from "../controller/taskController.js";
import { protect, authorize } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/stats", protect, getTaskStats);
router.post("/", protect, authorize("Supervisor", "Team Leader", "Admin"), createTask);
router.get("/", protect, getTasks);
router.get("/:id", protect, getTaskById);
router.put("/:id/status", protect, updateTaskStatus);
router.put("/:id/submit", protect, upload.single('file'), submitTask);
router.put("/:id/review", protect, authorize("Supervisor", "Team Leader", "Admin"), reviewTask);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, deleteTask);

export default router;
