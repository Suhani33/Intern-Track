import json
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.models import db, User, Company, Internship, Application, ApplicationHistory, Interview, Offer
from app.utils.decorators import role_required
from app.services.email_service import notify_user

company_bp = Blueprint("company", __name__)


def safe_create(model_cls, **kwargs):
    valid_cols = {c.key for c in model_cls.__table__.columns}
    return model_cls(**{k: v for k, v in kwargs.items() if k in valid_cols})


@company_bp.route("/profile", methods=["GET", "POST"])
@role_required("hr")
def company_profile():
    hr_id = int(get_jwt_identity())
    company = Company.query.filter_by(hr_user_id=hr_id).first()

    if request.method == "POST":
        data = request.get_json() or {}
        if not company:
            company = Company(
                hr_user_id=hr_id,
                name=data["name"],
                logo_url=data.get("logo_url", "https://logo.clearbit.com/google.com"),
                description=data.get("description", ""),
                website=data.get("website", ""),
                is_verified=False,
            )
            db.session.add(company)
        else:
            company.name = data.get("name", company.name)
            company.logo_url = data.get("logo_url", company.logo_url)
            company.description = data.get("description", company.description)
            company.website = data.get("website", company.website)
        db.session.commit()
        return jsonify({"message": "Company saved (pending admin verification if new)", "id": company.id}), 200

    if not company:
        return jsonify({"company": None}), 200
    return jsonify({
        "id": company.id,
        "name": company.name,
        "logo_url": company.logo_url,
        "description": company.description,
        "website": company.website,
        "is_verified": company.is_verified,
    }), 200


@company_bp.route("/internships", methods=["GET", "POST"])
@role_required("hr")
def manage_internships():
    hr_id = int(get_jwt_identity())
    company = Company.query.filter_by(hr_user_id=hr_id).first()
    if not company:
        return jsonify({"error": "Create company profile first"}), 400

    if request.method == "POST":
        data = request.get_json() or {}
        intern = Internship(
            company_id=company.id,
            title=data["title"],
            description=data["description"],
            is_paid=data.get("is_paid", True),
            stipend=data.get("stipend", "Unpaid"),
            duration=data["duration"],
            work_mode=data["work_mode"],
            eligibility=data["eligibility"],
            required_skills_json=json.dumps(data.get("required_skills", [])),
            deadline=data["deadline"],
            vacancies=data.get("vacancies", 1),
            hiring_stages_json=json.dumps(data.get("hiring_stages", ["Resume Screening", "Technical Interview", "HR Round"])),
            required_docs_json=json.dumps(data.get("required_docs", ["Resume"])),
            instructions=data.get("instructions", ""),
        )
        db.session.add(intern)
        db.session.commit()
        return jsonify({"message": "Internship published", "id": intern.id}), 201

    return jsonify([
        {
            "id": i.id,
            "title": i.title,
            "stipend": i.stipend,
            "duration": i.duration,
            "work_mode": i.work_mode,
            "deadline": i.deadline,
            "vacancies": i.vacancies,
            "applicant_count": len(i.applications),
        }
        for i in company.internships
    ]), 200


@company_bp.route("/applications", methods=["GET"])
@role_required("hr")
def company_applications():
    hr_id = int(get_jwt_identity())
    company = Company.query.filter_by(hr_user_id=hr_id).first_or_404()
    apps = []
    for intern in company.internships:
        for a in intern.applications:
            student = User.query.get(a.student_id)
            prof = getattr(student, "student_profile", None)
            raw_skills = getattr(prof, "skills_json", None) or getattr(prof, "skills", "[]") if prof else "[]"
            try:
                skills_list = json.loads(raw_skills) if isinstance(raw_skills, str) and raw_skills.startswith("[") else [
                    s.strip() for s in str(raw_skills).split(",") if s.strip()
                ]
            except Exception:
                skills_list = []

            apps.append({
                "id": a.id,
                "reference_id": a.reference_id,
                "internship_title": intern.title,
                "stipend": intern.stipend,
                "duration": intern.duration,
                "work_mode": intern.work_mode,
                "student_name": (prof.full_name if (prof and prof.full_name) else None) or getattr(a, "full_name", None) or student.email,
                "student_email": student.email,
                "college": getattr(prof, "college", "") if prof else "",
                "branch": getattr(prof, "branch", "") if prof else "",
                "cgpa": getattr(prof, "cgpa", "") if prof else "",
                "skills": skills_list,
                "ai_match_score": a.ai_match_score,
                "status": a.status,
                "resume_path": a.resume_path,
                "feedback": getattr(a, "feedback", ""),
            })
    apps.sort(key=lambda x: x["ai_match_score"], reverse=True)
    return jsonify(apps), 200


