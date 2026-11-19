import os
import json
import bcrypt
from datetime import datetime, timedelta
import app.models as models
from app.models import (
    db, User, StudentProfile, Company, Internship,
    Application, Interview, Offer, Notification
)

HistoryModel = next(
    (
        cls for name, cls in vars(models).items()
        if isinstance(cls, type) and issubclass(cls, db.Model) and "History" in name
    ),
    None,
)


def safe_create(model_cls, **kwargs):
    valid_cols = {c.key for c in model_cls.__table__.columns}
    filtered = {k: v for k, v in kwargs.items() if k in valid_cols}
    return model_cls(**filtered)


def logo_url(domain):
    return f"https://www.google.com/s2/favicons?domain={domain}&sz=128"


COMPANIES_DATA = [
    ("Google", "google.com", "Global leader in search, cloud, and AI.",
     "https://careers.google.com", "Software Engineering Intern",
     True, "₹80,000/month", "3 Months", "Hybrid",
     ["Python", "C++", "Data Structures", "Algorithms"]),
    ("Microsoft", "microsoft.com", "Empowering every person and org.",
     "https://careers.microsoft.com", "SWE Intern - Azure Cloud",
     True, "₹75,000/month", "2 Months", "Hybrid",
     ["C#", ".NET", "React", "Distributed Systems"]),
    ("Amazon", "amazon.com", "Customer-centric e-commerce and cloud.",
     "https://amazon.jobs", "SDE Intern",
     True, "₹70,000/month", "6 Months", "On-site",
     ["Java", "AWS", "System Design", "SQL"]),
    ("Razorpay", "razorpay.com", "Full-stack financial solutions.",
     "https://razorpay.com/jobs", "Backend Engineering Intern",
     True, "₹45,000/month", "6 Months", "Hybrid",
     ["Go", "Python", "REST APIs", "MySQL"]),
    ("Zerodha", "zerodha.com", "India's largest retail stockbroker.",
     "https://zerodha.com/careers", "Full Stack Web Intern",
     True, "₹40,000/month", "3 Months", "On-site",
     ["Go", "Vue.js", "PostgreSQL", "Linux"]),
    ("Swiggy", "swiggy.com", "On-demand hyperlocal delivery platform.",
     "https://careers.swiggy.com", "Data Science Intern",
     True, "₹35,000/month", "3 Months", "Hybrid",
     ["Python", "Machine Learning", "Pandas", "SQL"]),
    ("Zomato", "zomato.com", "Connecting customers with restaurants.",
     "https://zomato.com/careers", "Frontend React Intern",
     True, "₹35,000/month", "3 Months", "On-site",
     ["React", "TypeScript", "CSS", "Redux"]),
    ("CRED", "cred.club", "Members-only creditworthy rewards club.",
     "https://careers.cred.club", "Product Design & UI Intern",
     True, "₹50,000/month", "3 Months", "On-site",
     ["Figma", "Prototyping", "Design Systems"]),
    ("Atlassian", "atlassian.com", "Makers of Jira, Confluence, Trello.",
     "https://atlassian.com/company/careers", "Software Developer Intern",
     True, "₹85,000/month", "2 Months", "Remote",
     ["Java", "Spring Boot", "React", "Git"]),
    ("Adobe", "adobe.com", "Digital media and experience solutions.",
     "https://adobe.com/careers", "AI/ML Research Intern",
     True, "₹65,000/month", "3 Months", "Hybrid",
     ["PyTorch", "Computer Vision", "Python"]),
    ("Flipkart", "flipkart.com", "India's homegrown e-commerce giant.",
     "https://flipkartcareers.com", "SDE Intern",
     True, "₹55,000/month", "2 Months", "On-site",
     ["Java", "Microservices", "Kafka", "Redis"]),
    ("Postman", "postman.com", "Leading API collaboration platform.",
     "https://postman.com/company/careers", "API Engineering Intern",
     True, "₹50,000/month", "6 Months", "Hybrid",
     ["Node.js", "JavaScript", "REST", "GraphQL"]),
    ("PhonePe", "phonepe.com", "Digital payments and financial app.",
     "https://phonepe.com/careers", "Android Developer Intern",
     True, "₹45,000/month", "6 Months", "On-site",
     ["Kotlin", "Android SDK", "MVVM"]),
    ("Freshworks", "freshworks.com", "Cloud customer engagement software.",
     "https://freshworks.com/company/careers", "Full Stack Intern",
     True, "₹30,000/month", "6 Months", "Hybrid",
     ["Ruby on Rails", "React", "PostgreSQL"]),
    ("Zoho", "zoho.com", "Suite of cloud software and SaaS apps.",
     "https://zoho.com/careers", "Software Developer Intern",
     True, "₹25,000/month", "6 Months", "On-site",
     ["Java", "C", "HTML", "JavaScript"]),
    ("Infosys", "infosys.com", "Digital services and consulting leader.",
     "https://infosys.com/careers", "InStep Systems Intern",
     True, "₹20,000/month", "2 Months", "On-site",
     ["Python", "SQL", "Cloud Basics"]),
    ("Mozilla", "mozilla.org", "Non-profit backing open-source web.",
     "https://mozilla.org/careers", "Open Source Rust Intern",
     False, "Unpaid (Open Source)", "3 Months", "Remote",
     ["Rust", "C++", "Git", "WebAssembly"]),
    ("Linux Foundation", "linuxfoundation.org", "Open-source ecosystems.",
     "https://linuxfoundation.org", "Kernel Mentorship Intern",
     False, "Unpaid (Certificate + Swag)", "3 Months", "Remote",
     ["C", "Linux Kernel", "Shell Scripting"]),
]


