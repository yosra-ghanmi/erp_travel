import os
import smtplib
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import logging

logger = logging.getLogger(__name__)

def send_email(
    to_email: str,
    subject: str,
    body: str,
    attachment_base64: str = None,
    filename: str = "document.pdf",
):
    """
    Sends an email with an optional attachment.
    SMTP settings are read from environment variables.
    """
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip().strip("'").strip('"').replace(" ", "")
    from_email = os.getenv("FROM_EMAIL", smtp_user)

    # Debug Log (Masked)
    masked_pw = f"{smtp_password[:2]}***{smtp_password[-2:]}" if smtp_password else "EMPTY"
    pw_len = len(smtp_password)
    logger.info(f"Attempting email send: User={smtp_user}, PW={masked_pw} (len={pw_len}), Server={smtp_server}:{smtp_port}")

    if not smtp_user or not smtp_password:
        logger.error("SMTP credentials not configured. Email not sent.")
        return False

    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'plain'))

    if attachment_base64:
        try:
            # The base64 string might include the data URI prefix (e.g., "data:application/pdf;base64,")
            if "," in attachment_base64:
                attachment_base64 = attachment_base64.split(",")[1]
            
            pdf_data = base64.b64decode(attachment_base64)
            part = MIMEApplication(pdf_data, _subtype="pdf")
            part.add_header('Content-Disposition', 'attachment', filename=filename)
            msg.attach(part)
        except Exception as e:
            logger.error(f"Failed to attach file: {e}")
            return False

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

def send_email_with_attachment(
    to_email: str,
    subject: str,
    body: str,
    attachment_base64: str = None,
    filename: str = "document.pdf",
):
    return send_email(
        to_email=to_email,
        subject=subject,
        body=body,
        attachment_base64=attachment_base64,
        filename=filename,
    )
