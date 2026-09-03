# SmartFYP: Role-Based Access Control (RBAC) & CRUD Permissions Specification

This document provides a formal, comprehensive reference of all roles, permissions, workflow privileges, and CRUD (Create, Read, Update, Delete) capabilities within the **SmartFYP** (Final Year Project Management System). It is structured for academic presentations, system audits, and examiner evaluations.

---

## 1. System Role Hierarchy

The platform implements a multi-tiered hierarchical Role-Based Access Control (RBAC) architecture designed for academic institutions:

```
                  ┌──────────────────────┐
                  │        ADMIN         │
                  │  (Institution-Wide) │
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │         HOD          │
                  │ (Department-Locked)  │
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │      SUPERVISOR      │
                  │(Assigned / Dept-Wide)│
                  └──────────┬───────────┘
                             │
             ┌───────────────┴───────────────┐
             │                               │
  ┌──────────▼───────────┐       ┌───────────▼───────────┐
  │     TEAM LEADER      │       │      TEAM MEMBER      │
  │ (Project & Task Lead)│       │  (Execution & Member) │
  └──────────────────────┘       └───────────────────────┘
```

---

## 2. Comprehensive CRUD Permissions by Role

### 1. Admin (System & Institutional Level)

* **Department Management**:
  * **Create**: Register new academic departments with code, name, and description.
  * **Read**: View, search, and filter all departments institution-wide.
  * **Update**: Edit department titles, codes, descriptions, and assign or replace the Head of Department (HOD).
  * **Deactivate / Activate**: Toggle active/inactive status of any academic department.
  * **Delete**: Permanently remove departments and reassign or archive related records.

* **User Management**:
  * **Create**: Create users across any role (Admin, HOD, Supervisor, Team Leader, Team Member) and any department.
  * **Read**: Search, inspect, and filter user directories across the entire institution.
  * **Update**: Edit user profiles, contact details, designations, and departmental affiliations.
  * **Deactivate / Activate**: Suspend or restore access for any user account.
  * **Account Security**: Trigger manual password resets, issue temporary credentials, and resend welcome onboarding emails.
  * **Delete**: Permanently delete any user account from the system.

* **Project & Repository Oversight**:
  * **Create**: Initialize and register project records across any department.
  * **Read**: Unrestricted access to all project records, proposals, archives, and academic sessions.
  * **Update**: Modify project titles, abstracts, assigned supervisors, grading scores, and phases.
  * **Workflow & Archiving**: Approve, reject, activate, mark completed, or publish projects to the public showcase repository.
  * **Delete**: Permanently delete any project record and its associated documents.

* **Announcements & Broadcasts**:
  * **Create**: Publish institutional announcements broadcast to all departments and all user roles.
  * **Read**: View all global, departmental, and team announcements.
  * **Update**: Edit content, target audience, or attachments of any announcement.
  * **Delete**: Delete any announcement system-wide.

* **Assignments, Milestones & Documentation**:
  * **Create**: Publish institution-wide or departmental milestone assignments with submission guidelines and deadlines.
  * **Read**: Monitor all milestone submissions, revision histories, and team progress.
  * **Review & Approval**: Provide written feedback, review supervisor/HOD notes, run AI plagiarism scans, and give final sign-off on approved documentation.

* **Document Templates**:
  * **Create, Read, Update, Delete**: Upload, maintain, and remove institutional document templates (e.g., SRS, SDS, Interim Reports, Final Thesis).

* **System Logs & Audit Trails**:
  * **Read**: Inspect system operation logs, authentication events, and audit histories.
  * **Notifications**: Receive system alerts, workflow escalations, and security notifications.

---

### 2. Head of Department (HOD)

* **Departmental Scope**:
  * **Read**: Access real-time department statistics, faculty allocations, project progression metrics, and student enrollments for their assigned department.
  * *(Restricted: Cannot create, deactivate, or delete academic departments; this is Admin-only).*

* **Department User Management**:
  * **Create**: Register new Supervisors, Team Leaders, and Team Members within their assigned department.
  * **Read**: View and search faculty and student directories belonging to their department.
  * **Update**: Edit user profiles, contact numbers, student registration numbers, and designations within the department.
  * **Deactivate / Activate**: Enable or suspend student and supervisor accounts within their department.
  * **Account Security**: Issue password reset requests and resend credentials to departmental members.
  * **Delete**: Remove user accounts belonging to their department.

* **Project Management (Department-Locked)**:
  * **Create**: Create new FYP project records and assign supervisors and student teams within their department.
  * **Read**: View and audit all current and historical project records belonging to their department.
  * **Update**: Reallocate supervisors, update project milestone phases, and modify project metadata.
  * **Workflow & Approvals**: Review supervisor-approved project proposals, grant official departmental approval or rejection, activate projects, and mark projects as completed.
  * **Delete**: Delete projects belonging to their department.

