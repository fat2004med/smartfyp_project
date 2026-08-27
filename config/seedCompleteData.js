import User from "../models/User.js";
import Department from "../models/Department.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Notification from "../models/Notification.js";
import Announcement from "../models/Announcement.js";

export async function seedCompleteData() {
  try {
    console.log("🌱 Starting complete test data seeding verification...");

    // 1. Seed or find Departments
    const deptConfigs = [
      { name: "Computer Science", description: "Department of Computer Science & Software Systems" },
      { name: "Software Engineering", description: "Department of Software Engineering & Architecture" },
      { name: "Artificial Intelligence & Data Science", description: "Department of Artificial Intelligence & Machine Learning" },
      { name: "Cyber Security & Information Assurance", description: "Department of Cyber Security & Cryptography" },
      { name: "Electrical & Electronics Engineering", description: "Department of Electrical & Embedded Systems" }
    ];

    const departmentMap = {};
    for (const d of deptConfigs) {
      let dept = await Department.findOne({ name: d.name });
      if (!dept) {
        dept = await Department.create(d);
        console.log(`✅ Seeded Department: ${d.name}`);
      }
      departmentMap[d.name] = dept;
    }

    const defaultPassword = "password123";
    const adminPassword = "adminp@ssword123";

    // 2. Seed or find Key Faculty and Admin Users
    const facultyUsersData = [
      {
        name: "Global Admin",
        email: "fat2004med@gmail.com",
        password: adminPassword,
        role: "Admin",
        isFirstLogin: false,
        isActive: true,
        phone: "+92-300-0000001",
        designation: "System Administrator"
      },
      {
        name: "Dr. John Doe (Admin)",
        email: "admin@smartfyp.edu",
        password: defaultPassword,
        role: "Admin",
        isFirstLogin: false,
        isActive: true,
        phone: "+92-300-8877665",
        designation: "Academic Administrator"
      },
      {
        name: "Dr. Arshad Khan",
        email: "hod.cs@smartfyp.edu",
        password: defaultPassword,
        role: "HOD",
        department: departmentMap["Computer Science"]?._id,
        isFirstLogin: false,
        isActive: true,
        phone: "+92-301-4455667",
        designation: "Professor & Head of Department",
        interests: ["Distributed Systems", "Cloud Computing", "Software Architecture"]
      },
      {
        name: "Dr. Sarah Jenkins",
        email: "hod.se@smartfyp.edu",
        password: defaultPassword,
        role: "HOD",
        department: departmentMap["Software Engineering"]?._id,
        isFirstLogin: false,
        isActive: true,
        phone: "+92-302-5566778",
        designation: "Associate Professor & HOD",
        interests: ["Agile Methodologies", "Software Quality Assurance", "DevOps"]
      },
      {
        name: "Dr. Tariq Mahmood",
        email: "supervisor.ai@smartfyp.edu",
        password: defaultPassword,
        role: "Supervisor",
        department: departmentMap["Artificial Intelligence & Data Science"]?._id,
        isFirstLogin: false,
        isActive: true,
        phone: "+92-303-6677889",
        designation: "Associate Professor",
        interests: ["Computer Vision", "Deep Learning", "Medical Image Processing", "Edge AI"]
      },
      {
        name: "Prof. Ayesha Malik",
        email: "supervisor.web@smartfyp.edu",
        password: defaultPassword,
        role: "Supervisor",
        department: departmentMap["Software Engineering"]?._id,
        isFirstLogin: false,
        isActive: true,
        phone: "+92-304-7788990",
        designation: "Assistant Professor",
        interests: ["Full-Stack Architecture", "Blockchain & Web3", "Cloud Microservices"]
      },
      {
        name: "Dr. Bilal Ahmed",
        email: "supervisor.cyber@smartfyp.edu",
        password: defaultPassword,
        role: "Supervisor",
        department: departmentMap["Cyber Security & Information Assurance"]?._id,
        isFirstLogin: false,
        isActive: true,
        phone: "+92-305-8899001",
        designation: "Associate Professor",
        interests: ["Zero Trust Security", "Network Intrusion Detection", "eBPF Kernel Probes"]
      }
    ];

    const userMap = {};
    for (const u of facultyUsersData) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = await User.create(u);
        console.log(`✅ Seeded Faculty User: ${u.name} (${u.role})`);
      }
      userMap[u.email] = user;
    }

    // Update HOD references on departments
    if (departmentMap["Computer Science"] && userMap["hod.cs@smartfyp.edu"]) {
      departmentMap["Computer Science"].hod = userMap["hod.cs@smartfyp.edu"]._id;
      await departmentMap["Computer Science"].save();
    }
    if (departmentMap["Software Engineering"] && userMap["hod.se@smartfyp.edu"]) {
      departmentMap["Software Engineering"].hod = userMap["hod.se@smartfyp.edu"]._id;
      await departmentMap["Software Engineering"].save();
    }

    // 3. Seed or find Student Users (Leaders and Members)
    const studentUsersData = [
      // Team 1 (CS)
      {
        name: "Hamza Ali",
        email: "leader.cs@smartfyp.edu",
        password: defaultPassword,
        role: "Team Leader",
        department: departmentMap["Computer Science"]?._id,
        studentRegNo: "2021-CS-101",
        phone: "+92-300-1122334",
        isFirstLogin: false,
        isActive: true
      },
      {
        name: "Zainab Fatima",
        email: "member1.cs@smartfyp.edu",
        password: defaultPassword,
        role: "Team Member",
        department: departmentMap["Computer Science"]?._id,
        studentRegNo: "2021-CS-102",
        phone: "+92-301-2233445",
        isFirstLogin: false,
        isActive: true
      },
      {
        name: "Usman Tariq",
        email: "member2.cs@smartfyp.edu",
        password: defaultPassword,
        role: "Team Member",
        department: departmentMap["Computer Science"]?._id,
        studentRegNo: "2021-CS-103",
        phone: "+92-302-3344556",
        isFirstLogin: false,
        isActive: true
      },

      // Team 2 (SE)
      {
        name: "Bilal Raza",
        email: "leader.se@smartfyp.edu",
        password: defaultPassword,
        role: "Team Leader",
        department: departmentMap["Software Engineering"]?._id,
        studentRegNo: "2021-SE-042",
        phone: "+92-303-4455667",
        isFirstLogin: false,
        isActive: true
      },
      {
        name: "Mahnoor Khan",
        email: "member1.se@smartfyp.edu",
        password: defaultPassword,
        role: "Team Member",
        department: departmentMap["Software Engineering"]?._id,
        studentRegNo: "2021-SE-043",
        phone: "+92-304-5566778",
        isFirstLogin: false,
        isActive: true
      },
      {
        name: "Daniyal Ahmed",
        email: "member2.se@smartfyp.edu",
        password: defaultPassword,
        role: "Team Member",
        department: departmentMap["Software Engineering"]?._id,
        studentRegNo: "2021-SE-044",
        phone: "+92-305-6677889",
        isFirstLogin: false,
        isActive: true
      },

      // Team 3 (AI)
      {
        name: "Saad Siddiqui",
        email: "leader.ai@smartfyp.edu",
        password: defaultPassword,
        role: "Team Leader",
        department: departmentMap["Artificial Intelligence & Data Science"]?._id,
        studentRegNo: "2021-AI-015",
        phone: "+92-306-7788990",
        isFirstLogin: false,
        isActive: true
      },
      {
        name: "Areeba Noor",
        email: "member1.ai@smartfyp.edu",
        password: defaultPassword,
        role: "Team Member",
        department: departmentMap["Artificial Intelligence & Data Science"]?._id,
        studentRegNo: "2021-AI-016",
        phone: "+92-307-8899001",
        isFirstLogin: false,
        isActive: true
      },

      // Team 4 (CY)
      {
        name: "Farhan Qureshi",
        email: "leader.cy@smartfyp.edu",
        password: defaultPassword,
        role: "Team Leader",
        department: departmentMap["Cyber Security & Information Assurance"]?._id,
        studentRegNo: "2021-CY-088",
        phone: "+92-308-9900112",
        isFirstLogin: false,
        isActive: true
      },
      {
        name: "Hina Altaf",
        email: "member1.cy@smartfyp.edu",
        password: defaultPassword,
        role: "Team Member",
        department: departmentMap["Cyber Security & Information Assurance"]?._id,
        studentRegNo: "2021-CY-089",
        phone: "+92-309-0011223",
        isFirstLogin: false,
        isActive: true
      },

      // Team 5 (EE)
      {
        name: "Omar Farooq",
        email: "leader.ee@smartfyp.edu",
        password: defaultPassword,
        role: "Team Leader",
        department: departmentMap["Electrical & Electronics Engineering"]?._id,
        studentRegNo: "2021-EE-024",
        phone: "+92-310-1122334",
        isFirstLogin: false,
        isActive: true
      }
    ];

    for (const s of studentUsersData) {
      let user = await User.findOne({ email: s.email });
      if (!user) {
        user = await User.create(s);
        console.log(`✅ Seeded Student: ${s.name} (${s.studentRegNo})`);
      }
      userMap[s.email] = user;
    }

    // 4. Seed Complete Test Projects & Teams with Rich Details
    const testProjects = [
      {
        teamName: "TEAM-CS-2025-01",
        title: "VisionAI: Real-Time Pathological Diagnosis & Clinical Decision Support System",
        department: departmentMap["Computer Science"]?._id,
        supervisor: userMap["supervisor.ai@smartfyp.edu"]?._id,
        hod: userMap["hod.cs@smartfyp.edu"]?._id,
        teamLeader: userMap["leader.cs@smartfyp.edu"]?._id,
        members: [
          userMap["member1.cs@smartfyp.edu"]?._id,
          userMap["member2.cs@smartfyp.edu"]?._id
        ].filter(Boolean),
        status: "Published",
        isPublic: true,
        isApprovedBySupervisor: true,
        isApprovedByHOD: true,
        isApprovedByAdmin: true,
        progress: 100,
        semester: 8,
        currentPhase: "Final",
        academicYear: "2024-2025",
        year: 2025,
        batch: "2021-2025",
        duration: "9 Months",
        grade: "A+",
        score: 96,
        technologies: ["PyTorch", "React.js", "FastAPI", "Docker", "PostgreSQL", "Tailwind CSS", "Redis"],
        tags: ["Healthcare AI", "Computer Vision", "Deep Learning", "Clinical Support", "FYP-2"],
        description: "An end-to-end deep learning framework designed for real-time pathology whole-slide analysis and automated tumor demarcation. Utilizing modified Vision Transformers (ViT) and convolutional backbones, the system delivers high diagnostic accuracy across diverse histopathological benchmarks, accompanied by explainable heatmaps for oncologists.",
        abstract: "Digital pathology generates gigapixel whole slide images that impose severe cognitive load on pathologists. VisionAI implements hierarchical patch-based attention networks to localize malignant tissue micro-regions in sub-second inference windows. Verified across multi-institutional biopsy cohorts, the system demonstrates 98.4% diagnostic sensitivity and integrates seamlessly with hospital PACS archiving.",
        outcomes: `1. Multi-scale pathological image segmentation pipeline achieving 98.4% diagnostic sensitivity on public benchmarks.
2. Clinician diagnostic web workstation with real-time zooming, gigapixel tiling, and interactive heatmap overlays.
3. Automated standardized diagnostic report generation compliant with HL7/FHIR medical data standards.
4. Comprehensive 80-page Final Project Thesis and Docker deployment container architecture.`,
        githubLink: "https://github.com/smartfyp-org/vision-ai-diagnostics",
        liveLink: "https://vision-ai-demo.smartfyp.org",
        isLiveLinkPublic: true,
        fileUrl: "/uploads/proposals/VisionAI_Final_Project_Report.pdf",
        finalDocumentations: [
          {
            title: "VisionAI Final Thesis & Architecture Specification",
            semester: 8,
            fileUrl: "/uploads/proposals/VisionAI_Final_Project_Report.pdf",
            links: ["https://github.com/smartfyp-org/vision-ai-diagnostics"],
            submittedBy: "Hamza Ali",
            status: "Approved",
            approvedBySupervisorAt: new Date(Date.now() - 15 * 86400000),
            history: [
              {
                version: 1,
                fileUrl: "/uploads/proposals/VisionAI_Proposal_Draft_v1.pdf",
                submittedAt: new Date(Date.now() - 90 * 86400000)
              },
              {
                version: 2,
                fileUrl: "/uploads/proposals/VisionAI_Final_Project_Report.pdf",
                submittedAt: new Date(Date.now() - 16 * 86400000)
              }
            ]
          }
        ],
        feedback: [
          {
            author: userMap["supervisor.ai@smartfyp.edu"]?._id,
            role: "Supervisor",
            content: "Exceptional rigor demonstrated throughout model benchmarking, edge inference latency optimization, and clinician workflow testing. Outstanding final thesis defense.",
            createdAt: new Date(Date.now() - 10 * 86400000)
          },
          {
            author: userMap["hod.cs@smartfyp.edu"]?._id,
            role: "HOD",
            content: "Exemplary FYP project representing the Computer Science department. Recommended for university showcase and international publication.",
            createdAt: new Date(Date.now() - 8 * 86400000)
          }
        ]
      },
      {
        teamName: "TEAM-SE-2025-04",
        title: "Decentralized Academic Credential Verification & Immutable Transcript Vault",
        department: departmentMap["Software Engineering"]?._id,
        supervisor: userMap["supervisor.web@smartfyp.edu"]?._id,
        hod: userMap["hod.se@smartfyp.edu"]?._id,
        teamLeader: userMap["leader.se@smartfyp.edu"]?._id,
        members: [
          userMap["member1.se@smartfyp.edu"]?._id,
          userMap["member2.se@smartfyp.edu"]?._id
        ].filter(Boolean),
        status: "Approved",
        isPublic: true,
        isApprovedBySupervisor: true,
        isApprovedByHOD: true,
        isApprovedByAdmin: true,
        progress: 80,
        semester: 8,
        currentPhase: "Implementation",
        academicYear: "2024-2025",
        year: 2025,
        batch: "2021-2025",
        duration: "9 Months",
        grade: "A",
        score: 92,
        technologies: ["Solidity", "Polygon", "React.js", "Node.js", "IPFS", "Ethers.js", "Tailwind CSS"],
        tags: ["Blockchain", "Smart Contracts", "Web3", "Decentralized Identity", "FYP-2"],
        description: "A zero-knowledge decentralized identity and academic credential issuance network. Enables universities to issue cryptographically signed, tamper-proof diplomas and official transcripts directly verifiable by global employers within milliseconds without intermediaries.",
        abstract: "Academic credential fraud costs global enterprises billions annually while manual verification processes take weeks. This system utilizes Ethereum/Polygon smart contracts paired with decentralized IPFS storage to provide instant cryptographic validity checks. Student privacy is preserved through zero-knowledge selective disclosure proofs.",
        outcomes: `1. Gas-optimized ERC-721 Soulbound token smart contracts deployed and audited on Polygon testnet.
2. Encrypted decentralized IPFS file vault with verifiable cryptographic hashes.
3. QR-code instant employer verification portal with zero third-party API dependencies.
4. Comprehensive administrative dashboard for university registrars.`,
        githubLink: "https://github.com/smartfyp-org/decentralized-transcript-vault",
        liveLink: "https://transcript-vault-demo.smartfyp.org",
        isLiveLinkPublic: true,
        fileUrl: "/uploads/proposals/Blockchain_Transcript_Vault_Proposal.pdf",
        finalDocumentations: [
          {
            title: "Smart Contract Architecture & Security Audit",
            semester: 8,
            fileUrl: "/uploads/proposals/Blockchain_Transcript_Vault_Proposal.pdf",
            links: ["https://github.com/smartfyp-org/decentralized-transcript-vault"],
            submittedBy: "Bilal Raza",
            status: "Approved",
            approvedBySupervisorAt: new Date(Date.now() - 20 * 86400000)
          }
        ],
        feedback: [
          {
            author: userMap["supervisor.web@smartfyp.edu"]?._id,
            role: "Supervisor",
            content: "Solid smart contract architecture. Gas optimization benchmarks look very impressive. Proceed with final user evaluation testing.",
            createdAt: new Date(Date.now() - 14 * 86400000)
          }
        ]
      },
      {
        teamName: "TEAM-AI-2025-09",
        title: "AgriSense: Autonomous Agricultural Rover with Edge Computer Vision & Soil Telemetry",
        department: departmentMap["Artificial Intelligence & Data Science"]?._id,
        supervisor: userMap["supervisor.ai@smartfyp.edu"]?._id,
        hod: userMap["hod.cs@smartfyp.edu"]?._id,
        teamLeader: userMap["leader.ai@smartfyp.edu"]?._id,
        members: [
          userMap["member1.ai@smartfyp.edu"]?._id
        ].filter(Boolean),
        status: "Active",
        isPublic: false,
        isApprovedBySupervisor: true,
        isApprovedByHOD: true,
        isApprovedByAdmin: false,
        progress: 65,
        semester: 7,
        currentPhase: "Design",
        academicYear: "2025-2026",
        year: 2025,
        batch: "2022-2026",
        duration: "1 Year",
        grade: "A-",
        score: 87,
        technologies: ["YOLOv9", "Raspberry Pi", "Python", "MQTT", "React.js", "TimescaleDB", "ESP32"],
        tags: ["AgriTech", "Edge AI", "IoT", "Precision Farming", "Robotics"],
        description: "An IoT-enabled autonomous agricultural rover equipped with edge computer vision models for real-time crop disease detection, weed classification, micro-nutrient deficiency identification, and precision localized spraying.",
        abstract: "Pest infestations and late disease detection result in severe agricultural crop yield loss. AgriSense deploys lightweight quantized YOLOv9 models on an edge TPU rover chassis, capturing high-resolution foliar imagery and multispectral telemetry to pinpoint infections before visible symptoms spread.",
        outcomes: `1. Low-latency edge vision inference executing at 30 FPS on embedded hardware.
2. Real-time telemetry dashboard mapping soil moisture, NPK values, and ambient microclimate.
3. Autonomous GPS waypoint traversal and obstacle avoidance algorithms.`,
        githubLink: "https://github.com/smartfyp-org/agrisense-rover-ai",
        liveLink: "https://agrisense-iot.demo.smartfyp.org",
        isLiveLinkPublic: false,
        fileUrl: "/uploads/proposals/AgriSense_Rover_Architecture_Doc.pdf",
        feedback: [
          {
            author: userMap["supervisor.ai@smartfyp.edu"]?._id,
            role: "Supervisor",
            content: "Hardware telemetry calibration completed smoothly. Focus on outdoor field test validation in different lighting conditions next.",
            createdAt: new Date(Date.now() - 5 * 86400000)
          }
        ]
      },
      {
        teamName: "TEAM-CY-2025-22",
        title: "SentinelZero: AI-Driven Zero-Trust Network Access & Threat Anomaly Detection",
        department: departmentMap["Cyber Security & Information Assurance"]?._id,
        supervisor: userMap["supervisor.cyber@smartfyp.edu"]?._id,
        hod: userMap["hod.cs@smartfyp.edu"]?._id,
        teamLeader: userMap["leader.cy@smartfyp.edu"]?._id,
        members: [
          userMap["member1.cy@smartfyp.edu"]?._id
        ].filter(Boolean),
        status: "Published",
        isPublic: true,
        isApprovedBySupervisor: true,
        isApprovedByHOD: true,
        isApprovedByAdmin: true,
        progress: 100,
        semester: 8,
        currentPhase: "Final",
        academicYear: "2024-2025",
        year: 2025,
        batch: "2021-2025",
        duration: "9 Months",
        grade: "A+",
        score: 98,
        technologies: ["Python", "eBPF", "Suricata", "Go", "Next.js", "Grafana", "ElasticSearch"],
        tags: ["Cybersecurity", "Zero Trust", "eBPF Kernel", "Threat Intelligence", "SIEM"],
        description: "A next-generation Zero-Trust Network Access (ZTNA) proxy utilizing eBPF kernel hooks and unsupervised isolation forest algorithms to identify lateral movement attacks, unauthorized data exfiltration, and anomalous network behaviors in real-time.",
        abstract: "Traditional perimeter security fails to protect modern cloud environments against insider threats and zero-day lateral movements. SentinelZero taps kernel-level socket events via extended Berkeley Packet Filters to perform line-rate behavioral profiling without kernel reboots or packet dropping.",
        outcomes: `1. Kernel packet probe capturing socket connections with sub-millisecond execution overhead.
2. Behavioral anomaly detection model isolating suspicious data exfiltration within 3 network packets.
3. Interactive SOC analyst visualizer and automated quarantine webhook dispatch.`,
        githubLink: "https://github.com/smartfyp-org/sentinel-zero-trust",
        liveLink: "https://sentinel-ztna.demo.smartfyp.org",
        isLiveLinkPublic: true,
        fileUrl: "/uploads/proposals/SentinelZero_Technical_Whitepaper.pdf",
        feedback: [
          {
            author: userMap["supervisor.cyber@smartfyp.edu"]?._id,
            role: "Supervisor",
            content: "Phenomenal work on the eBPF kernel probes. Performance overhead was under 0.3%, beating industry baselines. Flawless execution.",
            createdAt: new Date(Date.now() - 12 * 86400000)
          }
        ]
      },
      {
        teamName: "TEAM-EE-2025-07",
        title: "Intelligent Microgrid Energy Management System with Predictive Load Optimization",
        department: departmentMap["Electrical & Electronics Engineering"]?._id,
        supervisor: userMap["supervisor.ai@smartfyp.edu"]?._id,
        hod: userMap["hod.cs@smartfyp.edu"]?._id,
        teamLeader: userMap["leader.ee@smartfyp.edu"]?._id,
        members: [],
        status: "Active",
        isPublic: false,
        isApprovedBySupervisor: true,
        isApprovedByHOD: false,
        isApprovedByAdmin: false,
        progress: 45,
        semester: 7,
        currentPhase: "Analysis",
        academicYear: "2025-2026",
        year: 2025,
        batch: "2022-2026",
        duration: "1 Year",
        grade: "B+",
        score: 82,
        technologies: ["MATLAB Simulink", "Python", "Prophet", "Modbus", "Node.js", "InfluxDB"],
        tags: ["Renewable Energy", "Smart Grid", "Time Series Forecasting", "Microgrid"],
        description: "An intelligent microgrid controller that optimizes distributed solar PV, battery energy storage systems (BESS), and diesel generator dispatch using predictive weather forecasts and dynamic electricity tariff models.",
        abstract: "Variable renewable generation causes instability and financial penalties in microgrid deployments. This project pairs time-series solar irradiance predictors with linear optimization solvers to automate battery charge/discharge cycles and curtail grid peak-demand fees.",
        outcomes: `1. Predictive load dispatch model reducing daily operational energy costs by 28%.
2. Modbus/TCP hardware communication layer for inverter and battery monitoring.
3. Web dashboard with interactive power flow diagrams and generation forecasts.`,
        githubLink: "https://github.com/smartfyp-org/microgrid-energy-manager",
        liveLink: "https://smartgrid-ems.demo.smartfyp.org",
        isLiveLinkPublic: false,
        fileUrl: "/uploads/proposals/Microgrid_Energy_Management_Proposal.pdf"
      }
    ];

    const seededProjects = [];
    for (const pData of testProjects) {
      let existingProj = await Project.findOne({ teamName: pData.teamName });
      if (!existingProj) {
        existingProj = await Project.create(pData);
        console.log(`✅ Seeded Project: ${pData.title} (Team ID: ${pData.teamName})`);
      } else {
        // Ensure all rich details are filled in
        Object.assign(existingProj, pData);
        await existingProj.save();
        console.log(`🔄 Updated Project Details for: ${pData.teamName}`);
      }
      seededProjects.push(existingProj);
    }

    // 5. Seed Sample Tasks for active projects
    const visionProj = seededProjects.find(p => p.teamName === "TEAM-CS-2025-01");
    if (visionProj && userMap["leader.cs@smartfyp.edu"] && userMap["supervisor.ai@smartfyp.edu"]) {
      const existingTaskCount = await Task.countDocuments({ project: visionProj._id });
      if (existingTaskCount === 0) {
        await Task.create([
          {
            project: visionProj._id,
            assignedBy: userMap["supervisor.ai@smartfyp.edu"]._id,
            assignee: userMap["leader.cs@smartfyp.edu"]._id,
            title: "Literature Review & Benchmark Analysis",
            description: "Compile exhaustive survey of Vision Transformers and CNN architectures for medical pathology segmentation.",
            deadline: new Date(Date.now() - 40 * 86400000),
            priority: "High",
            status: "Completed",
            submission: {
              link: "https://github.com/smartfyp-org/vision-ai-diagnostics/docs",
              comments: "Complete survey submitted with 45 peer-reviewed references.",
              grade: "A+",
              feedback: "Outstanding depth and comparative analysis."
            }
          },
          {
            project: visionProj._id,
            assignedBy: userMap["supervisor.ai@smartfyp.edu"]._id,
            assignee: userMap["member1.cs@smartfyp.edu"]._id,
            title: "FastAPI GPU Inference Service Implementation",
            description: "Deploy PyTorch TensorRT inference engine with asynchronous queue workers.",
            deadline: new Date(Date.now() - 20 * 86400000),
            priority: "Critical",
            status: "Completed",
            submission: {
              link: "https://github.com/smartfyp-org/vision-ai-diagnostics/tree/main/backend",
              comments: "FastAPI microservice achieved 42ms inference per image tile.",
              grade: "A+",
              feedback: "Excellent throughput."
            }
          },
          {
            project: visionProj._id,
            assignedBy: userMap["supervisor.ai@smartfyp.edu"]._id,
            assignee: userMap["member2.cs@smartfyp.edu"]._id,
            title: "Final Thesis Document & Presentation Prep",
            description: "Finalize IEEE formatted project report and prepare slides for external defense.",
            deadline: new Date(Date.now() - 5 * 86400000),
            priority: "High",
            status: "Completed",
            submission: {
              fileUrl: "/uploads/proposals/VisionAI_Final_Project_Report.pdf",
              comments: "All chapters approved and checked for plagiarism.",
              grade: "A+",
              feedback: "Ready for defense."
            }
          }
        ]);
        console.log("✅ Seeded sample tasks for VisionAI project.");
      }
    }

    // 6. Seed sample Announcements
    const announcementCount = await Announcement.countDocuments();
    if (announcementCount === 0 && userMap["hod.cs@smartfyp.edu"]) {
      await Announcement.create([
        {
          title: "FYP Final Defense Schedule & Evaluation Rubrics",
          content: "All Final Year Project teams registered for 8th semester must submit their finalized bound thesis and GitHub repository links by Friday 5:00 PM. Defense sessions begin next Monday in Seminar Hall A.",
          author: userMap["hod.cs@smartfyp.edu"]._id,
          priority: "High",
          audience: "All"
        },
        {
          title: "Mid-Term Progress Review & Poster Presentation",
          content: "7th Semester teams are required to prepare a 36x48 inch academic poster summarizing problem statement, methodology, and preliminary prototypes.",
          author: userMap["hod.cs@smartfyp.edu"]._id,
          priority: "Medium",
          audience: "Students"
        }
      ]);
      console.log("✅ Seeded sample Announcements.");
    }

    console.log("🎉 Complete Test Data Seeding successfully verified and ready!");
  } catch (error) {
    console.error("❌ Error during test data seeding:", error);
  }
}
