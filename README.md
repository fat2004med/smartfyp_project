# SmartFYP — Academic Final Year Project Management System

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248.svg)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Backend-Express%204.21-lightgrey.svg)](https://expressjs.com/)
[![ML Engine](https://img.shields.io/badge/ML-Fine--Tuned%20SentenceTransformers-blue.svg)](https://huggingface.co/)
[![Vitest](https://img.shields.io/badge/Testing-Vitest%20(25%20Passed)-green.svg)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**SmartFYP** is a modern, production-grade enterprise web application engineered specifically for colleges, universities, and academic departments to orchestrate, evaluate, and archive undergraduate Final Year Projects (FYP) and capstone theses.

Built with a unified **Express + React 19 SPA** architecture, SmartFYP streamlines the entire capstone lifecycle—from project ideation and team formation to multi-tier hierarchical approvals, task sprint tracking, dual-engine document plagiarism scanning, and public digital repository publishing.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Key Features by Role](#key-features-by-role)
- [Intelligent Core Engines](#intelligent-core-engines)
  - [1. Dual-Engine Plagiarism & Authenticity Detector](#1-dual-engine-plagiarism--authenticity-detector)
  - [2. Machine Learning Project Recommendation Engine](#2-machine-learning-project-recommendation-engine)
  - [3. Hierarchical Approval Workflow Pipeline](#3-hierarchical-approval-workflow-pipeline)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
  - [Quick Start](#quick-start)
  - [Environment Variables (.env)](#environment-variables-env)
  - [Python ML Microservice Setup (Optional)](#python-ml-microservice-setup-optional)
- [Pre-Seeded Demo Accounts & Credentials](#pre-seeded-demo-accounts--credentials)
- [REST API Reference](#rest-api-reference)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Deployment Guide](#deployment-guide)
- [Security & Compliance](#security--compliance)
- [License](#license)

---

## System Architecture

SmartFYP employs a cohesive client-server topology featuring an Express.js backend serving both high-throughput REST APIs and static Vite-bundled React assets, connected to MongoDB Atlas for persistent storage and an optional Python Flask microservice for high-dimensional vector embeddings.

```
                         ┌─────────────────────────────┐
                         │   Web Browser / Client UI   │
                         │   (React 19 + Tailwind v4)  │
                         └──────────────┬──────────────┘
                                        │ HTTPS / REST API
                                        ▼
                         ┌─────────────────────────────┐
                         │      Express 4.21 Server    │
                         │    Port 3000 / Proxy Ingress │
                         └──────┬───────────────┬──────┘
                                │               │
          ┌─────────────────────┼───────────────┼─────────────────────┐
          │                     │               │                     │
          ▼                     ▼               ▼                     ▼
┌───────────────────┐ ┌──────────────────┐ ┌───────────────────┐ ┌───────────────┐
│   MongoDB Atlas   │ │  In-Memory TF-IDF │ │ Multi-factor   │ │  Python Flask  │
│   (Mongoose ODM)  │ │  ML Recommender   │ │ Semantic Match │ │  ML Service    │
│  - Multi-tenancy  │ │  - 26+ Domains    │ │ - Local Cosine │ │ - Sentence-    │
│  - Audit Logs     │ │  - Sub-50ms query │ │ - Standalone   │ │   Transformers │
│  - Collections    │ │  - CSV Auto-align │ │ - Zero API Call│ │ - Cosine Embed │
└───────────────────┘ └──────────────────┘ └───────────────────┘ └───────────────┘
```

---

## Key Features by Role

SmartFYP implements a strict, verified **Role-Based Access Control (RBAC)** model supporting single-role and multi-role personas (e.g., faculty acting simultaneously as an HOD and a Project Supervisor).

### 1. Super Administrator (`Admin`)
* **Department Oversight**: Full CRUD control over academic departments, department codes, and assigned Head of Department (HOD) chairs.
* **User Lifecycle Management**: Provision students and faculty, assign dual roles, trigger temporary password resets, toggle account activation, and resend welcome onboarding credentials.
* **Institutional Governance**: Real-time KPI counters (active projects, user distribution, submission throughput), and global system logs audit trails with client IP tracking.
* **Final Project Archiving**: Review, approve, and publicly publish completed capstones to the institutional repository.
* **Plagiarism Auditing**: Global document scanning suite with customizable similarity threshold bounds.

### 2. Head of Department (`HOD`)
* **Departmental Command Center**: Real-time project throughput analytics, milestone distribution, and pending approval alerts.
* **Faculty Workload Balancing**: Monitor supervisor allocations, student-to-supervisor ratios, and set project supervision limits.
* **Proposal & Deliverable Endorsement**: Review proposals and project milestones forwarded by supervisors before advancing to Admin.
* **Curriculum Assignments**: Publish departmental milestone templates (.docx, .pdf) and set submission deadlines.
* **Scoped Broadcasts**: Post announcements targeted specifically to faculty or students within the department.

### 3. Project Supervisor (`Supervisor`)
* **Mentorship Workspace**: Track all assigned student research groups, track progress percentages, and monitor milestone deadlines.
* **Student Nudges**: Send automated email and notification nudges to delayed teams with a single click.
* **Evaluation & Grading**: Formal submission grading (Score 0–100, Letter Grade A–F) with inline review commentary.
* **Workflow Progression**: Approve deliverables and forward them to the HOD for departmental sign-off.
* **Task Delegation**: Assign sprint backlog items and sub-tasks to student teams.

### 4. Student Team Leader (`Team Leader`)
* **Team Governance**: Register and manage team members by student registration number.
* **Milestone Submissions**: Upload deliverables (.pdf, .docx, .zip), track revision history, and review supervisor feedback.
* **Internal Sprint Board**: Create and assign tasks to team members with priority levels and due dates.
* **Self-Check Plagiarism Scanner**: Pre-screen thesis drafts before formal submission to identify accidental citation gaps.
* **Final Viva Submission**: Package final documentation for multi-tier institutional approval.

### 5. Student Team Member (`Team Member`)
* **Personalized Dashboard**: View assigned tasks, countdowns to upcoming milestone deadlines, and project phase progress.
* **Collaborative Submissions**: Access team project submissions, download templates, and view supervisor evaluations.
* **Task Progression**: Update task status (`In Progress`, `Under Review`, `Completed`).
* **Notification Feed**: Receive real-time alerts on assignment updates, grades, and announcement broadcasts.

### 6. Public Portal & Prospective Students (`Guest`)
* **Project Showcase**: Publicly searchable archive of verified, completed final year projects filtered by department, year, and tech stack.
* **AI Project Ideator**: Interactive tool recommending novel FYP topics using machine learning and keyword matching.
* **Department Directory & About**: Institutional project guidelines, grading rubric outlines, and academic timelines.
* **Support Inquiries**: Integrated contact portal dispatching audit records and administrator alerts.

---

## Intelligent Core Engines

### 1. Dual-Engine Plagiarism & Authenticity Detector

SmartFYP includes an enterprise-grade document authenticity subsystem capable of inspecting `.pdf`, `.docx`, and `.txt` files without relying on any external third-party or cloud APIs:

```
               [ Uploaded Document (.pdf / .docx / .txt) ]
                                  │
                                  ▼
                      [ Text Extraction Layer ]
                    (mammoth.js / pdf-parse / utf8)
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
[ Fine-Tuned ML Microservice ]                 [ Built-in Node.js Engine ]
- Custom Fine-Tuned SentenceTransformer         - Multi-factor Embedding & N-grams
  (all-MiniLM-L6-v2 fine-tuned weights)         - Sublinear TF-IDF Cosine Matcher
- 384-dimensional dense vector embeddings       - Evaluates against MongoDB Final
- Normalized Cosine Similarity Matrix             Documentation Archives
- Direct source contribution % breakdown        - Fully offline standalone fallback
         │                                                 │
         └────────────────────────┬────────────────────────┘
                                  │
                                  ▼
           [ Primary Plagiarism & Similarity Result ]
           - Exact Plagiarism Percentage (0 - 100%)
           - Exceeds Threshold Evaluation (Safe / Flagged)
           - Per-source document overlap contributions
           - Model-Derived Executive Audit Summary
             (100% computed on behalf of trained model weights;
              ZERO external cloud LLM APIs or third-party dependencies)
```

* **Custom Fine-Tuned SentenceTransformer (`ml-service/saved_model`)**: The core neural similarity engine. Generates 384-dimensional dense semantic vectors using your fine-tuned weights and performs vector cosine similarity against all indexed departmental theses and reference papers.
* **Built-in Multi-factor Engine (`utils/plagiarismEngine.js`)**: Standalone Node.js vector and n-gram engine ensuring the system functions with zero downtime even when the Python microservice is offline.
* **Zero External API Dependency**: The system uses **NO external cloud LLM APIs** (no Gemini, no OpenAI, no third-party services). All similarity calculations, source attribution percentages, and executive audit summaries are computed directly on behalf of the trained machine learning models and local statistical analysis. This ensures absolute student document confidentiality, zero API billing, and complete compliance with academic thesis defense requirements.

### 2. Machine Learning Project Recommendation Engine

Located in `utils/recommender.js`, this offline-capable machine learning subsystem recommends tailored FYP concepts:
* **TF-IDF Vectorization**: Natural language tokenization, custom stop-word pruning, and term frequency-inverse document frequency calculation over 26+ academic domains.
* **Cosine Similarity Scoring**: Real-time vector angle comparison yielding high-relevance topic recommendations in under **20ms**.
* **Self-Healing Dataset**: Automatically parses, sanitizes, and repairs structural column alignment in `fyp_projects.csv`.

### 3. Hierarchical Approval Workflow Pipeline

All project documentation traverses a strict four-stage approval pipeline preventing unauthorized project advancement:

$$\text{Draft} \longrightarrow \text{Pending TL} \longrightarrow \text{Pending Supervisor} \longrightarrow \text{Pending HOD} \longrightarrow \text{Pending Admin} \longrightarrow \mathbf{Approved / Published}$$

* **Dual-Role Resilience**: If a faculty member holds both HOD and Supervisor privileges, the engine tracks stage-specific approvals independently, ensuring rigorous review integrity.
* **Versioned Resubmission**: Rejected deliverables can be re-uploaded; earlier versions are retained in the document history log with full feedback trails.

---

## Technology Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19.0 | Component rendering, hooks, responsive UI |
| **Build & Tooling** | Vite 6.2 | Rapid hot-module development and production bundling |
| **Styling** | Tailwind CSS v4.1 | Utility-first responsive design and modern layouts |
| **Motion & Animation** | Motion (`motion/react`) | Fluid modal dialogs, route transitions, and toasts |
| **Icons & Charts** | Lucide React, Recharts | Data visualization, status indicators, and SVG icons |
| **Backend Runtime** | Node.js (v18+ ESM) | High-performance asynchronous JavaScript runtime |
| **Web Server** | Express.js 4.21 | RESTful routing, file streaming, proxy handling |
| **Database & ODM** | MongoDB Atlas, Mongoose 9.4 | Schemas, relations, indexing, and connection pools |
| **Authentication** | JSON Web Tokens (JWT), BcryptJS | Stateless bearer authentication and cryptographic hashing |
| **File Parsing** | Mammoth, PDF-Parse, Docx, JSZip | On-the-fly text extraction and template generation |
| **Mailing & SMTP** | Nodemailer | Password recovery tokens, account welcome alerts |
| **ML Document Authenticity** | Custom Fine-Tuned Model (`ml-service/saved_model`) | Dense neural semantic similarity & vector matching (Zero external APIs) |
| **ML Microservice** | Python 3.9+, Flask, SentenceTransformers | Dense document embeddings and cosine matching |
| **Testing Suite** | Vitest 4.1, Supertest | Unit, integration, functional, and non-functional tests |

---

## Repository Structure

```
├── api/                         # Serverless API routes (Vercel deployment targets)
├── config/
│   ├── db.js                    # MongoDB Atlas connection pool & status tracker
│   ├── seedCompleteData.js      # Complete demo data seeder (users, projects, depts)
│   └── seedData.js              # Baseline initial seed data
├── controller/                  # Express controller modules
│   ├── announcementController.js
│   ├── assignmentController.js
│   ├── authController.js
│   ├── dashboardController.js
│   ├── departmentController.js
│   ├── notificationController.js
│   ├── projectController.js
│   ├── submissionController.js
│   ├── taskController.js
│   ├── templateController.js
│   └── userController.js
├── middleware/
│   ├── auth.js                  # JWT verification & RBAC authorization
│   ├── errorHandler.js          # Unified API error handling & reporting
│   └── upload.js                # Multer disk storage and file validation
├── ml-service/                  # Python Flask Semantic Similarity Microservice
│   ├── app.py                   # Flask server entry point & endpoints
│   ├── db_helper.py             # MongoDB connection for vector sources
│   ├── model_loader.py          # SentenceTransformers loader
│   ├── text_extractor.py        # Python-side PDF/DOCX extractor
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile               # Microservice container definition
├── models/                      # Mongoose Database Schemas
│   ├── Announcement.js
│   ├── Assignment.js
│   ├── ContactMessage.js
│   ├── Department.js
│   ├── Feedback.js
│   ├── Notification.js
│   ├── PlagiarismSource.js
│   ├── Project.js
│   ├── ProjectGroup.js
│   ├── Submission.js
│   ├── SystemLog.js
│   ├── Task.js
│   ├── Template.js
│   └── User.js
├── routes/                      # Express REST API Route Handlers
│   ├── announcementRoutes.js
│   ├── assignmentRoutes.js
│   ├── authRoutes.js
│   ├── dashboardRoutes.js
│   ├── departmentRoutes.js
│   ├── fileRoutes.js
│   ├── notificationRoutes.js
│   ├── plagiarismRoutes.js
│   ├── projectRoutes.js
│   ├── submissionRoutes.js
│   ├── taskRoutes.js
│   ├── templateRoutes.js
│   └── userRoutes.js
├── src/                         # React 19 Frontend Codebase
│   ├── components/              # Shared dashboard and functional widgets
│   │   ├── Announcements.jsx
│   │   ├── Approvals.jsx
│   │   ├── Assignments.jsx
│   │   ├── DepartmentManagement.jsx
│   │   ├── DocumentViewerModal.jsx
│   │   ├── Feedback.jsx
│   │   ├── PlagiarismChecker.jsx
│   │   ├── ProjectRecords.jsx
│   │   ├── ProjectSubmission.jsx
│   │   ├── ReviewQueue.jsx
│   │   ├── SystemLogs.jsx
│   │   ├── TaskManagement.jsx
│   │   ├── TeamManagement.jsx
│   │   └── UserManagement.jsx
│   ├── context/                 # React Contexts (AuthContext, NotificationContext)
│   ├── layouts/                 # DashboardLayout & Responsive Sidebar
│   ├── pages/                   # Public and Authenticated Pages
│   │   ├── dashboards/          # 5 Role-Specific Dashboards
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── HODDashboard.jsx
│   │   │   ├── SupervisorDashboard.jsx
│   │   │   ├── TeamLeaderDashboard.jsx
│   │   │   └── TeamMemberDashboard.jsx
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   ├── Ideas.jsx
│   │   ├── Login.jsx
│   │   ├── Projects.jsx
│   │   ├── ForgotPassword.jsx
│   │   └── ResetPassword.jsx
│   ├── App.jsx                  # Main Application Router & Route Guards
│   └── main.tsx                 # React DOM mount point
├── tests/                       # Automated Vitest Test Suite (25 Tests)
│   ├── unit/                    # Unit tests (Password, Recommender, Plagiarism)
│   ├── integration/             # Integration tests (JWT, Auth Middleware)
│   ├── functional/              # Functional workflow tests (Announcement scope)
│   ├── non-functional/          # Performance, load, and security audits
│   └── regression/              # Multi-role notification regression tests
├── uploads/                     # Local document storage directory
├── utils/                       # Utility and Helper Modules
│   ├── logger.js                # Console & file system event logging
│   ├── passwordValidator.js     # Enterprise password validation logic
│   ├── plagiarismChecker.js     # Document extraction & trained model evaluation
│   ├── plagiarismEngine.js      # In-memory document indexing
│   ├── recommender.js           # TF-IDF machine learning recommendation engine
│   └── sendEmail.js             # Nodemailer email dispatcher
├── fyp_projects.csv             # Corpus dataset for ML project recommender
├── server.js                    # Primary Node.js/Express application server
├── vite.config.js               # Vite compilation and plugin setup
└── package.json                 # Project dependencies and npm scripts
```

---

## Prerequisites

Before running SmartFYP, ensure you have:

- **Node.js**: `v18.18.0` or higher (Node 20+ recommended)
- **npm**: `v9.0.0` or higher
- **MongoDB**: A free MongoDB Atlas cluster connection string or a local MongoDB instance (`mongodb://127.0.0.1:27017/SmartFYP`)
- **Python 3.9+** *(Optional)*: Only required if running the standalone Python ML microservice

---

## Installation & Setup

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/smartfyp.git
   cd smartfyp
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (or copy `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Fill in your MongoDB connection string and credentials.

4. **Launch the Development Server**:
   ```bash
   npm run dev
   ```
   The application will start on **`http://localhost:3000`**. The server automatically connects to MongoDB, seeds initial demo accounts if empty, pre-trains the ML recommender, and launches the Vite React frontend.

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

### Environment Variables (.env)

| Variable | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `3000` | Port for the Express server |
| `NODE_ENV` | Optional | `development` | Environment mode (`development` or `production`) |
| `MONGO_URI` / `MONGODB_URI`| **Yes** | `mongodb+srv://...` | MongoDB connection string |
| `JWT_SECRET` | **Yes** | `your_secure_random_hash` | Secret key used to sign and verify JWT authentication tokens |
| `APP_URL` / `CLIENT_URL` | Optional | `http://localhost:3000` | Frontend origin for CORS and password reset links |
| `EMAIL_SERVICE` | Optional | `gmail` | Nodemailer service provider |
| `EMAIL_HOST` | Optional | `smtp.gmail.com` | SMTP host server |
| `EMAIL_PORT` | Optional | `587` | SMTP port |
| `EMAIL_USER` | Optional | `your_email@gmail.com` | Email address sending password resets and notices |
| `EMAIL_PASS` | Optional | `16_char_app_password` | Google 16-character App Password (not your personal password) |
| `EMAIL_FROM` | Optional | `noreply@smartfyp.com` | Display sender address |
| `PYTHON_ML_URL` | Optional | `http://127.0.0.1:5000` | Address of the optional Python ML service |

---

### Python ML Microservice Setup (Optional)

If you wish to use the Python SentenceTransformers microservice alongside the built-in Node.js Winnowing engine:

```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
The microservice will run on **`http://127.0.0.1:5000`**. The Node.js server automatically detects its presence and proxies similarity scans to it. If offline, the server falls back seamlessly to the internal Winnowing engine.

---

## Demo Accounts & Evaluation Profiles

> [!WARNING]
> **Production Security Notice:**
> The following accounts are intended for local development and academic evaluation. In any public or production deployment, **all default passwords must be changed immediately** or seeded via secure environment configuration.

| Role | Name | Email | Default Password | Role Scope |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | Dr. John Doe | `admin@smartfyp.edu` | `password123` | Global System Admin |
| **HOD (Computer Science)** | Dr. Arshad Khan | `hod.cs@smartfyp.edu` | `password123` | Department Head |
| **HOD (Software Engineering)** | Dr. Sarah Jenkins | `hod.se@smartfyp.edu` | `password123` | Department Head |
| **Project Supervisor** | Dr. Tariq Mahmood | `supervisor.ai@smartfyp.edu` | `password123` | Faculty Advisor |
| **Project Supervisor** | Prof. Ayesha Malik | `supervisor.web@smartfyp.edu` | `password123` | Faculty Advisor |
| **Project Supervisor** | Dr. Bilal Ahmed | `supervisor.cyber@smartfyp.edu` | `password123` | Faculty Advisor |
| **Student Team Leader** | Hamza Ali | `leader.cs@smartfyp.edu` | `password123` | Team Lead (CS) |
| **Student Team Member** | Zainab Fatima | `member1.cs@smartfyp.edu` | `password123` | Team Member (CS) |
| **Student Team Member** | Usman Tariq | `member2.cs@smartfyp.edu` | `password123` | Team Member (CS) |
| **Student Team Leader** | Bilal Raza | `leader.se@smartfyp.edu` | `password123` | Team Lead (SE) |
| **Student Team Member** | Mahnoor Khan | `member1.se@smartfyp.edu` | `password123` | Team Member (SE) |
| **Student Team Leader** | Saad Siddiqui | `leader.ai@smartfyp.edu` | `password123` | Team Lead (AI) |
| **Student Team Leader** | Farhan Qureshi | `leader.cy@smartfyp.edu` | `password123` | Team Lead (Cyber) |

---

## REST API Reference

All protected endpoints require an `Authorization: Bearer <token>` header obtained from `/api/auth/login`.

### Authentication & Profiles (`/api/auth`)
* `POST /api/auth/login` — Authenticate user and return JWT + user profile.
* `POST /api/auth/forgot-password` — Generate secure reset token and dispatch email.
* `POST /api/auth/reset-password` — Validate token and set new compliant password.
* `PATCH /api/auth/updatePassword` — Update password for authenticated user session.
* `GET /api/auth/email-status` — Diagnose Nodemailer SMTP transport connectivity.

### Projects & Repositories (`/api/projects`)
* `GET /api/projects` — List projects (scoped to user role & department).
* `GET /api/projects/public` — Public gallery of approved and published capstone projects.
* `GET /api/projects/my-project` — Retrieve active project for logged-in student.
* `POST /api/projects` — Create/propose project (Admin, HOD, Supervisor).
* `PUT /api/projects/:id/approve` — Approve project proposal.
* `PUT /api/projects/:id/publish` — Publish completed project to public repository (Admin only).
* `PUT /api/projects/:id/complete` — Mark project completed for viva defence.

### Submissions & Reviews (`/api/submissions`)
* `GET /api/submissions` — List submissions (filtered by role, project, and status).
* `POST /api/submissions` — Upload milestone deliverable (Multipart FormData).
* `PUT /api/submissions/:id/resubmit` — Submit revised deliverable version.
* `PUT /api/submissions/:id/approve` — Review and approve submission with grade and score.
* `PUT /api/submissions/:id/forward` — Forward reviewed submission to next hierarchical tier.
* `POST /api/submissions/:id/feedback` — Submit formal commentary on deliverable.
* `POST /api/submissions/:id/plagiarism-check` — Trigger scan on submission document.

### Plagiarism & Authenticity (`/api/plagiarism`)
* `POST /api/plagiarism/upload-scan` — Upload and scan arbitrary `.pdf` or `.docx` document.
* `GET /api/plagiarism/sources` — List indexed benchmark literature and past theses.
* `POST /api/plagiarism/add-source` — Index a new thesis or journal text into the repository.
* `DELETE /api/plagiarism/sources/:id` — Remove an indexed reference source.

### Machine Learning Recommendations (`/api/recommendations`)
* `POST /api/recommendations` — Compute TF-IDF Cosine Similarity recommendations based on `query`, `domain`, and `techStack`.

### Assignments & Milestones (`/api/assignments`)
* `GET /api/assignments` — List departmental and course assignments.
* `POST /api/assignments` — Create new assignment with template file upload (Admin, HOD, Supervisor).
* `POST /api/assignments/:id/submit` — Submit student response to assignment.
* `POST /api/assignments/:id/feedback` — Provide grading and review on assignment submission.

### Users & Administration (`/api/users`)
* `GET /api/users` — Search and filter users by role and department.
* `POST /api/users` — Provision new user with automatic temporary password.
* `PUT /api/users/:id/toggle-status` — Enable or deactivate account.
* `POST /api/users/:id/reset-password` — Issue temporary password reset.
* `GET /api/users/supervisors` — List available faculty supervisors and their quotas.

### Announcements & Notices (`/api/announcements`)
* `GET /api/announcements` — List announcements targeted to user's role/department.
* `POST /api/announcements` — Broadcast notice with file attachment (Role hierarchy enforced).
* `DELETE /api/announcements/:id` — Delete announcement.

### Diagnostics & Monitoring
* `GET /api/health` — Check server status, database state, and project counts.
* `GET /api/test` — Inspect server environment configuration and database connectivity.
* `GET /api/dashboard/logs` — Fetch administrative audit logs (Admin only).

---

## Testing & Quality Assurance

SmartFYP maintains an automated test suite executed via **Vitest**. The tests validate security policies, role hierarchies, password compliance, and machine learning throughput.

Run the test suite:
```bash
npm test
```

### Test Suite Coverage Breakdown

```
 ✓ tests/unit/recommender.test.js (5 tests)
   - Dataset ingestion from fyp_projects.csv
   - Tokenization and stop-word filtering
   - Cosine similarity ranking and vocabulary extraction
   - Bounds checking and sub-50ms execution speed

 ✓ tests/unit/passwordValidator.test.js (8 tests)
   - Minimum length (8+ characters) enforcement
   - Uppercase, lowercase, numeric, and symbol checks
   - Compliant password generator reliability

 ✓ tests/unit/plagiarismChecker.test.js (4 tests)
   - Text parsing from raw buffers
   - Winnowing sliding window hash generation
   - Similarity calculation against academic corpus

 ✓ tests/integration/authMiddleware.test.js (4 tests)
   - Rejection of malformed or expired JWT tokens
   - Role-based authorization guard enforcement

 ✓ tests/functional/announcementHierarchy.test.js (1 test)
   - Enforcement of downward-only broadcast rules

 ✓ tests/non-functional/securityAndPerformance.test.js (2 tests)
   - 1000 password validations benchmarked in <100ms
   - 100 simulated document rankings in <50ms

 ✓ tests/regression/notificationAndRoles.test.js (1 test)
   - Multi-role query resolution for dual-role faculty

Test Files  7 passed (7)
Tests       25 passed (25)
Duration    ~3.4s
```

Run code quality linting:
```bash
npm run lint
```

---

## Deployment Guide

### Option 1: Cloud Run / Docker Container (Recommended)

SmartFYP includes native support for containerized deployments on Google Cloud Run or AWS ECS:

1. Build the container image:
   ```bash
   docker build -t smartfyp-app .
   ```
2. Run container binding to port 3000:
   ```bash
   docker run -p 3000:3000 -e MONGO_URI="your_mongodb_uri" -e JWT_SECRET="your_jwt_secret" smartfyp-app
   ```

### Option 2: Vercel

The project includes `vercel.json` and an `api/` directory configured for serverless execution:
1. Push repository to GitHub.
2. Import project into Vercel.
3. Configure `MONGO_URI` and `JWT_SECRET` under **Project Settings $\rightarrow$ Environment Variables**.
4. Deploy.

### Option 3: Traditional Linux VPS (Ubuntu / Debian + Nginx + PM2)

1. Install Node.js 20 and build the production bundle:
   ```bash
   npm install
   npm run build
   ```
2. Start the server using PM2 process manager:
   ```bash
   pm2 start server.js --name "smartfyp"
   pm2 startup
   pm2 save
   ```
3. Configure Nginx reverse proxy routing port 80/443 to `http://127.0.0.1:3000`.

---

## Security & Compliance

* **Cryptographic Salting**: All passwords hashed using `bcryptjs` with 10 salt rounds.
* **Stateless Token Authentication**: JSON Web Tokens with strict expiry, verified on every protected API route.
* **Temporary Password Lifecycle**: Automatically flags newly provisioned users with `isFirstLogin: true`, intercepting navigation until a compliant password is created.
* **Password Complexity Rules**: Enforces minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol.
* **Audit Logging**: Sensitive events (logins, status changes, contact forms, plagiarism checks) logged to the `SystemLog` collection with timestamp and client IP address.
* **File Upload Guardrails**: Multer restricts upload extensions (`.pdf`, `.docx`, `.doc`, `.pptx`, `.zip`), sanitizes stored filenames, and serves uploads through MIME-verified file routes.

### GitHub Pre-Push Security Checklist

Before pushing this repository to a public GitHub repository, verify the following:

1. **Verify `.gitignore` protects secrets**: Ensure `.env` is listed in your `.gitignore` so your real MongoDB URI, JWT secret, and email credentials are not committed to git history.
2. **Never commit raw API keys or passwords**: Confirm `.env` is NOT tracked using `git status`. Only commit `.env.example` with blank or dummy values.
3. **Change default database passwords**: If deploying to a public server or using an existing live database, update or reset all pre-seeded evaluation passwords (`password123`).
4. **Scrub test files and uploads**: Verify that the `uploads/` directory does not contain sensitive personal student documents before committing.
5. **Protect your production branches**: If using GitHub Actions, store all credentials as encrypted GitHub Repository Secrets (`MONGO_URI`, `JWT_SECRET`, etc.).

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Developed for academic institutions and educational communities to advance collaborative final year project management. Contributions, issues, and feature requests are welcome!