* **Announcements**:
  * **Create**: Post departmental announcements and memos targeted to faculty and students of their department.
  * **Read**: View global institutional announcements and departmental notices.
  * **Update / Delete**: Edit or delete announcements created by their department.

* **Assignments & Submissions**:
  * **Create**: Create departmental milestone assignments, deadlines, and submission requirements.
  * **Read**: Access all student submissions and supervisor reviews within the department.
  * **Review & Verification**: Review supervisor-forwarded submissions, trigger automated plagiarism analysis, provide evaluative feedback, and grant final departmental documentation approval.

* **Document Templates**:
  * **Create, Read, Update, Delete**: Manage official templates and report formats for their specific department.

* **Notifications**:
  * Receive alerts when proposals are submitted, when supervisors approve items, and when milestone deadlines approach.

---

### 3. Supervisor (Faculty Advisor)

* **Project Supervision**:
  * **Create**: Submit new project proposals and define project scopes.
  * **Read**: Access assigned project groups and read department project repository records.
  * **Update**: Update supervised project progress percentages, current phases, and preliminary scores/grades.
  * **Workflow Actions**: Approve or reject initial team proposals, forward proposals to HOD, and recommend completed projects for final evaluation.
  * *(Restricted: Cannot delete projects).*

* **Sprint & Task Management**:
  * **Create**: Create and assign sprint deliverables, tasks, and action items to supervised team leaders and members.
  * **Read**: Monitor Kanban boards, sprint backlogs, and task completion rates for all supervised teams.
  * **Update**: Reassign tasks, change due dates, update task descriptions, and adjust priority levels.
  * **Review & Evaluation**: Review uploaded task deliverables, request revisions, and mark tasks as approved/completed.
  * **Delete**: Delete tasks created under their supervised projects.

* **Assignments & Milestone Deliverables**:
  * **Create**: Create project-specific assignments, review checkpoints, and interim deliverable requirements.
  * **Read**: View student uploaded documents, viva slides, code links, and version history.
  * **Review & Feedback**: Provide detailed written feedback, assign evaluation grades, initiate automated plagiarism scans, approve/reject submissions, and forward validated documentation to the HOD.

* **Announcements**:
  * **Create**: Post announcements, meeting schedules, and sprint notices directed to supervised project groups.
  * **Read**: View institutional, departmental, and personal announcements.
  * **Update / Delete**: Manage announcements created by themselves.

* **Users**:
  * **Read**: View student directory and departmental faculty list.

* **Notifications**:
  * Receive notifications when students submit tasks, turn in assignments, resubmit revisions, or add discussion comments.

---

### 4. Team Leader (Student Project Lead)

* **Project Information**:
  * **Read**: Access complete project details, supervisor allocations, milestones, and grading rubrics.
  * **Update**: Update project metadata (project abstract, technologies stack, GitHub repository URL, live application URL, team description).
  * *(Restricted: Cannot delete project records or alter assigned faculty).*

* **Team Task & Sprint Management**:
  * **Create**: Create internal sprint tasks, sub-tasks, and action items for team members.
  * **Read**: Track team Kanban board, member contributions, and upcoming internal deadlines.
  * **Update**: Modify task descriptions, reassign tasks among team members, and update task priority levels.
  * **Review & Turn-in**: Review files uploaded by team members and submit completed tasks to the supervisor.
  * **Delete**: Delete internal tasks created by the team.

* **Assignments & Submissions**:
  * **Read**: View assignment rubrics, guidelines, deadlines, and download official institutional templates.
  * **Create / Submit**: Upload documents, source code packages, and presentation decks on behalf of the project team.
  * **Resubmit**: Upload corrected documents and revised deliverables when requested by Supervisor or HOD.
  * **Plagiarism Self-Check**: Initiate plagiarism scans on uploaded document drafts before formal submission.
  * **Feedback**: View evaluation scores, inline critique, and approval comments from Supervisor, HOD, and Admin.

* **Announcements**:
  * **Create**: Publish internal team notices and meeting reminders for project members.
  * **Read**: View institutional, departmental, supervisor, and team announcements.
  * **Update / Delete**: Manage announcements created within the team.

* **Notifications**:
  * Receive alerts on task assignments, supervisor feedback, evaluation grades, and milestone deadlines.

---

### 5. Team Member (Student)

* **Project Information**:
  * **Read**: View project information, team members, supervisor profile, evaluation scores, and milestone roadmap.

* **Task Execution**:
  * **Read**: View assigned tasks, task instructions, priorities, and deadlines on the Kanban board.
  * **Update**: Change status of assigned tasks (*To Do*, *In Progress*, *Under Review*, *Completed*).
  * **Submit**: Attach deliverable files, paste commit links, and submit completed work for review.

