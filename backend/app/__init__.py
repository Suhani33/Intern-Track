import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from app.models import db
from app.services.email_service import mail
from app.routes.auth import auth_bp
from app.routes.student import student_bp
from app.routes.company import company_bp
from app.routes.admin import admin_bp
from app.seed import seed_initial_data

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    CORS(app)
    db.init_app(app)
    JWTManager(app)
    mail.init_app(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(student_bp, url_prefix="/api/student")
    app.register_blueprint(company_bp, url_prefix="/api/company")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    with app.app_context():
        db.create_all()
        seed_initial_data()

    return app