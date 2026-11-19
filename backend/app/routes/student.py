import os
import json
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import app.models as models
from app.models import (
    db, User, StudentProfile, Company, Internship,
    Application, Interview, Offer, Notification
)
from app.services.email_service import notify_user

student_bp = Blueprint("student", __name__)

HistoryModel = next(
    (
        cls for name, cls in vars(models).items()
        if isinstance(cls, type) and issubclass(cls, db.Model) and "History" in name
    ),
    None,
)


def safe_create(model_cls, **kwargs):
    valid_cols = {c.key for c in model_cls.__table__.columns}
    return model_cls(**{k: v for k, v in kwargs.items() if k in valid_cols})


def parse_json_list(raw):
    if not raw:
        return []
    if isinstance(raw, list):
        return raw
    try:
        return json.loads(raw)
    except Exception:
        return [s.strip() for s in str(raw).split(",") if s.strip()]


@student_bp.route("/companies", methods=["GET"])
def list_companies():
    search = (request.args.get("search") or request.args.get("q") or "").strip().lower()
    mode = (request.args.get("mode") or "").strip()
    paid = request.args.get("paid")

    companies = Company.query.filter_by(is_verified=True).all()
    results = []

    for comp in companies:
        internships = Internship.query.filter_by(company_id=comp.id).all()
        filtered_interns = []
        for intern in internships:
            if mode and intern.work_mode.lower() != mode.lower():
                continue
            if paid == "true" and not intern.is_paid:
                continue
            if paid == "false" and intern.is_paid:
                continue
            filtered_interns.append({
                "id": intern.id,
                "title": intern.title,
                "description": intern.description,
                "is_paid": intern.is_paid,
                "stipend": intern.stipend,
                "duration": intern.duration,
                "work_mode": intern.work_mode,
                "eligibility": intern.eligibility,
                "required_skills": parse_json_list(intern.required_skills_json),
                "deadline": intern.deadline,
                "vacancies": intern.vacancies,
                "hiring_stages": parse_json_list(intern.hiring_stages_json),
                "required_docs": parse_json_list(intern.required_docs_json),
                "instructions": intern.instructions,
            })

        if search:
            comp_match = search in comp.name.lower() or search in (comp.description or "").lower()
            role_match = any(
                search in i["title"].lower()
                or any(search in sk.lower() for sk in i["required_skills"])
                for i in filtered_interns
            )
            if not (comp_match or role_match):
                continue

        if filtered_interns or not (mode or paid):
            results.append({
                "id": comp.id,
                "name": comp.name,
                "logo_url": comp.logo_url,
                "description": comp.description,
                "website": comp.website,
                "internships": filtered_interns,
            })

    return jsonify(results), 200

@student_bp.route("/companies/<int:company_id>", methods=["GET"])
def get_company_detail(company_id):
    comp = Company.query.get_or_404(company_id)
    internships = Internship.query.filter_by(company_id=comp.id).all()
    return jsonify({
        "id": comp.id,
        "name": comp.name,
        "logo_url": comp.logo_url,
        "description": comp.description,
        "website": comp.website,
        "internships": [
            {
                "id": intern.id,
                "title": intern.title,
                "description": intern.description,
                "is_paid": intern.is_paid,
                "stipend": intern.stipend,
                "duration": intern.duration,
                "work_mode": intern.work_mode,
                "eligibility": intern.eligibility,
                "required_skills": parse_json_list(intern.required_skills_json),
                "deadline": intern.deadline,
                "vacancies": intern.vacancies,
                "hiring_stages": parse_json_list(intern.hiring_stages_json),
                "required_docs": parse_json_list(intern.required_docs_json),
                "instructions": intern.instructions,
            }
            for intern in internships
        ],
    }), 200