def create_sample_pdf():
    os.makedirs("uploads", exist_ok=True)
    pdf_path = os.path.join("uploads", "suhani_resume_demo.pdf")
    if not os.path.exists(pdf_path):
        minimal_pdf = (
            b"%PDF-1.4\n1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n"
            b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n"
            b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>endobj\n"
            b"xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n"
            b"0000000058 00000 n \n0000000115 00000 n \n"
            b"trailer<< /Size 4 /Root 1 0 R >>\nstartxref\n183\n%%EOF"
        )
        with open(pdf_path, "wb") as f:
            f.write(minimal_pdf)
    return "suhani_resume_demo.pdf"


def seed_initial_data():
    if Company.query.first():
        return

    sample_resume = create_sample_pdf()
    pw_hash = bcrypt.hashpw(b"Admin@123", bcrypt.gensalt()).decode("utf-8")

    admin = safe_create(
        User,
        email="admin@interntrack.com",
        password_hash=pw_hash,
        role="admin",
        is_verified=True,
    )
    hr_user = safe_create(
        User,
        email="hr@google.com",
        password_hash=pw_hash,
        role="hr",
        is_verified=True,
    )
    student = safe_create(
        User,
        email="suhani@nie.ac.in",
        password_hash=pw_hash,
        role="student",
        is_verified=True,
    )
    db.session.add_all([admin, hr_user, student])
    db.session.flush()

    db.session.add(safe_create(
        StudentProfile,
        user_id=student.id,
        full_name="Suhani R",
        phone="+91 98765 43210",
        college="The National Institute of Engineering (NIE), Mysuru",
        branch="CSE",
        grad_year=2028,
        graduation_year=2028,
        cgpa=9.15,
        skills="Python, React, Java, C++, SQL, Machine Learning, Flask, Git",
        portfolio_url="https://github.com/suhani-dev",
        default_resume_path=sample_resume,
    ))

    internships_map = {}
    for idx, item in enumerate(COMPANIES_DATA):
        (name, domain, desc, web, role_title,
         is_paid, stipend, duration, mode, skills) = item

        company = safe_create(
            Company,
            hr_user_id=hr_user.id if idx == 0 else None,
            name=name,
            logo_url=logo_url(domain),
            description=desc,
            website=web,
            is_verified=True,
        )
        db.session.add(company)
        db.session.flush()

        internship = safe_create(
            Internship,
            company_id=company.id,
            title=role_title,
            description=f"Build production features with {name}'s team.",
            is_paid=is_paid,
            stipend=stipend,
            duration=duration,
            work_mode=mode,
            eligibility="B.E./B.Tech CSE/ISE students with CGPA >= 7.5",
            required_skills_json=json.dumps(skills),
            deadline="2026-12-31",
            vacancies=5,
            hiring_stages_json=json.dumps([
                "AI Resume Screening",
                "Online Assessment",
                "Technical Interview",
                "HR Round",
            ]),
            required_docs_json=json.dumps(["Resume (PDF)", "College ID"]),
            instructions="Include active GitHub/Portfolio links on resume.",
        )
        db.session.add(internship)
        db.session.flush()
        internships_map[name] = internship

    now = datetime.utcnow()

    demo_apps = [
        ("Microsoft", "INT-2026-1042", "Selected", 92.5,
         "Outstanding system design and cloud fundamentals.",
         ["Applied", "Under Review", "Shortlisted", "Interview", "Selected"]),
        ("Atlassian", "INT-2026-1189", "Selected", 89.0,
         "Strong full-stack React + Java project portfolio.",
         ["Applied", "Shortlisted", "Interview", "Selected"]),
        ("Google", "INT-2026-2054", "Interview", 94.2,
         "Cleared DSA coding round with top percentile score.",
         ["Applied", "Under Review", "Shortlisted", "Interview"]),
        ("Razorpay", "INT-2026-2310", "Interview", 86.4,
         "Shortlisted for backend API architecture discussion.",
         ["Applied", "Shortlisted", "Interview"]),
        ("Adobe", "INT-2026-3098", "Shortlisted", 88.1,
         "Strong Python & ML background matched role criteria.",
         ["Applied", "Under Review", "Shortlisted"]),
        ("Amazon", "INT-2026-3412", "Assessment", 84.7,
         "Online SDE coding assessment link sent to email.",
         ["Applied", "Under Review", "Assessment"]),
        ("Swiggy", "INT-2026-4105", "Under Review", 81.3,
         "Resume currently being evaluated by Data Science hiring team.",
         ["Applied", "Under Review"]),
    ]

    created_apps = {}
    for idx, (comp_name, ref_id, status, score, remarks, trail) in enumerate(demo_apps):
        intern = internships_map[comp_name]
        app_obj = safe_create(
            Application,
            reference_id=ref_id,
            student_id=student.id,
            internship_id=intern.id,
            full_name="Suhani R",
            email="suhani@nie.ac.in",
            phone="+91 98765 43210",
            college="The National Institute of Engineering (NIE), Mysuru",
            branch="CSE",
            grad_year=2028,
            graduation_year=2028,
            cgpa=9.15,
            skills="Python, React, Java, C++, SQL, Machine Learning",
            cover_letter=f"Passionate CSE student excited to contribute to {comp_name}.",
            resume_path=sample_resume,
            ai_match_score=score,
            status=status,
            hr_remarks=remarks,
            submitted_at=now - timedelta(days=14 - idx),
        )
        db.session.add(app_obj)
        db.session.flush()
        created_apps[comp_name] = app_obj

        if HistoryModel is not None:
            for step_i, st in enumerate(trail):
                db.session.add(safe_create(
                    HistoryModel,
                    application_id=app_obj.id,
                    status=st,
                    remarks=remarks if step_i == len(trail) - 1 else f"Moved to {st}",
                    changed_at=now - timedelta(days=14 - idx - step_i),
                ))

    db.session.add_all([
        safe_create(
            Interview,
            application_id=created_apps["Google"].id,
            round_name="Technical Interview — DSA & System Design",
            scheduled_at="2026-11-24 11:00 AM IST",
            meeting_link_or_venue="https://meet.google.com/nie-goog-2026",
            instructions="Keep a code editor open. Join 5 mins early with College ID.",
            status="Scheduled",
        ),
        safe_create(
            Interview,
            application_id=created_apps["Razorpay"].id,
            round_name="Backend Engineering & REST API Round",
            scheduled_at="2026-11-26 03:30 PM IST",
            meeting_link_or_venue="https://zoom.us/j/98451203948",
            instructions="Be ready to discuss database schema design and API scaling.",
            status="Scheduled",
        ),
    ])

    db.session.add_all([
        safe_create(
            Offer,
            application_id=created_apps["Microsoft"].id,
            offer_letter_url=sample_resume,
            stipend="₹75,000/month",
            duration="2 Months (May 2027 – July 2027)",
            acceptance_deadline="2026-12-05",
            joining_date="2027-05-10",
            joining_instructions="Report to Microsoft Campus, Bellandur, Bengaluru at 9:30 AM.",
            status="Offer Received",
            decision="Pending",
        ),
        safe_create(
            Offer,
            application_id=created_apps["Atlassian"].id,
            offer_letter_url=sample_resume,
            stipend="₹85,000/month",
            duration="2 Months (Remote)",
            acceptance_deadline="2026-12-10",
            joining_date="2027-05-15",
            joining_instructions="Complete remote IT laptop dispatch form after accepting offer.",
            status="Offer Received",
            decision="Pending",
        ),
    ])

    db.session.add_all([
        safe_create(
            Notification,
            user_id=student.id,
            title="Offer Letter Issued — Microsoft",
            message="Microsoft issued an offer for SWE Intern - Azure Cloud (₹75,000/month).",
            link="/offers",
        ),
        safe_create(
            Notification,
            user_id=student.id,
            title="Offer Letter Issued — Atlassian",
            message="Atlassian issued an offer for Software Developer Intern (₹85,000/month).",
            link="/offers",
        ),
        safe_create(
            Notification,
            user_id=student.id,
            title="Interview Scheduled — Google",
            message="Technical Interview scheduled on 2026-11-24 at 11:00 AM IST.",
            link="/interviews",
        ),
        safe_create(
            Notification,
            user_id=student.id,
            title="Interview Scheduled — Razorpay",
            message="Backend Engineering Round scheduled on 2026-11-26 at 03:30 PM IST.",
            link="/interviews",
        ),
        safe_create(
            Notification,
            user_id=student.id,
            title="Shortlisted — Adobe",
            message="Application INT-2026-3098 for AI/ML Research Intern has been shortlisted!",
            link="/applications",
        ),
    ])

    db.session.commit()
    print("[SEED] 18 companies + rich demo student (suhani@nie.ac.in / Admin@123) seeded!")