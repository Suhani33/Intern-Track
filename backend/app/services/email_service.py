import os
import smtplib
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from flask_mail import Mail
from app.models import db, Notification

ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

mail = Mail()


def send_email(to_email: str, subject: str, body: str):
    load_dotenv(dotenv_path=ENV_PATH, override=True)
    mail_user = os.getenv("MAIL_USERNAME", "").strip()
    mail_pass = os.getenv("MAIL_PASSWORD", "").strip().replace(" ", "")
    mail_server = os.getenv("MAIL_SERVER", "smtp.gmail.com").strip()
    mail_port = int(os.getenv("MAIL_PORT", 587))

    if not mail_user or not mail_pass or "your-email" in mail_user:
        print(f"\n[EMAIL DISPATCH -> {to_email}]")
        print(f"Subject: {subject}")
        print(f"{body}\n{'-' * 40}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"InternTrack Portal <{mail_user}>"
        msg["To"] = to_email
        msg["Subject"] = subject

        html_body = (
            '<div style="font-family: Arial, sans-serif; max-width: 560px; '
            'margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; '
            'padding: 24px;">'
            '<h2 style="color: #4f46e5; margin-top: 0;">InternTrack</h2>'
            '<p style="color: #1e293b; font-size: 15px; line-height: 1.6; '
            f'white-space: pre-line;">{body}</p>'
            '<hr style="border: none; border-top: 1px solid #e2e8f0; '
            'margin: 20px 0;" />'
            '<p style="color: #64748b; font-size: 12px;">'
            'Automated notification from InternTrack Portal.</p>'
            '</div>'
        )

        msg.attach(MIMEText(body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(mail_server, mail_port, timeout=10) as server:
            server.starttls()
            server.login(mail_user, mail_pass)
            server.send_message(msg)

        print(f"[SMTP SENT] Delivered to {to_email} | {subject}")
        return True
    except Exception as e:
        print(f"[SMTP ERROR] Failed sending to {to_email}: {e}")
        print(f"\n[FALLBACK LOG -> {to_email}]")
        print(f"Subject: {subject}")
        print(f"{body}\n{'-' * 40}")
        return False

def notify_user(user_or_id, title_or_email: str, message_or_title: str, link_or_message: str = None, email_subject: str = None):
    if user_or_id is None:
        return

    # Support legacy 4-arg call: notify_user(user_id: int, email: str, title: str, message: str)
    if isinstance(user_or_id, int):
        user_id = user_or_id
        recipient_email = title_or_email
        title = message_or_title
        message = link_or_message or ""
        link = None
    else:
        # Standard call: notify_user(user: User, title: str, message: str, link=..., email_subject=...)
        user_id = user_or_id.id
        recipient_email = user_or_id.email
        title = title_or_email
        message = message_or_title
        link = link_or_message

    valid_cols = {c.key for c in Notification.__table__.columns}
    notif_data = {
        "user_id": user_id,
        "title": title,
        "message": message,
        "link": link,
    }
    notif = Notification(**{k: v for k, v in notif_data.items() if k in valid_cols})
    db.session.add(notif)
    db.session.commit()

    subject = email_subject or title
    send_email(recipient_email, subject, message)