@student_bp.route("/internships/<int:internship_id>", methods=["GET"])
def get_internship(internship_id):
    intern = Internship.query.get_or_404(internship_id)
    comp = intern.company
    return jsonify({
        "id": intern.id,
        "title": intern.title,
        "description": intern.description,
        "is_paid": intern.is_paid,
        "stipend": intern.stipend,
        "duration": intern.duration,
        "work_mode": intern.work_mode,
        "eligibility": intern.eligibility,
        "required_skills": parse_json_list(intern.required_skills_json),
        "deadline": intern.deadline,
        "vacancies": intern.vacancies,
        "hiring_stages": parse_json_list(intern.hiring_stages_json),
        "required_docs": parse_json_list(intern.required_docs_json),
        "instructions": intern.instructions,
        "company": {
            "id": comp.id,
            "name": comp.name,
            "logo_url": comp.logo_url,
            "description": comp.description,
            "website": comp.website,
        } if comp else None,
    }), 200


@student_bp.route("/internships/<int:internship_id>/apply", methods=["POST"])
@jwt_required()
def apply_internship(internship_id):
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    internship = Internship.query.get_or_404(internship_id)
    prof = StudentProfile.query.filter_by(user_id=user.id).first()

    existing = Application.query.filter_by(
        student_id=user.id, internship_id=internship.id
    ).first()
    if existing:
        return jsonify({"error": "You have already applied for this internship"}), 400

    resume_filename = getattr(prof, "default_resume_path", "") if prof else ""
    if "resume" in request.files and request.files["resume"].filename:
        f = request.files["resume"]
        os.makedirs("uploads", exist_ok=True)
        safe_name = f"{uuid.uuid4().hex[:8]}_{secure_filename(f.filename)}"
        f.save(os.path.join("uploads", safe_name))
        resume_filename = safe_name

    form_data = request.form or (request.get_json(silent=True) or {})
    projects = form_data.get("projects", "")
    cover_letter = form_data.get("cover_letter") or form_data.get("why_hire") or ""
    if projects:
        cover_letter = f"Projects & Achievements:\n{projects}\n\nStatement:\n{cover_letter}"

    req_skills = {s.lower() for s in parse_json_list(internship.required_skills_json)}
    cand_skills_raw = getattr(prof, "skills", "") if prof else ""
    cand_skills = {s.strip().lower() for s in str(cand_skills_raw).split(",") if s.strip()}
    if req_skills:
        overlap = len(req_skills & cand_skills) / len(req_skills)
        ai_score = round(min(98.0, 72.0 + overlap * 26.0), 1)
    else:
        ai_score = 85.0

    ref_id = f"INT-{datetime.utcnow().year}-{uuid.uuid4().hex[:4].upper()}"
    full_name = getattr(prof, "full_name", None) or user.email.split("@")[0]

    app_obj = safe_create(
        Application,
        reference_id=ref_id,
        student_id=user.id,
        internship_id=internship.id,
        full_name=full_name,
        email=user.email,
        phone=getattr(prof, "phone", ""),
        college=getattr(prof, "college", ""),
        branch=getattr(prof, "branch", ""),
        grad_year=getattr(prof, "grad_year", 2028),
        graduation_year=getattr(prof, "graduation_year", 2028),
        cgpa=getattr(prof, "cgpa", 0.0),
        skills=cand_skills_raw,
        cover_letter=cover_letter,
        resume_path=resume_filename or "uploaded_resume.pdf",
        ai_match_score=ai_score,
        status="Applied",
        submitted_at=datetime.utcnow(),
    )
    db.session.add(app_obj)
    db.session.flush()

    if HistoryModel is not None:
        db.session.add(safe_create(
            HistoryModel,
            application_id=app_obj.id,
            status="Applied",
            remarks="Application submitted by candidate.",
            changed_at=datetime.utcnow(),
        ))

    comp_name = internship.company.name if internship.company else "Company"
    notify_user(
        user,
        title=f"Application Submitted — {comp_name}",
        message=(
            f"Hi {full_name},\n\n"
            f"Your application ({ref_id}) for {internship.title} at {comp_name} "
            f"has been submitted successfully."
        ),
        link="/applications",
    )
    db.session.commit()

    return jsonify({
        "message": "Application submitted successfully",
        "reference_id": ref_id,
        "application_id": app_obj.id,
    }), 201


