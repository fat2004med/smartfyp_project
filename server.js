console.log('🚀 Server starting...');
console.log('📝 NODE_ENV:', process.env.NODE_ENV);
console.log('📝 MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
const isRailway = process.env.RAILWAY === 'true' || process.env.RAILWAY_STATIC_URL;
console.log('🏗️  Running on Vercel:', isVercel);
console.log('🏗️  Running on Railway:', isRailway);

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import connectDB, { getDBStatus } from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import plagiarismRoutes from "./routes/plagiarismRoutes.js";
import recommender from "./utils/recommender.js";

dotenv.config();

recommender.train();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import User from "./models/User.js";
import Department from "./models/Department.js";
import Project from "./models/Project.js";
import Task from "./models/Task.js";
import Submission from "./models/Submission.js";
import Announcement from "./models/Announcement.js";
import Assignment from "./models/Assignment.js";
import Feedback from "./models/Feedback.js";
import Template from "./models/Template.js";
import SystemLog from "./models/SystemLog.js";

async function seedData() {
  try {
    const deptNames = ["Computer Science", "Software Engineering", "Information Technology", "Artificial Intelligence", "Cyber Security"];
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

    const commonPassword = "password123";
    const adminPassword = "adminp@ssword123";

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
      { name: "Test User", email: "test@test.com", password: "password", role: "Team Member", dept: csDept._id },
    ];

    const seededUsersRaw = {};
    const existingUsersCount = await User.countDocuments({});

    for (const u of usersToSeed) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        if (existingUsersCount === 0 || u.email === "fat2004med@gmail.com") {
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
        } else {
          console.log(`User ${u.email} was intentionally deleted, skipping recreation.`);
          continue;
        }
      } else {
        console.log(`User already exists, preserving accurate state and passwords for: ${u.email}`);
        if (u.email === "fat2004med@gmail.com" || u.email === "fatp2010210@gmail.com" || u.email === "shaheenabdulrahman@gmail.com") {
          user.isActive = true;
          user.password = u.password;
          await user.save();
          console.log(`✅ Ensured Admin account ${u.email} is active and password is in sync.`);
        }
      }
      seededUsersRaw[u.email] = user;
    }
    console.log(`All available seed users synchronized.`);

    const seededUsers = new Proxy(seededUsersRaw, {
      get(target, prop) {
        if (target[prop]) return target[prop];
        return target["fat2004med@gmail.com"] || { _id: null, name: "Fallback User", email: prop };
      }
    });

    if (seededUsers["hod_cs@smartfyp.com"] && csDept && typeof csDept.save === "function") {
      csDept.hod = seededUsers["hod_cs@smartfyp.com"]._id;
      await csDept.save();
    }
    if (seededUsers["hod@smartfyp.com"] && seDept && typeof seDept.save === "function") {
      seDept.hod = seededUsers["hod@smartfyp.com"]._id;
      await seDept.save();
    }

    const projects = [
      {
        title: "AI-Powered Smart FYP Tracker",
        description: "An automated system to manage the lifecycle of final year projects.",
        abstract: "Tracking FYPs is often manual and error-prone. This platform uses automated workflows...",
        department: csDept._id,
        supervisor: seededUsers["supervisor@smartfyp.com"]._id,
        teamLeader: seededUsers["leader@smartfyp.com"]._id,
        members: [seededUsers["leader@smartfyp.com"]._id, seededUsers["member@smartfyp.com"]._id],
        status: "Active",
        academicYear: "2024",
        year: 2024,
        batch: "2021-2025",
        isPublic: true,
        technologies: ["React", "Express", "Node.js", "AI"]
      },
      {
        title: "Blockchain Voting App",
        description: "Decentralized voting for university elections.",
        abstract: "Ensuring integrity in student elections is paramount...",
        department: seDept._id,
        supervisor: seededUsers["wilson@smartfyp.com"]._id,
        teamLeader: seededUsers["leader2@smartfyp.com"]._id,
        members: [seededUsers["leader2@smartfyp.com"]._id, seededUsers["member2@smartfyp.com"]._id],
        status: "Proposed",
        academicYear: "2024",
        year: 2024,
        batch: "2021-2025",
        isPublic: true,
        technologies: ["Solidity", "Web3.js", "React"]
      },
      {
        title: "IoT Smart Agriculture",
        description: "Monitoring soil moisture and temperature using IoT.",
        abstract: "Smart farming techniques can improve crop yield...",
        department: itDept._id,
        supervisor: seededUsers["supervisor@smartfyp.com"]._id,
        teamLeader: seededUsers["leader@smartfyp.com"]._id,
        members: [seededUsers["leader@smartfyp.com"]._id],
        status: "Proposed",
        academicYear: "2024",
        year: 2024,
        batch: "2021-2025",
        isPublic: false,
        technologies: ["Arduino", "Cloud Platforms"]
      },
      {
        title: "Distributed Cloud Storage",
        description: "Secure data storage across multiple nodes.",
        abstract: "Using IPFS and encryption for better privacy...",
        department: csDept._id,
        supervisor: seededUsers["supervisor@smartfyp.com"]._id,
        teamLeader: seededUsers["leader@smartfyp.com"]._id,
        members: [seededUsers["leader@smartfyp.com"]._id],
        status: "Active",
        academicYear: "2024",
        year: 2024,
        batch: "2021-2025",
        isPublic: true,
        technologies: ["Node.js", "IPFS", "Cryptography"]
      }
    ];

    const seededProjects = [];
    const existingProjectsCount = await Project.countDocuments({});
    for (const p of projects) {
      let project = await Project.findOne({ title: p.title });
      if (!project) {
        if (existingProjectsCount === 0) {
          project = await Project.create(p);
          console.log(`Project seeded: ${p.title}`);
        } else {
          console.log(`Seed project "${p.title}" was intentionally deleted, skipping recreation.`);
          continue;
        }
      } else {
        if ((!project.members || project.members.length === 0) && p.members) {
           project.members = p.members;
           await project.save();
           console.log(`Project updated with members: ${p.title}`);
        }
      }
      if (project) {
        seededProjects.push(project);
      }
    }

    const mainProject = seededProjects.find(p => p.title === "AI-Powered Smart FYP Tracker") || seededProjects[0] || await Project.findOne({});
    const seProject = seededProjects.find(p => p.title === "Blockchain Voting App") || seededProjects[1] || await Project.findOne({});
    const itProject = seededProjects.find(p => p.title === "IoT Smart Agriculture") || seededProjects[2] || await Project.findOne({});
    const dsProject = seededProjects.find(p => p.title === "Distributed Cloud Storage") || seededProjects[3] || await Project.findOne({});
    
    const taskCount = await Task.countDocuments({});
    if (taskCount < 80) {
      const extraTasks = [
        {
          project: mainProject._id,
          assignedBy: seededUsers["supervisor@smartfyp.com"]._id,
          assignee: seededUsers["leader@smartfyp.com"]._id,
          title: "System Architecture Design",
          description: "Create UML diagrams and ERD for the whole system.",
          priority: "High",
          status: "Completed",
          deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        {
          project: mainProject._id,
          assignedBy: seededUsers["leader@smartfyp.com"]._id,
          assignee: seededUsers["member@smartfyp.com"]._id,
          title: "Dashboard UI Mockups",
          description: "Design the initial screens for Admin and HOD using Figma.",
          priority: "Medium",
          status: "In Progress",
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        },
        {
          project: mainProject._id,
          assignedBy: seededUsers["leader@smartfyp.com"]._id,
          assignee: seededUsers["member@smartfyp.com"]._id,
          title: "Database Implementation",
          description: "Set up MongoDB collections and define schemas with Mongoose.",
          priority: "High",
          status: "Not Started",
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        },
        {
          project: mainProject._id,
          assignedBy: seededUsers["supervisor@smartfyp.com"]._id,
          assignee: seededUsers["leader@smartfyp.com"]._id,
          title: "AI Model Selection",
          description: "Compare Gemini 1.5 Pro vs GPT-4o for project extraction logic.",
          priority: "High",
          status: "Completed",
          deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          project: mainProject._id,
          assignedBy: seededUsers["leader@smartfyp.com"]._id,
          assignee: seededUsers["member@smartfyp.com"]._id,
          title: "Notification Socket.io Setup",
          description: "Implement real-time alerts for task assignments.",
          priority: "Medium",
          status: "In Progress",
          deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)
        },
        {
          project: seProject._id,
          assignedBy: seededUsers["wilson@smartfyp.com"]._id,
          assignee: seededUsers["leader2@smartfyp.com"]._id,
          title: "Literature Review",
          description: "Review existing blockchain voting systems and identify gaps.",
          priority: "Low",
          status: "Completed",
          deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        },
        {
          project: seProject._id,
          assignedBy: seededUsers["leader2@smartfyp.com"]._id,
          assignee: seededUsers["member2@smartfyp.com"]._id,
          title: "Smart Contract Development",
          description: "Implement core voting logic and security modifiers in Solidity.",
          priority: "High",
          status: "In Progress",
          deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)
        },
        {
          project: seProject._id,
          assignedBy: seededUsers["wilson@smartfyp.com"]._id,
          assignee: seededUsers["leader2@smartfyp.com"]._id,
          title: "Wallet Connector UI",
          description: "Implement Metamask browser extension connection logic.",
          priority: "Medium",
          status: "Completed",
          deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          project: seProject._id,
          assignedBy: seededUsers["leader2@smartfyp.com"]._id,
          assignee: seededUsers["member2@smartfyp.com"]._id,
          title: "Gas Optimization Study",
          description: "Reduce transaction costs for casting votes on Ethereum.",
          priority: "Medium",
          status: "Not Started",
          deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        },
        {
          project: itProject._id,
          assignedBy: seededUsers["supervisor@smartfyp.com"]._id,
          assignee: seededUsers["leader@smartfyp.com"]._id,
          title: "Sensor Integration",
          description: "Connect capacitive soil moisture sensors to ESP32 board.",
          priority: "Medium",
          status: "In Progress",
          deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
        },
        {
          project: itProject._id,
          assignedBy: seededUsers["supervisor@smartfyp.com"]._id,
          assignee: seededUsers["leader@smartfyp.com"]._id,
          title: "Cloud MQTT Hookup",
          description: "Set up HiveMQ Broker to receive data streams from ESP32.",
          priority: "High",
          status: "Not Started",
          deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)
        },
        {
          project: itProject._id,
          assignedBy: seededUsers["leader@smartfyp.com"]._id,
          assignee: seededUsers["member@smartfyp.com"]._id,
          title: "Power Supply Schematic",
          description: "Design solar charging circuit for outdoor deployment.",
          priority: "Medium",
          status: "Completed",
          deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        {
          project: dsProject._id,
          assignedBy: seededUsers["supervisor@smartfyp.com"]._id,
          assignee: seededUsers["leader@smartfyp.com"]._id,
          title: "IPFS Node Configuration",
          description: "Setting up private IPFS network for secure sharding.",
          priority: "High",
          status: "In Progress",
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        },
        {
          project: dsProject._id,
          assignedBy: seededUsers["supervisor@smartfyp.com"]._id,
          assignee: seededUsers["leader@smartfyp.com"]._id,
          title: "Encryption Layer Implementation",
          description: "Integrate AES-256 for data-at-rest before sharding.",
          priority: "High",
          status: "Not Started",
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        },
        {
          project: dsProject._id,
          assignedBy: seededUsers["leader@smartfyp.com"]._id,
          assignee: seededUsers["member@smartfyp.com"]._id,
          title: "Benchmarking Storage Nodes",
          description: "Test read/write latency across distributed nodes.",
          priority: "Low",
          status: "Not Started",
          deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
        }
      ];
      await Task.create(extraTasks);
      console.log(`${extraTasks.length} highly rich tasks seeded.`);
    }

    const subCount = await Submission.countDocuments({});
    if (subCount < 150) {
      const moreSubmissions = [
        {
          project: mainProject._id,
          submittedBy: seededUsers["leader@smartfyp.com"]._id,
          title: "Phase 1: Architecture Design",
          description: "Comprehensive system architecture diagram and component interaction document.",
          fileUrl: "https://example.com/arch_design.pdf",
          phase: "Design Document",
          status: "Approved",
          semester: 7,
          startDate: "Oct 01, 2024",
          endDate: "Oct 15, 2024"
        },
        {
          project: mainProject._id,
          submittedBy: seededUsers["leader@smartfyp.com"]._id,
          title: "FYP Proposal Final",
          description: "Full proposal document highlighting problem statement, objectives, and updated methodology.",
          fileUrl: "https://example.com/proposal_final.pdf",
          phase: "FYP Proposal",
          status: "Approved",
          semester: 7,
          startDate: "Sep 10, 2024",
          endDate: "Sep 25, 2024"
        },
        {
          project: seProject._id,
          submittedBy: seededUsers["leader2@smartfyp.com"]._id,
          title: "Blockchain Security Analysis",
          description: "Threat model for the decentralized voting app.",
          fileUrl: "https://example.com/security_audit.pdf",
          phase: "Design Document",
          status: "Approved",
          semester: 7,
          startDate: "Oct 05, 2024",
          endDate: "Oct 20, 2024"
        },
        {
          project: seProject._id,
          submittedBy: seededUsers["leader2@smartfyp.com"]._id,
          title: "User Journey Maps",
          description: "Detailed UX flow for voters, tally-masters, and election admins.",
          fileUrl: "https://example.com/ux_maps.pdf",
          phase: "Design Document",
          status: "Pending Supervisor",
          semester: 7,
          startDate: "Oct 15, 2024",
          endDate: "Oct 30, 2024"
        },
        {
          project: itProject._id,
          submittedBy: seededUsers["leader@smartfyp.com"]._id,
          title: "IoT Node Prototype Video",
          description: "Demonstration of the hardware setup reading sensor values.",
          fileUrl: "https://example.com/iot_demo.mp4",
          phase: "Implementation Report",
          status: "Approved",
          semester: 7,
          startDate: "Nov 01, 2024",
          endDate: "Nov 15, 2024"
        },
        {
          project: dsProject._id,
          submittedBy: seededUsers["leader@smartfyp.com"]._id,
          title: "Sharding Algorithm Specs",
          description: "Technical mathematical proof for the data distribution.",
          fileUrl: "https://example.com/sharding_math.pdf",
          phase: "SRS Document",
          status: "Approved",
          semester: 7,
          startDate: "Oct 20, 2024",
          endDate: "Nov 05, 2024"
        },
        {
          project: mainProject._id,
          submittedBy: seededUsers["member@smartfyp.com"]._id,
          title: "Backend API Test Results",
          description: "JUnit and Postman test logs for the first 10 core endpoints.",
          fileUrl: "https://example.com/api_tests.zip",
          phase: "Development",
          status: "Pending TL",
          semester: 7,
          startDate: "Nov 10, 2024",
          endDate: "Nov 25, 2024"
        },
        {
          project: seProject._id,
          submittedBy: seededUsers["member2@smartfyp.com"]._id,
          title: "Solidity Coverage Report",
          description: "Code coverage results for Smart Contract unit tests.",
          fileUrl: "https://example.com/cov_report.html",
          phase: "Development",
          status: "Pending TL",
          semester: 7,
          startDate: "Nov 15, 2024",
          endDate: "Nov 30, 2024"
        },
        {
          project: mainProject._id,
          submittedBy: seededUsers["leader@smartfyp.com"]._id,
          title: "FYP-2 Final Implementation",
          description: "Full backend and frontend code with integration tests.",
          fileUrl: "https://example.com/final_impl.zip",
          phase: "Implementation Report",
          status: "Pending Supervisor",
          semester: 8,
          startDate: "Feb 01, 2025",
          endDate: "Feb 28, 2025"
        },
        {
          project: seProject._id,
          submittedBy: seededUsers["leader2@smartfyp.com"]._id,
          title: "Mainnet Deployment Plan",
          description: "Steps for deploying to Ethereum Mainnet and smart contract verification.",
          fileUrl: "https://example.com/deploy_plan.pdf",
          phase: "Design",
          status: "Approved",
          semester: 8,
          startDate: "Mar 01, 2025",
          endDate: "Mar 15, 2025"
        }
      ];
      const newlySeededSubmissions = await Submission.create(moreSubmissions);
      console.log(`${newlySeededSubmissions.length} detailed submissions seeded.`);

      const feedbackCount = await Feedback.countDocuments();
      if (feedbackCount < 10) {
        await Feedback.create([
          {
            submission: newlySeededSubmissions[0]._id,
            author: seededUsers["supervisor@smartfyp.com"]._id,
            content: "Excellent detail in the ERD. Please add the many-to-many relationship for teams and tasks explicitly.",
            category: "Documentation",
            rating: 5,
            role: "Supervisor"
          },
          {
            submission: newlySeededSubmissions[2]._id,
            author: seededUsers["wilson@smartfyp.com"]._id,
            content: "The security analysis is good, but you missed the 'Reentrancy' guard in the vote function.",
            category: "Code",
            rating: 3,
            role: "Supervisor"
          },
          {
            submission: newlySeededSubmissions[3]._id,
            author: seededUsers["member2@smartfyp.com"]._id,
            content: "The voter journey looks a bit complex. Maybe we can simplify the Metamask signature prompt?",
            category: "Presentation",
            rating: 4,
            role: "Team Member"
          }
        ]);
        console.log("Varied feedback seeded for submissions.");
      }
    }

    const announceCount = await Announcement.countDocuments({});
    if (announceCount < 10) {
      const mainProject = await Project.findOne({ title: "AI-Powered Smart FYP Tracker" });
      await Announcement.create([
        {
          author: seededUsers["hod@smartfyp.com"]._id,
          title: "FYP Proposal Submission Deadline",
          description: "All groups are required to submit their finalized proposals by next Friday.",
          category: "Academic",
          priority: "High",
          targetRoles: ["Team Leader", "Team Member"],
          department: seDept._id
        },
        {
          author: seededUsers["fat2004med@gmail.com"]._id,
          title: "Portal Maintenance Notice",
          description: "The SmartFYP portal will be undergoing scheduled maintenance this Sunday.",
          category: "General",
          priority: "Medium",
          targetRoles: ["Admin", "HOD", "Supervisor", "Team Leader", "Team Member"]
        },
        {
          author: seededUsers["supervisor@smartfyp.com"]._id,
          title: "Weekly Progress Meeting",
          description: "Reminder: Our weekly sync-up for the AI-Powered FYP project is scheduled for Monday.",
          category: "General",
          priority: "High",
          targetRoles: ["Team Leader", "Team Member"],
          project: mainProject ? mainProject._id : null
        },
        {
          author: seededUsers["fat2004med@gmail.com"]._id,
          title: "New Documentation Resource",
          description: "A new LaTeX template for thesis writing has been uploaded.",
          category: "Academic",
          priority: "Low",
          targetRoles: ["Team Member", "Team Leader"]
        },
        {
          author: seededUsers["hod_cs@smartfyp.com"]._id,
          title: "Department Seminar Series",
          description: "Join us for a talk on 'The Future of AI in Research'.",
          category: "General",
          priority: "Medium",
          targetRoles: ["Admin", "HOD", "Supervisor", "Team Leader", "Team Member"]
        },
        {
          author: seededUsers["hod@smartfyp.com"]._id,
          title: "Mid-Year Review Schedule",
          description: "Mid-year presentations will start from next month.",
          category: "Academic",
          priority: "High",
          targetRoles: ["Supervisor", "Team Leader"],
          department: seDept._id
        },
        {
          author: seededUsers["fat2004med@gmail.com"]._id,
          title: "Annual Sports Week",
          description: "University sports week starts from Dec 15th.",
          category: "General",
          priority: "Low",
          targetRoles: ["Team Member", "Team Leader", "Supervisor"]
        }
      ]);
      console.log("Extended announcements seeded.");
    }

    const assignmentCount = await Assignment.countDocuments();
    if (assignmentCount < 20) {
      const assignments = [
        {
          title: "FYP Final Thesis Submission",
          description: "Submit the final version of your FYP documentation including all chapters.",
          creator: seededUsers["hod_cs@smartfyp.com"]._id,
          targetRoles: ["Team Leader", "Team Member"],
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), 
          status: "Pending"
        },
        {
          title: "Quarterly Evaluation Report",
          description: "HOD review of progress for the first quarter of the project lifecycle.",
          creator: seededUsers["hod@smartfyp.com"]._id,
          targetRoles: ["Supervisor"],
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          status: "Pending"
        },
        {
          title: "Mid-Term Presentation Slides",
          description: "Upload your presentation slides for the mid-term committee review.",
          creator: seededUsers["hod_cs@smartfyp.com"]._id,
          targetRoles: ["Team Leader"],
          endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          status: "Pending"
        },
        {
          title: "Code Repository URL",
          description: "Share your private GitHub/GitLab repository link with supervisors.",
          creator: seededUsers["supervisor@smartfyp.com"]._id,
          targetRoles: ["Team Leader", "Team Member"],
          endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          status: "Pending"
        },
        {
          title: "Weekly Logbook Signed Copies",
          description: "Scanned copies of your physical logbooks signed by the supervisor.",
          creator: seededUsers["supervisor@smartfyp.com"]._id,
          targetRoles: ["Team Member"],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: "Pending"
        }
      ];

      await Assignment.insertMany(assignments);
      console.log("Rich academic assignments seeded.");
    }

    const templateCount = await Template.countDocuments();
    if (templateCount < 5) {
      await Template.create([
        {
          uploader: seededUsers["fat2004med@gmail.com"]._id,
          title: "FYP Thesis Template (LaTeX)",
          description: "Official university LaTeX template for writing the final FYP report.",
          fileUrl: "/uploads/templates/thesis_v1.zip",
          scope: "College"
        },
        {
          uploader: seededUsers["hod@smartfyp.com"]._id,
          title: "SRS Standard Template (IEEE)",
          description: "Standard IEEE format for the Software Requirements Specification document.",
          fileUrl: "/uploads/templates/srs_ieee.docx",
          department: seDept._id,
          scope: "Department"
        },
        {
          uploader: seededUsers["supervisor@smartfyp.com"]._id,
          title: "Presentation Slide Sample",
          description: "Sample slide deck for the mid-term and final evaluations.",
          fileUrl: "/uploads/templates/slides_sample.pptx",
          department: csDept._id,
          scope: "Department"
        }
      ]);
      console.log("University templates seeded.");
    }

    const logCount = await SystemLog.countDocuments();
    if (logCount === 0) {
      await SystemLog.create([
        { level: "Info", event: "User Login", user: "fat2004med@gmail.com", details: "Successful login from Chrome", ip: "192.168.1.1" },
        { level: "Warning", event: "Failed Login Attempt", user: "unknown@user.com", details: "Invalid password attempt", ip: "45.12.33.102" },
        { level: "Info", event: "Department Created", user: "fat2004med@gmail.com", details: "New department added", ip: "192.168.1.1" },
        { level: "Error", event: "Database Connection Timeout", user: "System", details: "Primary database cluster unresponsive", ip: "Internal" }
      ]);
      console.log("Initial system logs seeded successfully.");
    }

    const memberUser = await User.findOne({ email: "member@smartfyp.com" });
    const devUser = await User.findOne({ email: "fat2004med@gmail.com" });
    const studentUsers = [memberUser, devUser].filter(u => u && (u.role === 'Team Member' || u.role === 'Team Leader'));
    
    if (studentUsers.length > 0) {
      let mainProj = await Project.findOne({ 
        $or: [
          { members: { $in: studentUsers.map(u => u._id) } }, 
          { teamLeader: { $in: studentUsers.map(u => u._id) } }
        ] 
      });
      
      if (!mainProj) {
        console.log("Creating missing test project for students...");
        const sup = await User.findOne({ role: "Supervisor" });
        mainProj = await Project.create({
          title: "AI-Powered Research System",
          description: "A system to help researchers find relevant papers.",
          teamLeader: studentUsers[0]._id,
          members: studentUsers.map(u => u._id),
          supervisor: sup?._id,
          status: "Approved",
          semester: 7
        });
      } else {
        let changed = false;
        studentUsers.forEach(u => {
          if (!mainProj.members.includes(u._id) && mainProj.teamLeader?.toString() !== u._id.toString()) {
            mainProj.members.push(u._id);
            changed = true;
          }
        });
        if (changed) await mainProj.save();
      }
      
      for (const u of studentUsers) {
        const mTaskCount = await Task.countDocuments({ project: mainProj._id, assignee: u._id });
        if (mTaskCount === 0) {
          await Task.create([
            {
              project: mainProj._id,
              title: `UI Polish & Responsiveness - ${u.name}`,
              description: "Work on the dashboard components to ensure they look great.",
              assignee: u._id,
              assignedBy: u._id,
              priority: "High",
              status: "Completed",
              deadline: new Date()
            },
            {
              project: mainProj._id,
              title: `Weekly Status Update - ${u.name}`,
              description: "Prepare the documentation for this week's progress.",
              assignee: u._id,
              assignedBy: u._id,
              priority: "Medium",
              status: "In Progress",
              deadline: new Date(Date.now() + 86400000 * 3)
            }
          ]);
        }
      }
      
      const subCount = await Submission.countDocuments({ project: mainProj._id });
      if (subCount === 0) {
        await Submission.create([
          {
            project: mainProj._id,
            title: "FYP Proposal",
            phase: "FYP Proposal",
            submittedBy: studentUsers[0]._id,
            fileUrl: "/uploads/samples/proposal.pdf",
            status: "Approved",
            semester: 7,
            grade: "A",
            score: 92,
            comment: "Initial project proposal defining objectives and scope.",
          },
          {
            project: mainProj._id,
            title: "Literature Review",
            phase: "Literature Review",
            submittedBy: studentUsers[0]._id,
            fileUrl: "/uploads/samples/lit_review.pdf",
            status: "Pending Supervisor",
            semester: 7,
            comment: "Detailed review of related works and existing systems.",
          }
        ]);
      }
    }

    console.log("Full seeding operation completed successfully.");
  } catch (error) {
    console.error("Seeding procedure failed:", error);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", true);

app.use(cors({
  origin: process.env.VITE_API_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/plagiarism", plagiarismRoutes);

app.post("/api/contact", async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "Please provide name, email, subject and message content." });
    }

    try {
      const ContactMessage = (await import("./models/ContactMessage.js")).default;
      await ContactMessage.create({ name, email, subject, message });
      console.log(`[Contact] Saved new message from ${email}`);
    } catch (err) {
      console.error("Database error saving contact message:", err.message);
    }

    try {
      const SystemLog = (await import("./models/SystemLog.js")).default;
      await SystemLog.create({
        level: "Info",
        event: "Contact Form Submitted",
        user: email || "Guest",
        details: `Topic: ${subject} | Submitter: ${name} (${email})`,
        ip: req.ip || "Internal"
      });
    } catch (err) {
      console.error("System logging error for contact message:", err.message);
    }

    try {
      const User = (await import("./models/User.js")).default;
      const Notification = (await import("./models/Notification.js")).default;
      const adminAccounts = await User.find({ role: "Admin" });
      if (adminAccounts && adminAccounts.length > 0) {
        for (const admin of adminAccounts) {
          await Notification.create({
            recipient: admin._id,
            title: `New Support Inquiry: ${subject}`,
            message: `${name} has submitted a support question.`,
            type: "General"
          });
        }
      }
    } catch (err) {
      console.error("Admin notification error for contact message:", err.message);
    }

    return res.status(201).json({
      success: true,
      message: "Your message has been sent successfully!"
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/recommendations", async (req, res, next) => {
  try {
    const { query, domain, techStack, limit } = req.body;
    
    if (!recommender.isTrained) {
      const trained = recommender.train();
      if (!trained) {
        return res.status(500).json({
          success: false,
          message: "Recommender system model is not yet trained."
        });
      }
    }

    const results = recommender.getRecommendations(
      query || "",
      domain || "",
      techStack || "",
      limit || 6
    );

    return res.status(200).json({
      success: true,
      data: results.recommendations,
      inferenceTimeMs: results.inferenceTimeMs,
      metrics: results.metrics
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/test", async (req, res) => {
  const dbConnected = getDBStatus();
  res.status(200).json({
    success: true,
    message: "Backend API is online!",
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || "development",
      hasMongoUri: Boolean(process.env.MONGODB_URI || process.env.MONGO_URI),
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      hasViteApiUrl: Boolean(process.env.VITE_API_URL),
    },
    database: {
      connected: dbConnected,
      status: dbConnected ? "Connected to MongoDB" : "Disconnected",
    },
  });
});

app.get("/api/health", async (req, res) => {
  let counts = { projects: 0, users: 0, depts: 0 };
  if (getDBStatus()) {
    try {
      counts.projects = await Project.countDocuments();
      counts.users = await User.countDocuments();
      counts.depts = await Department.countDocuments();
    } catch (e) {
      console.error("Health check failed:", e.message);
    }
  }
  res.json({ 
    status: "ok", 
    database: getDBStatus() ? "connected" : "disconnected",
    initializing: !getDBStatus(),
    counts
  });
});

async function startServer() {
  if (process.env.NODE_ENV === "production") {
    console.log("🔄 Connecting to database...");
    try {
      await connectDB();
      if (getDBStatus()) {
        console.log("✅ Database connected successfully!");
        await seedData();
      }
    } catch (err) {
      console.error("❌ Database connection failed:", err);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("🔄 Initializing Vite dev server...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.resolve(__dirname, "."),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    console.log(`📁 Serving static from: ${distPath}`);
    
    if (!fs.existsSync(distPath)) {
      console.error("❌ dist folder not found! Run 'npm run build' first.");
      
      app.get("*", (req, res) => {
        if (req.path.startsWith('/api')) return;
        res.status(200).send(`
          <html>
            <head><title>SmartFYP</title></head>
            <body>
              <h1>🚀 SmartFYP Application</h1>
              <p>Build not found. Please rebuild the application.</p>
              <p>API is available at <a href="/api/health">/api/health</a></p>
            </body>
          </html>
        `);
      });
    } else {
      app.use(express.static(distPath, {
        maxAge: '1d',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
          if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        }
      }));

      app.get("*", (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.use(errorHandler);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📝 Database status: ${getDBStatus() ? 'Connected' : 'Not connected'}`);
    console.log(`📝 API URL: http://localhost:${PORT}/api/health`);
  });
}

startServer();

export default app;
