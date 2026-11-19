# InternTrack — AI-Powered Internship & Recruitment Portal

A full-stack three-portal internship management platform built with **React**, **Python Flask**, **SQLite**, **Scikit-Learn (NLP AI Resume Screening)**, and **Docker**.

## Portals & Core Features

1. **Student Portal**
   - OTP email verification, JWT login, and password reset.
   - **Explore Companies**: Searchable grid of 18+ companies displaying only logos and company names.
   - **Company & Internship Pages**: Paid/unpaid roles, stipend, duration, mode, eligibility, selection stages, and required documents.
   - **Smart Application Flow**: Profile auto-fill, mandatory PDF resume upload, auto-generated `INT-2026-XXXX` reference ID, and instant email confirmation.
   - **My Applications**: Real-time tracking across 8 statuses (`Applied`, `Under Review`, `Shortlisted`, `Assessment`, `Interview`, `Selected`, `Rejected`, `Withdrawn`) with complete status history and company feedback.
   - **Interviews & Offers**: View scheduled interview rounds/links, download offer letters, and accept/decline offers with joining checklists.
   - **In-App Notification Centre**: Synchronized with automated SMTP email triggers across 10 lifecycle events.

2. **Company HR Portal**
   - Publish new internship roles with custom selection stages and skill requirements.
   - **AI Resume Screener**: Automatically extracts text from uploaded PDF resumes (`pypdf`) and ranks candidates using TF-IDF cosine similarity (`scikit-learn`).
   - Update candidate statuses, schedule interviews, and issue offer letters—automatically triggering student emails and in-app notifications.

3. **Platform Admin Portal**
   - Monitor platform-wide metrics (students, companies, internships, applications).
   - Verify or suspend company listings and manage registered accounts.

---

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, React Router, Axios, Lucide Icons
- **Backend**: Python 3.11, Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Mail, Bcrypt
- **AI / NLP**: `scikit-learn` (TF-IDF Vectorizer + Cosine Similarity), `pypdf`
- **DevOps**: Docker, Docker Compose, GitHub Actions CI/CD

---

## Quick Start (Local Development)

### 1. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python run.py