@student_bp.route("/applications", methods=["GET"])
@jwt_required()
def my_applications():
    user_id = int(get_jwt_identity())
    query = Application.query.filter_by(student_id=user_id)
    if hasattr(Application, "submitted_at"):
        query = query.order_by(Application.submitted_at.desc())
    elif hasattr(Application, "created_at"):
        query = query.order_by(Application.created_at.desc())
    apps = query.all()

    output = []
    for a in apps:
        intern = a.internship
        comp = intern.company if intern else None
        history_items = []
        if HistoryModel is not None:
            h_query = HistoryModel.query.filter_by(application_id=a.id)
            if hasattr(HistoryModel, "changed_at"):
                h_query = h_query.order_by(HistoryModel.changed_at.asc())
            elif hasattr(HistoryModel, "created_at"):
                h_query = h_query.order_by(HistoryModel.created_at.asc())
            rows = h_query.all()
            history_items = [
                {
                    "status": getattr(h, "status", ""),
                    "remarks": getattr(h, "remarks", ""),
                    "changed_at": (
                        h.changed_at.isoformat() if getattr(h, "changed_at", None)
                        else (h.created_at.isoformat() if getattr(h, "created_at", None) else "")
                    ),
                }
                for h in rows
            ]

        sub_dt = getattr(a, "submitted_at", None) or getattr(a, "created_at", None)
        output.append({
            "id": a.id,
            "reference_id": getattr(a, "reference_id", f"APP-{a.id}"),
            "status": getattr(a, "status", "Applied"),
            "ai_match_score": getattr(a, "ai_match_score", 85.0),
            "hr_remarks": getattr(a, "hr_remarks", ""),
            "resume_path": getattr(a, "resume_path", ""),
            "submitted_at": sub_dt.isoformat() if sub_dt else "",
            "internship_title": intern.title if intern else "",
            "stipend": intern.stipend if intern else "",
            "duration": intern.duration if intern else "",
            "work_mode": intern.work_mode if intern else "",
            "company_name": comp.name if comp else "",
            "company_logo": comp.logo_url if comp else "",
            "history": history_items,
        })

    return jsonify(output), 200

@student_bp.route("/interviews", methods=["GET"])
@jwt_required()
def my_interviews():
    user_id = int(get_jwt_identity())
    apps = Application.query.filter_by(student_id=user_id).all()
    app_ids = [a.id for a in apps]

    interviews = Interview.query.filter(Interview.application_id.in_(app_ids)).all() if app_ids else []
    results = []
    for iv in interviews:
        app_obj = Application.query.get(iv.application_id)
        intern = app_obj.internship if app_obj else None
        comp = intern.company if intern else None
        results.append({
            "id": iv.id,
            "application_id": iv.application_id,
            "reference_id": app_obj.reference_id if app_obj else "",
            "company_name": comp.name if comp else "",
            "company_logo": comp.logo_url if comp else "",
            "internship_title": intern.title if intern else "",
            "round_name": iv.round_name,
            "scheduled_at": iv.scheduled_at,
            "meeting_link_or_venue": iv.meeting_link_or_venue,
            "instructions": iv.instructions,
            "status": iv.status,
        })

    return jsonify(results), 200


