import random
from datetime import datetime, timedelta
import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import db, User, StudentProfile
from app.services.email_service import notify_user, send_email

auth_bp = Blueprint("auth", __name__)


def parse_grad_year(val):
    try:
        return int(str(val).strip())
    except (ValueError, TypeError):
        return 2028


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = data.get("role", "student")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    existing = User.query.filter_by(email=email).first()
    if existing and existing.is_verified:
        return jsonify({"error": "Email already registered"}), 400

    pw_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    otp = f"{random.randint(100000, 999999)}"
    expiry = datetime.utcnow() + timedelta(minutes=10)

    if existing:
        user = existing
        user.password_hash = pw_hash
        user.role = role
        user.otp_code = otp
        user.otp_expiry = expiry
    else:
        user = User(
            email=email,
            password_hash=pw_hash,
            role=role,
            is_verified=False,
            otp_code=otp,
            otp_expiry=expiry,
        )
        db.session.add(user)
        db.session.flush()

        if role == "student":
            valid_cols = {c.key for c in StudentProfile.__table__.columns}
            prof_data = {
                "user_id": user.id,
                "full_name": data.get("full_name", "Student"),
                "phone": data.get("phone", ""),
                "college": data.get("college", ""),
                "branch": data.get("branch", ""),
                "grad_year": parse_grad_year(data.get("grad_year")),
                "graduation_year": parse_grad_year(data.get("grad_year")),
                "skills": data.get("skills", ""),
            }
            db.session.add(StudentProfile(**{k: v for k, v in prof_data.items() if k in valid_cols}))

    db.session.commit()

    send_email(
        email,
        "InternTrack - Verify Your Account",
        f"Hello {data.get('full_name', '')},\n\nYour InternTrack verification OTP code is: {otp}\nThis code is valid for 10 minutes.",
    )

    return jsonify({"message": "OTP sent to email", "email": email}), 201

@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    otp = data.get("otp", "").strip()

    user = User.query.filter_by(email=email).first()
    if not user or user.otp_code != otp or datetime.utcnow() > user.otp_expiry:
        return jsonify({"error": "Invalid or expired OTP"}), 400

    user.is_verified = True
    user.otp_code = None
    user.otp_expiry = None
    db.session.commit()
    return jsonify({"message": "Email verified successfully. You can now log in."}), 200


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8")):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_verified:
        return jsonify({"error": "Please verify your email via OTP first", "needs_verification": True}), 403

    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return jsonify({
        "access_token": token,
        "user": {"id": user.id, "email": user.email, "role": user.role}
    }), 200


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    email = request.get_json().get("email", "").strip().lower()
    user = User.query.filter_by(email=email).first()
    if user:
        otp = generate_otp()
        user.otp_code = otp
        user.otp_expiry = datetime.utcnow() + timedelta(minutes=10)
        db.session.commit()
        notify_user(user.id, email, "InternTrack - Password Reset OTP", f"Your password reset OTP is: {otp}")
    return jsonify({"message": "If the email exists, a reset OTP has been sent."}), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    otp = data.get("otp", "").strip()
    new_password = data.get("new_password", "")

    user = User.query.filter_by(email=email).first()
    if not user or user.otp_code != otp or datetime.utcnow() > user.otp_expiry:
        return jsonify({"error": "Invalid or expired OTP"}), 400

    user.password_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user.otp_code = None
    user.otp_expiry = None
    db.session.commit()
    return jsonify({"message": "Password reset successful."}), 200


@auth_bp.route("/profile", methods=["GET", "PUT"])
@jwt_required()
def profile():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    prof = StudentProfile.query.filter_by(user_id=user.id).first()

    if request.method == "PUT":
        data = request.get_json() or {}
        if not prof:
            prof = StudentProfile(user_id=user.id)
            db.session.add(prof)
        for field in [
            "full_name", "phone", "college", "branch",
            "year", "grad_year", "graduation_year",
            "cgpa", "skills", "portfolio_url"
        ]:
            if field in data and hasattr(prof, field):
                val = ", ".join(data[field]) if isinstance(data[field], list) else data[field]
                setattr(prof, field, val)
        db.session.commit()

    raw_skills = getattr(prof, "skills", "") if prof else ""
    if isinstance(raw_skills, list):
        skills_list = raw_skills
    else:
        skills_list = [s.strip() for s in str(raw_skills or "").split(",") if s.strip()]

    profile_dict = {
        "full_name": getattr(prof, "full_name", "") if prof else "",
        "phone": getattr(prof, "phone", "") if prof else "",
        "college": getattr(prof, "college", "") if prof else "",
        "branch": getattr(prof, "branch", "") if prof else "",
        "year": getattr(prof, "year", "") if prof else "",
        "grad_year": getattr(prof, "grad_year", getattr(prof, "graduation_year", 2028)) if prof else 2028,
        "cgpa": getattr(prof, "cgpa", 0.0) if prof else 0.0,
        "skills": skills_list,
        "portfolio_url": getattr(prof, "portfolio_url", "") if prof else "",
        "default_resume_path": getattr(prof, "default_resume_path", "") if prof else "",
    }

    return jsonify({
        "id": user.id,
        "email": user.email,
        "role": user.role,
        **profile_dict,
        "profile": profile_dict,
    }), 200