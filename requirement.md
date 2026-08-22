# RevAudit Portfolio & Presentation Platform --- System Requirements

## 1. Project Overview

-   **Project Title:** RevAudit: Statistical Audit of Code-Review
    Consistency and Workload in Open-Source Repositories
-   **Team Name:** Team ArchCoders
-   **Course / Lab:** UCS503 Software Engineering Lab
-   **Instructor / Advisor:** Dr. Sukhpal Singh
-   **Team Members:**
    1.  Dheeraj Kumar (1024170136) --- Team Lead & Architecture
    2.  Vaibhav Goyal (1024170002) --- Backend & Stats Modeling
    3.  Adityaraj Singh (1024170148) --- Frontend & Visualizations
    4.  Sparsh Khandelwal (1024170139) --- Data Pipeline & Documentation

## 2. Project Scope

RevAudit is a software-only system that analyzes pull-request and
code-review histories from open-source repositories to identify
statistically unusual differences in review effort after accounting for
relevant pull-request, repository, contributor, reviewer-workload, and
time-related characteristics.

The website is the team's permanent public project website and must
remain live and updated throughout the semester.

The website must present RevAudit as a serious
software-engineering/research project while using a Pac-Man-inspired
8-bit arcade visual identity.

## 3. Mandatory Architecture Constraints

### Hosting / Compute

Use self-configured compute such as: - AWS EC2 - A self-configured VPS -
A team-managed VM

Do **not** use Vercel, Render, Firebase, or similar platforms that hide
most of the backend/server setup.

### Frontend

The frontend may: - Be statically hosted on GitHub Pages, or - Be served
through the team's own Nginx/Caddy setup.

### Backend

Use a team-configured backend service such as FastAPI or Express.

The backend must handle: - Authentication - File ingestion -
Presentation metadata - Version tracking - Publishing

### Object Storage

Use AWS S3 or another approved S3-compatible object-storage service
for: - Presentation decks - PDFs - Images - Uploaded assets - Raw
artifact folders/files

The team is responsible for checking current free-tier limits and
avoiding unexpected charges.

## 4. Public Routes

### `/`

Public homepage.

### `/project`

Project overview, problem, objectives, hypotheses and ethical
boundaries.

### `/team`

Team members, roles and instructor.

### `/presentations`

Persistent presentation archive and version history.

### `/presentations/planning-v1`

Planning Presentation v1.

Future presentation routes must remain separate and must not overwrite
earlier versions.

### `/architecture`

Frontend/backend/storage/deployment architecture.

### `/admin`

Authenticated instructor/admin interface.

## 5. Homepage Requirements

The homepage must contain:

### Hero

-   RevAudit wordmark
-   Full project title
-   Short scope statement
-   Pac-Man/pixel arcade visual identity
-   CTA to explore the project
-   CTA to Planning Presentation v1

### Project Meta

Show: - Team: ArchCoders - Course: UCS503 Software Engineering Lab -
Instructor: Dr. Sukhpal Singh - Current presentation/version information
where applicable

### Team Roster

Display all four members: - Full name - Roll number - Assigned role -
GitHub profile where available

Use 8-bit Pac-Man ghost-inspired avatars.

### Project Summary

Explain the problem of variation in code-review effort and RevAudit's
objective of turning that variation into a measurable, evidence-backed
signal.

### System Overview

Show the high-level flow:

**GitHub → Ingestion → PostgreSQL → Statistical Engine → FastAPI →
Dashboard**

### Quick Navigation

Provide links to: - Project - Team - Planning Presentation v1 -
Presentation archive - Architecture - System demo where available

## 6. Project Content Requirements

The website must remain consistent with the approved RevAudit scope.

The project should communicate the following:

### Problem

Existing analytics expose activity such as response time and comment
counts but do not adequately determine whether review effort is
statistically unusual after relevant factors are controlled.

### Hypotheses

-   **H1:** Review effort correlates with more than PR size.
-   **H2:** Non-code factors leave a detectable signature.
-   **H3:** Genuine process shifts are detectable, not just noise.

### Data

The planned system should use: - At least 15 active open-source
repositories - At least 5,000 pull requests - Pull requests - Reviews -
Review comments - Issue comments - Bot activity - Contributor history -
Reviewer workload

Reviews, review comments and issue comments must remain semantically
distinct.

### Model

Use a hierarchical/mixed-effects model rather than relying only on one
global regression.

The model considers repository-, reviewer-, and pull-request-level
variation.

### Baselines

Include: - Global pooled regression - Existing analytics/activity-count
baseline - Published research baseline

