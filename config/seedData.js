import User from "../models/User.js";
import Department from "../models/Department.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Submission from "../models/Submission.js";
import Announcement from "../models/Announcement.js";
import Assignment from "../models/Assignment.js";
import Feedback from "../models/Feedback.js";
import Template from "../models/Template.js";
import SystemLog from "../models/SystemLog.js";

let isSeeding = false;
let isSeeded = false;

export async function seedData() {
  if (isSeeding || isSeeded) return;
  isSeeding = true;
  try {
    // 1. Seed Departments
    const deptNames = ["Computer Science", "Software Engineering", "Information Technology", "Artificial Intelligence", "Cyber security"];
    const depts = [];
    const existingDeptsCount = await Department.countDocuments({});
    
    for (const name of deptNames) {
      let dept = await Department.findOne({ name });
      if (!dept) {
        if (existingDeptsCount === 0) {
          dept = await Department.create({
            name,
            description: `Department of ${name} and related research fields.`
          });
          console.log(`Department seeded: ${name}`);
        } else {
          console.log(`Department ${name} was intentionally deleted, skipping recreation.`);
          dept = null;
        }
      }
      depts.push(dept);
    }

    const csDept = depts[0] || { _id: null };
    const seDept = depts[1] || { _id: null };
    const itDept = depts[2] || { _id: null };

    // 2. Seed Users
    const commonPassword = "Password@123";
    const adminPassword = "Password@123";

    const usersToSeed = [
      { name: "Global Admin", email: "fat2004med@gmail.com", password: adminPassword, role: "Admin" },
      { name: "User Admin", email: "fatp2010210@gmail.com", password: adminPassword, role: "Admin" },
      { name: "Shaheen Abdulrahman", email: "shaheenabdulrahman@gmail.com", password: adminPassword, role: "Admin" },
      { name: "Dr. Ahmed (CS HOD)", email: "hod_cs@smartfyp.com", password: commonPassword, role: "HOD", dept: csDept._id },
      { name: "Dr. Maria (SE HOD)", email: "hod@smartfyp.com", password: commonPassword, role: "HOD", dept: seDept._id },
      { name: "Prof. John (Supervisor)", email: "supervisor@smartfyp.com", password: commonPassword, role: "Supervisor", dept: csDept._id },
      { name: "Prof. Wilson (Supervisor)", email: "wilson@smartfyp.com", password: commonPassword, role: "Supervisor", dept: seDept._id },
      { name: "Alice Smith (Team Leader)", email: "leader@smartfyp.com", password: commonPassword, role: "Team Leader", dept: csDept._id },
      { name: "Bob Jones (Team Member)", email: "member@smartfyp.com", password: commonPassword, role: "Team Member", dept: csDept._id },
      { name: "Zain Ali (Team Leader)", email: "leader2@smartfyp.com", password: commonPassword, role: "Team Leader", dept: seDept._id },
      { name: "Sara Khan (Team Member)", email: "member2@smartfyp.com", password: commonPassword, role: "Team Member", dept: seDept._id },
      { name: "Test User", email: "test@test.com", password: commonPassword, role: "Team Member", dept: csDept._id },
    ];

    const existingUsersCount = await User.countDocuments({});

    for (const u of usersToSeed) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        if (existingUsersCount === 0 || u.email === "fat2004med@gmail.com" || u.email === "fatp2010210@gmail.com") {
          console.log(`Creating user: ${u.email} with role ${u.role}`);
          user = await User.create({
            name: u.name,
            email: u.email,
            password: u.password,
            role: u.role,
            department: u.dept,
            isFirstLogin: false,
            isActive: true
          });
          console.log(`✅ Seeded new user: ${u.email}`);
        }
      }
    }

    // 3. Seed sample projects if none exist
    const existingProjectsCount = await Project.countDocuments({});
    if (existingProjectsCount === 0) {
      const leaderUser = await User.findOne({ email: "leader@smartfyp.com" });
      const memberUser = await User.findOne({ email: "member@smartfyp.com" });
      const supUser = await User.findOne({ email: "supervisor@smartfyp.com" });

      if (leaderUser && supUser) {
        await Project.create({
          title: "AI-Powered Smart FYP Management System",
          abstract: "An intelligent platform for managing final year project lifecycles with plagiarism analysis, role-based workflows, and automated deadline tracking.",
          domain: "Artificial Intelligence & Web Engineering",
          techStack: ["React", "Node.js", "Express", "MongoDB", "Tailwind CSS"],
          department: csDept._id,
          supervisor: supUser._id,
          teamLeader: leaderUser._id,
          members: memberUser ? [memberUser._id] : [],
          status: "Completed",
          isPublic: true,
          academicYear: "2025-2026",
          grade: "A+",
          progress: 100
        });

        await Project.create({
          title: "Decentralized Medical Record Security Network",
          abstract: "A privacy-preserving healthcare storage protocol leveraging zero-knowledge proofs and role-based cryptographic access.",
          domain: "Cyber Security & Distributed Systems",
          techStack: ["Node.js", "Solidity", "React", "MongoDB"],
          department: csDept._id,
          supervisor: supUser._id,
          teamLeader: leaderUser._id,
          status: "Completed",
          isPublic: true,
          academicYear: "2025-2026",
          grade: "A",
          progress: 100
        });

        await Project.create({
          title: "Autonomous Agricultural Drone Crop Disease Detection",
          abstract: "Deep learning computer vision algorithm embedded on edge drone micro-controllers to identify early-stage plant blight and optimize irrigation.",
          domain: "Artificial Intelligence & IoT",
          techStack: ["Python", "TensorFlow", "React", "Node.js"],
          department: seDept._id || csDept._id,
          supervisor: supUser._id,
          teamLeader: leaderUser._id,
          status: "Published",
          isPublic: true,
          academicYear: "2024-2025",
          grade: "A",
          progress: 100
        });
        console.log("✅ Seeded initial public projects.");
      }
    }

    isSeeded = true;
    console.log("Seeding operation completed successfully.");
  } catch (error) {
    console.error("Seeding procedure note:", error.message);
  } finally {
    isSeeding = false;
  }
}

export default seedData;