@company_bp.route("/applications/<int:app_id>/status", methods=["PUT"])
@role_required("hr")
def update_application_status(app_id):
    data = request.get_json() or {}
    new_status = data["status"]
    remarks = data.get("remarks", "")

    app_record = Application.query.get_or_404(app_id)
    app_record.status = new_status
    if remarks and hasattr(app_record, "feedback"):
        app_record.feedback = remarks

    db.session.add(ApplicationHistory(application_id=app_record.id, status=new_status, remarks=remarks))
    db.session.commit()

    student = User.query.get(app_record.student_id)
    company_name = app_record.internship.company.name
    role = app_record.internship.title
    notify_user(
        student.id,
        student.email,
        f"Application Update ({new_status}): {role} at {company_name}",
        f"Your application {app_record.reference_id} for {role} at {company_name} is now '{new_status}'. {remarks}"
    )
    return jsonify({"message": f"Status updated to {new_status}"}), 200


@company_bp.route("/applications/<int:app_id>/interview", methods=["POST"])
@role_required("hr")
def schedule_interview(app_id):
    data = request.get_json() or {}
    app_record = Application.query.get_or_404(app_id)
    app_record.status = "Interview"

    round_name = data.get("round_name") or "Technical Interview"
    scheduled_at = data.get("scheduled_at") or ""
    meeting_link = data.get("meeting_link_or_venue") or "Google Meet (Link attached)"
    instructions = data.get("instructions") or "Please join 5 minutes early with a valid college ID."
    response_deadline = data.get("response_deadline") or "At least 24 hours prior to the scheduled slot"

    iv = safe_create(
        Interview,
        application_id=app_record.id,
        round_name=round_name,
        scheduled_at=scheduled_at,
        meeting_link_or_venue=meeting_link,
        instructions=instructions,
        status="Scheduled",
    )
    db.session.add(iv)
    db.session.add(ApplicationHistory(
        application_id=app_record.id,
        status="Interview",
        remarks=f"{round_name} scheduled for {scheduled_at} (Confirm by: {response_deadline})"
    ))
    db.session.commit()

    student = User.query.get(app_record.student_id)
    prof = getattr(student, "student_profile", None)
    candidate_name = (prof.full_name if (prof and prof.full_name) else None) or getattr(app_record, "full_name", None) or student.email
    company_name = app_record.internship.company.name
    role_title = app_record.internship.title

    email_subject = f"Interview Invitation: {role_title} at {company_name} ({round_name})"
    email_body = (
        f"Dear {candidate_name},\n\n"
        f"Warm greetings from {company_name}!\n\n"
        f"Congratulations — your application ({app_record.reference_id}) for the {role_title} internship "
        f"has been shortlisted for an interview.\n\n"
        f"--- INTERVIEW SCHEDULE & DETAILS ---\n"
        f"• Round: {round_name}\n"
        f"• Date & Time: {scheduled_at}\n"
        f"• Meeting Link / Venue: {meeting_link}\n"
        f"• Response / Confirmation Deadline: {response_deadline}\n"
        f"• Instructions: {instructions}\n\n"
        f"ACTION REQUIRED:\n"
        f"Please review your interview schedule on InternTrack (http://127.0.0.1:5175/interviews) "
        f"and confirm your availability before {response_deadline}.\n\n"
        f"Best regards,\n"
        f"{company_name} Recruitment Team via InternTrack"
    )

    notify_user(student.id, student.email, email_subject, email_body)
    return jsonify({"message": "Interview scheduled and email sent!"}), 201