### Evaluation

Include: - Controlled injected shifts with known ground truth - Held-out
repository testing - Uncertainty/confidence information for detected
patterns

### Ethics

RevAudit must not: - Label an individual reviewer as biased, unfair or
discriminatory. - Publish individual contributor/reviewer rankings. -
Present a statistical pattern as a definitive accusation.

Detected patterns should be presented as evidence requiring human
investigation, with uncertainty and supporting evidence.

## 7. Planning Presentation v1

Route:

`/presentations/planning-v1`

The presentation must cover:

1.  Problem Statement & Invisible Review Variation
2.  Hypotheses --- H1, H2, H3
3.  Related Systems
4.  Data Schema & Semantics
5.  Hierarchical / Mixed-Effects Model Design
6.  Baseline Comparisons
7.  Evaluation Protocol
8.  Ethical Boundaries & Privacy Protections
9.  System & Deployment Architecture
10. 17-Week Plan & Gantt Chart

Every presentation page must show: - Presentation title - Presentation
date - Version - Authors

The presentation can be displayed as native web slides, an embedded
presentation, or another website-based presentation view.

## 8. Presentation Archive & Versioning

Route:

`/presentations`

Maintain an immutable archive.

Examples:

``` text
Planning Presentation v1.0
Planning Presentation v2.0
Mid-term Presentation
Final Presentation
```

Publishing a new version must never delete or replace an older version.

Each published version should retain: - Title - Version - Release date -
Authors - Change summary - Artifact reference - Permanent public route

## 9. Instructor / Admin Portal

Route:

`/admin`

### Authentication

Provide secure authenticated access for authorized instructors/admins.

Token/session-based authentication may be used.

### Upload

Support: - Drag-and-drop files - Slide bundles - Folders where supported
by the upload implementation

### Metadata

Require: - Title - Version - Release date - Change summary

### Publishing

The publishing workflow is:

``` text
Admin Login
    ↓
Drag & Drop Upload
    ↓
Metadata Entry
    ↓
Backend Validation
    ↓
S3/Object Storage Upload
    ↓
Database Version Record
    ↓
Permanent Route Generation
    ↓
Publish
```

Publishing must not modify previous versions.

## 10. Live Demonstration Acceptance Criteria

The live planning presentation must demonstrate:

1.  Open the public website in a clean browser session.
2.  Navigate through the homepage.
3.  Open Planning Presentation v1.
4.  Sign in to the instructor/admin interface.
5.  Upload a file or folder using drag-and-drop.
6.  Enter title, version, date and change summary.
7.  Publish the uploaded material.
8.  Open the new permanent page.
9.  Demonstrate that the earlier version is still accessible.

A non-working mock-up is insufficient.

## 11. Team Information

Use these team assignments unless explicitly updated later:

  Member              Roll Number   Role
  ------------------- ------------- -------------------------------
  Dheeraj Kumar       1024170136    Team Lead & Architecture
  Vaibhav Goyal       1024170002    Backend & Stats Modeling
  Adityaraj Singh     1024170148    Frontend & Visualizations
  Sparsh Khandelwal   1024170139    Data Pipeline & Documentation

Instructor:

**Dr. Sukhpal Singh**

Do not invent additional roles or credentials.

## 12. Responsive & Accessibility Requirements

The website must support: - Desktop - Laptop - Tablet - Mobile

The pixel theme must not compromise readability.

Requirements: - High text/background contrast - Keyboard-accessible
controls - Visible focus states - Readable body typography - Animations
that do not obstruct content - Important information must not depend
only on color

## 13. Initial Scope vs Later Scope

### Initial website implementation

Prioritize: - Homepage - Project page - Team section/page - Planning
Presentation v1 - Presentation archive structure - Visual identity -
Architecture page

### Later implementation

Add: - Admin authentication - Upload system - S3 integration -
Database-backed version metadata - Publishing workflow - Full
dashboard - GitHub ingestion and statistical analysis

Do not create fake analytics results or pretend incomplete features are
operational.

## 14. Non-Goals

Do not initially build: - Public contributor rankings - Individual bias
scores - A full GitHub analytics product - Fake statistical results - A
literal Pac-Man game - Unnecessary user accounts

The Pac-Man aesthetic is a visual identity, not a game mechanic.

## 15. Source of Truth

The website requirements and project scope are based on:

1.  UCS503 Project Planning Presentation and Team Website Requirements
2.  RevAudit Planning Presentation
3.  RevAudit feasibility/approval communication

If a requirement is not established by these sources or this
specification, do not invent it as an existing project fact.
