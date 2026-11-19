from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="student")  # student | hr | admin
    is_verified = db.Column(db.Boolean, default=False)
    otp_code = db.Column(db.String(6), nullable=True)
    otp_expiry = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student_profile = db.relationship("StudentProfile", backref="user", uselist=False, cascade="all, delete-orphan")
    company = db.relationship("Company", backref="hr_user", uselist=False, cascade="all, delete-orphan")


class StudentProfile(db.Model):
    __tablename__ = "student_profiles"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    college = db.Column(db.String(150), default="")
    branch = db.Column(db.String(100), default="")
    year = db.Column(db.String(20), default="")
    phone = db.Column(db.String(20), default="")
    skills_json = db.Column(db.Text, default="[]")
    resume_url = db.Column(db.String(255), nullable=True)


class Company(db.Model):
    __tablename__ = "companies"
    id = db.Column(db.Integer, primary_key=True)
    hr_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    name = db.Column(db.String(120), nullable=False)
    logo_url = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    website = db.Column(db.String(255), nullable=False)
    is_verified = db.Column(db.Boolean, default=True)
    internships = db.relationship("Internship", backref="company", lazy=True, cascade="all, delete-orphan")


class Internship(db.Model):
    __tablename__ = "internships"
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("companies.id"), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    is_paid = db.Column(db.Boolean, default=True)
    stipend = db.Column(db.String(50), default="Unpaid")
    duration = db.Column(db.String(50), nullable=False)
    work_mode = db.Column(db.String(50), nullable=False)  # Remote | On-site | Hybrid
    eligibility = db.Column(db.Text, nullable=False)
    required_skills_json = db.Column(db.Text, default="[]")
    deadline = db.Column(db.String(50), nullable=False)
    vacancies = db.Column(db.Integer, default=1)
    hiring_stages_json = db.Column(db.Text, default='["Resume Screening", "Technical Interview", "HR Round"]')
    required_docs_json = db.Column(db.Text, default='["Resume"]')
    instructions = db.Column(db.Text, default="")
    applications = db.relationship("Application", backref="internship", lazy=True, cascade="all, delete-orphan")


class Application(db.Model):
    __tablename__ = "applications"
    id = db.Column(db.Integer, primary_key=True)
    reference_id = db.Column(db.String(30), unique=True, nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    internship_id = db.Column(db.Integer, db.ForeignKey("internships.id"), nullable=False)
    status = db.Column(db.String(30), default="Applied")
    ai_match_score = db.Column(db.Float, default=0.0)
    resume_path = db.Column(db.String(255), nullable=False)
    extra_docs_json = db.Column(db.Text, default="{}")
    answers_json = db.Column(db.Text, default="{}")
    feedback = db.Column(db.Text, default="")
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)

    history = db.relationship("ApplicationHistory", backref="application", lazy=True, cascade="all, delete-orphan")
    interviews = db.relationship("Interview", backref="application", lazy=True, cascade="all, delete-orphan")
    offer = db.relationship("Offer", backref="application", uselist=False, cascade="all, delete-orphan")


class ApplicationHistory(db.Model):
    __tablename__ = "application_history"
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey("applications.id"), nullable=False)
    status = db.Column(db.String(30), nullable=False)
    remarks = db.Column(db.Text, default="")
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)


class Interview(db.Model):
    __tablename__ = "interviews"
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey("applications.id"), nullable=False)
    round_name = db.Column(db.String(100), nullable=False)
    scheduled_at = db.Column(db.String(50), nullable=False)
    meeting_link_or_venue = db.Column(db.String(255), nullable=False)
    instructions = db.Column(db.Text, default="")
    status = db.Column(db.String(20), default="Upcoming")  # Upcoming | Completed | Missed


class Offer(db.Model):
    __tablename__ = "offers"
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey("applications.id"), unique=True, nullable=False)
    offer_letter_url = db.Column(db.String(255), nullable=False)
    stipend = db.Column(db.String(50), nullable=False)
    duration = db.Column(db.String(50), nullable=False)
    acceptance_deadline = db.Column(db.String(50), nullable=False)
    joining_date = db.Column(db.String(50), nullable=False)
    joining_instructions = db.Column(db.Text, default="")
    joining_docs_json = db.Column(db.Text, default="[]")
    status = db.Column(db.String(30), default="Offer Received")


class Notification(db.Model):
    __tablename__ = "notifications"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)