@student_bp.route("/offers", methods=["GET"])
@jwt_required()
def my_offers():
    user_id = int(get_jwt_identity())
    apps = Application.query.filter_by(student_id=user_id).all()
    app_ids = [a.id for a in apps]

    offers = Offer.query.filter(Offer.application_id.in_(app_ids)).all() if app_ids else []
    results = []
    today = datetime.utcnow().date()
    dirty = False

    for of in offers:
        # Automatically mark unresponded offers as expired if past acceptance_deadline
        current_status = getattr(of, "status", "Offer Received")
        if current_status == "Offer Received" and getattr(of, "acceptance_deadline", None):
            try:
                deadline_dt = datetime.strptime(str(of.acceptance_deadline)[:10], "%Y-%m-%d").date()
                if today > deadline_dt:
                    of.status = "Offer Expired"
                    current_status = "Offer Expired"
                    dirty = True
            except ValueError:
                pass

        app_obj = Application.query.get(of.application_id)
        intern = app_obj.internship if app_obj else None
        comp = intern.company if intern else None
        docs = (
            parse_json_list(getattr(of, "joining_docs_json", None))
            or parse_json_list(getattr(of, "required_docs_json", None))
            or (parse_json_list(intern.required_docs_json) if intern else [])
            or ["College ID Card", "Government ID Proof", "Updated Resume"]
        )
        results.append({
            "id": of.id,
            "application_id": of.application_id,
            "reference_id": app_obj.reference_id if app_obj else "",
            "company_name": comp.name if comp else "",
            "company_logo": comp.logo_url if comp else "",
            "internship_title": intern.title if intern else "",
            "stipend": of.stipend,
            "duration": of.duration,
            "acceptance_deadline": of.acceptance_deadline,
            "joining_date": of.joining_date,
            "joining_instructions": of.joining_instructions,
            "joining_docs": docs,
            "offer_letter_url": getattr(of, "offer_letter_url", ""),
            "status": current_status,
            "decision": getattr(of, "decision", current_status),
        })

    if dirty:
        db.session.commit()

    return jsonify(results), 200


@student_bp.route("/offers/<int:offer_id>/respond", methods=["POST"])
@jwt_required()
def respond_offer(offer_id):
    user_id = int(get_jwt_identity())
    offer = Offer.query.get_or_404(offer_id)
    app_obj = Application.query.get_or_404(offer.application_id)
    if app_obj.student_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json() or {}
    raw_decision = (data.get("decision") or data.get("action") or "accept").strip().lower()
    is_accepted = raw_decision in ("accept", "accepted")

    # Block acceptance if the mandatory response deadline has passed
    if is_accepted and getattr(offer, "acceptance_deadline", None):
        try:
            deadline_dt = datetime.strptime(str(offer.acceptance_deadline)[:10], "%Y-%m-%d").date()
            if datetime.utcnow().date() > deadline_dt:
                if hasattr(offer, "status"):
                    offer.status = "Offer Expired"
                if HistoryModel is not None:
                    db.session.add(safe_create(
                        HistoryModel,
                        application_id=app_obj.id,
                        status="Offer Expired",
                        remarks=f"Offer lapsed after acceptance deadline ({offer.acceptance_deadline}).",
                        changed_at=datetime.utcnow(),
                    ))
                db.session.commit()
                return jsonify({
                    "error": f"Offer acceptance deadline ({offer.acceptance_deadline}) has passed."
                }), 400
        except ValueError:
            pass

    status_label = "Offer Accepted" if is_accepted else "Offer Declined"

    if hasattr(offer, "decision"):
        offer.decision = "Accepted" if is_accepted else "Declined"
    if hasattr(offer, "status"):
        offer.status = status_label
    app_obj.status = status_label

    if HistoryModel is not None:
        db.session.add(safe_create(
            HistoryModel,
            application_id=app_obj.id,
            status=status_label,
            remarks=f"Candidate {'accepted' if is_accepted else 'declined'} the offer.",
            changed_at=datetime.utcnow(),
        ))

    db.session.commit()
    return jsonify({"message": status_label, "status": status_label}), 200

@student_bp.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())
    query = Notification.query.filter_by(user_id=user_id)
    if hasattr(Notification, "created_at"):
        query = query.order_by(Notification.created_at.desc())
    notifs = query.all()
    return jsonify([
        {
            "id": n.id,
            "title": getattr(n, "title", ""),
            "message": getattr(n, "message", ""),
            "link": getattr(n, "link", ""),
            "is_read": getattr(n, "is_read", False),
            "created_at": n.created_at.isoformat() if getattr(n, "created_at", None) else "",
        }
        for n in notifs
    ]), 200


@student_bp.route("/notifications/read", methods=["POST"])
@jwt_required()
def mark_notifications_read():
    user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=user_id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "Marked as read"}), 200