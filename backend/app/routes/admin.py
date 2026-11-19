from flask import Blueprint, jsonify
from app.models import db, User, Company, Internship, Application
from app.utils.decorators import role_required

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/stats", methods=["GET"])
@role_required("admin")
def platform_stats():
    return jsonify({
        "total_students": User.query.filter_by(role="student").count(),
        "total_companies": Company.query.count(),
        "total_internships": Internship.query.count(),
        "total_applications": Application.query.count(),
    }), 200

@admin_bp.route("/companies", methods=["GET"])
@role_required("admin")
def list_all_companies():
    companies = Company.query.all()
    return jsonify([
        {
            "id": c.id,
            "name": c.name,
            "website": c.website,
            "is_verified": c.is_verified,
            "internships_count": len(c.internships)
        }
        for c in companies
    ]), 200

@admin_bp.route("/companies/<int:company_id>/verify", methods=["POST"])
@role_required("admin")
def toggle_company_verification(company_id):
    company = Company.query.get_or_404(company_id)
    company.is_verified = not company.is_verified
    db.session.commit()
    return jsonify({"message": "Company verification updated", "is_verified": company.is_verified}), 200

@admin_bp.route("/users", methods=["GET"])
@role_required("admin")
def list_users():
    users = User.query.all()
    return jsonify([
        {"id": u.id, "email": u.email, "role": u.role, "is_verified": u.is_verified}
        for u in users
    ]), 200