@company_bp.route("/applications/<int:app_id>/offer", methods=["POST"])
@role_required("hr")
def issue_offer(app_id):
    data = request.get_json(silent=True) or {}
    app_record = Application.query.get_or_404(app_id)
    app_record.status = "Selected"

    intern = app_record.internship
    company = intern.company
    today = datetime.utcnow().date()

    stipend = data.get("stipend") or (intern.stipend if intern and intern.stipend else "₹25,000 / month")
    duration = data.get("duration") or (intern.duration if intern and intern.duration else "3 Months")
    acceptance_deadline = data.get("acceptance_deadline") or (today + timedelta(days=5)).strftime("%Y-%m-%d")
    joining_date = data.get("joining_date") or (today + timedelta(days=14)).strftime("%Y-%m-%d")
    joining_instructions = data.get("joining_instructions") or (
        f"Report to {company.name} ({intern.work_mode}) onboarding desk on {joining_date} at 10:00 AM "
        f"with your signed offer letter and required verification documents."
    )

    try:
        default_docs = json.loads(intern.required_docs_json) if (intern and intern.required_docs_json) else []
    except Exception:
        default_docs = []
    joining_docs = data.get("joining_docs") or default_docs or [
        "College ID Card",
        "Government ID / PAN",
        "Updated Resume",
        "Signed Offer Letter",
    ]
    docs_formatted = ", ".join(joining_docs) if isinstance(joining_docs, list) else str(joining_docs)

    existing_offer = Offer.query.filter_by(application_id=app_record.id).first()
    if existing_offer:
        existing_offer.offer_letter_url = data.get("offer_letter_url", "generated_offer_letter.pdf")
        existing_offer.stipend = stipend
        existing_offer.duration = duration
        existing_offer.acceptance_deadline = acceptance_deadline
        existing_offer.joining_date = joining_date
        existing_offer.joining_instructions = joining_instructions
        if hasattr(existing_offer, "joining_docs_json"):
            existing_offer.joining_docs_json = json.dumps(joining_docs)
        if hasattr(existing_offer, "status"):
            existing_offer.status = "Offer Received"
    else:
        offer = safe_create(
            Offer,
            application_id=app_record.id,
            offer_letter_url=data.get("offer_letter_url", "generated_offer_letter.pdf"),
            stipend=stipend,
            duration=duration,
            acceptance_deadline=acceptance_deadline,
            joining_date=joining_date,
            joining_instructions=joining_instructions,
            joining_docs_json=json.dumps(joining_docs),
            required_docs_json=json.dumps(joining_docs),
            status="Offer Received",
        )
        db.session.add(offer)

    db.session.add(ApplicationHistory(
        application_id=app_record.id,
        status="Selected",
        remarks=f"Official offer letter auto-generated and emailed (Respond by: {acceptance_deadline})."
    ))
    db.session.commit()

    student = User.query.get(app_record.student_id)
    prof = getattr(student, "student_profile", None)
    candidate_name = (prof.full_name if (prof and prof.full_name) else None) or getattr(app_record, "full_name", None) or student.email
    company_name = company.name
    role_title = intern.title

    email_subject = f"Official Internship Offer Letter: {role_title} at {company_name} [Respond by {acceptance_deadline}]"
    email_body = (
        f"Dear {candidate_name},\n\n"
        f"Warmest congratulations from {company_name}!\n\n"
        f"We are thrilled to extend an official offer for the {role_title} ({intern.work_mode}) internship "
        f"at {company_name} (Application Reference: {app_record.reference_id}). Your academic background "
        f"and performance stood out during our evaluation.\n\n"
        f"================ OFFICIAL INTERNSHIP OFFER LETTER ================\n"
        f"• Candidate Name: {candidate_name}\n"
        f"• Organization: {company_name}\n"
        f"• Position: {role_title} ({intern.work_mode})\n"
        f"• Stipend: {stipend}\n"
        f"• Duration: {duration}\n"
        f"• Expected Joining Date: {joining_date}\n"
        f"• Mandatory Response Deadline: {acceptance_deadline}\n"
        f"• Required Joining Documents: {docs_formatted}\n"
        f"• Onboarding Instructions: {joining_instructions}\n"
        f"==================================================================\n\n"
        f"ACTION REQUIRED:\n"
        f"Please log in to your InternTrack portal (http://127.0.0.1:5175/offers) and formally accept "
        f"or decline this offer on or before {acceptance_deadline}. Offers not confirmed by "
        f"{acceptance_deadline} may expire automatically.\n\n"
        f"We look forward to welcoming you to {company_name}!\n\n"
        f"Warm regards,\n"
        f"Talent Acquisition Team\n"
        f"{company_name} | InternTrack Portal"
    )

    notify_user(student.id, student.email, email_subject, email_body)
    return jsonify({
        "message": f"Offer letter auto-generated and emailed to {student.email}!",
        "acceptance_deadline": acceptance_deadline,
        "joining_date": joining_date,
    }), 201