* **Assignments & Submissions**:
  * **Read**: Access assignment briefs, guidelines, deadlines, and downloadable templates.
  * **Submit / Resubmit**: Submit or update deliverable files on behalf of the team.
  * **Plagiarism Analysis**: View similarity reports and AI plagiarism scan scores.
  * **Feedback**: Read supervisor and HOD evaluation remarks and mark feedback as acknowledged.

* **Announcements**:
  * **Read**: Read announcements posted by Admin, HOD, Supervisor, and Team Leader.

* **Notifications**:
  * Receive alerts for new task assignments, upcoming deadlines, feedback releases, and project status updates.

---

## 3. Quick Reference CRUD Permissions Matrix

| Entity / Operation | Admin | HOD | Supervisor | Team Leader | Team Member |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Departments** | | | | | |
| • Create / Delete / Deactivate | **CRUD** | None | None | None | None |
| • View Department Profile | All | Own Dept | Own Dept | Own Dept | Own Dept |
| **Users** | | | | | |
| • Create / Delete Users | All Depts | Own Dept | None | None | None |
| • Edit User Profile | All Depts | Own Dept | Own Profile | Own Profile | Own Profile |
| • Deactivate / Activate Users | All Depts | Own Dept | None | None | None |
| • Reset Passwords / Resend Invite | All Depts | Own Dept | None | None | None |
| **Projects** | | | | | |
| • Create Project | Yes | Yes (Dept) | Yes (Proposed) | None | None |
| • View Projects | All Depts | Own Dept | Assigned + Dept | Own Project | Own Project |
| • Edit Project Details | All | Own Dept | Supervised | Details Only | None |
| • Delete Project | All | Own Dept | None | None | None |
| • Change Supervisor / Allocation | Yes | Yes (Dept) | None | None | None |
| • Approve / Reject Proposal | Yes | Yes (Dept) | Yes (1st Level) | None | None |
| • Publish to Public Showcase | Yes | None | None | None | None |
| **Tasks & Sprints** | | | | | |
| • Create Tasks | Yes | Yes | Supervised Teams | Own Team | None |
| • View Tasks | All | Own Dept | Supervised Teams | Own Team | Own Team |
| • Edit / Reassign Tasks | Yes | Yes | Supervised Teams | Own Team | Own Status |
| • Review & Approve Tasks | Yes | Yes | Yes | Team Level | None |
| • Delete Tasks | Yes | Yes | Supervised Teams | Own Team | None |
| **Assignments & Milestones** | | | | | |
| • Create Assignments | Global/Dept | Own Dept | Supervised Groups| None | None |
| • View Submissions | All | Own Dept | Supervised Groups| Own Team | Own Team |
| • Submit Deliverables | None | None | None | Yes | Yes |
| • Resubmit Revisions | None | None | None | Yes | Yes |
| • Evaluate / Grade Submissions | Yes | Yes (Final) | Yes (Review) | None | None |
| • Run Plagiarism Checks | Yes | Yes | Yes | Yes (Self-check)| Yes (Self-check)|
| **Document Templates** | | | | | |
| • Create / Edit / Delete | All | Own Dept | None | None | None |
| • Download / View Templates | All | All | All | All | All |
| **Announcements** | | | | | |
| • Create Global Broadcasts | Yes | None | None | None | None |
| • Create Departmental Notices | Yes | Yes | None | None | None |
| • Create Team / Group Notices | Yes | Yes | Yes | Yes | None |
| • Delete Announcements | Any | Own | Own | Own | None |
| **System Audit & Logs** | | | | | |
| • Access System Audit Logs | Yes | None | None | None | None |
| • Receive Notifications | Yes | Yes | Yes | Yes | Yes |

---

## 4. Key Workflows & Two-Tier Approval Model

### A. Project Proposal Approval Pipeline
1. **Initiation**: Student Team or Supervisor submits a new project proposal.
2. **First-Tier Review (Supervisor)**: The designated Supervisor inspects scope, feasibility, and objectives. The Supervisor can approve or reject with comments.
3. **Second-Tier Review (HOD)**: Once supervisor-approved, the proposal enters the HOD queue. The HOD evaluates departmental standards and grants final approval.
4. **Activation**: The project status changes to `Active`, unlocking milestone assignment submissions and sprint task tracking.

### B. Milestone Documentation & Plagiarism Review Pipeline
1. **Submission**: Team Leader or Team Member submits report/code documentation.
2. **Similarity Analysis**: The system computes similarity and scans for AI-generated text.
3. **Supervisor Evaluation**: The Supervisor reviews content, checks plagiarism scores, and either:
   - Requests revisions (re-opening submission for students).
   - Approves and forwards the documentation to the HOD.
4. **HOD Final Sign-off**: HOD reviews documentation and signs off. Admin can inspect or override at any stage.

---

*Document compiled for the SmartFYP Final Year Project Management System.*
