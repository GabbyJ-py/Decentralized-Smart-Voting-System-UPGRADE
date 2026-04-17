from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_mail import Mail, Message
import mysql.connector
from mysql.connector import Error
import os
import uuid
import random
import string
import time
import requests
from werkzeug.utils import secure_filename
from web3 import Web3
from deepface import DeepFace
import base64
import cv2
import numpy as np
import json
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics import renderPDF
from reportlab.lib.utils import ImageReader
import qrcode
from io import BytesIO
from datetime import datetime

# Load environment variables
load_dotenv()

# =========================
# OTP STORAGE
# =========================
# In-memory OTP storage: {phone: {'otp': '123456', 'timestamp': 1234567890}}
otp_store = {}

# =========================
# APP SETUP
# =========================

app = Flask(__name__)
CORS(app)

# Mail Configuration
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'False').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

mail = Mail(app)

# Rate Limiting Setup
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["1000 per day", "200 per hour"],
    storage_uri="memory://",
    strategy="fixed-window"
)

# Custom rate limit error handler
@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        "success": False,
        "error": "rate_limit_exceeded",
        "message": "Too many requests. Please try again later.",
        "retry_after": e.description
    }), 429

# =========================
# ADMIN AUTH DECORATOR
# =========================

from functools import wraps

def require_admin_auth(f):
    """
    Protect admin-only endpoints with a server-side credential check.
    The frontend must send an Authorization header:
      Authorization: Basic <base64(username:password)>
    Credentials are validated against ADMIN_USERNAME / ADMIN_PASSWORD env vars.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        import base64 as _b64
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Basic '):
            return jsonify({'success': False, 'message': 'Admin authentication required'}), 401
        try:
            decoded = _b64.b64decode(auth_header[6:]).decode('utf-8')
            username, password = decoded.split(':', 1)
        except Exception:
            return jsonify({'success': False, 'message': 'Invalid authorization header'}), 401

        admin_username = os.getenv('ADMIN_USERNAME', 'admin')
        admin_password = os.getenv('ADMIN_PASSWORD', 'password123')

        if username != admin_username or password != admin_password:
            return jsonify({'success': False, 'message': 'Invalid admin credentials'}), 403
        return f(*args, **kwargs)
    return decorated

# Configuration from environment variables
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
app.config["MAX_CONTENT_LENGTH"] = int(os.getenv("MAX_UPLOAD_SIZE", 5242880))

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    from flask import send_from_directory
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# =========================
# DATABASE CONFIG
# =========================

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME", "voter_db")
}

def get_db_connection():
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except Error as e:
        print(f"Database connection error: {e}")
        raise

# =========================
# BLOCKCHAIN CONFIG
# =========================

# Ganache connection
GANACHE_URL = os.getenv("GANACHE_URL", "http://127.0.0.1:7545")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(GANACHE_URL))

# Check connection
if w3.is_connected():
    print(f"✅ Connected to Ganache at {GANACHE_URL}")
else:
    print(f"❌ Failed to connect to Ganache at {GANACHE_URL}")

# Load contract ABI
CONTRACT_ABI_PATH = os.path.join(os.path.dirname(__file__), "../contracts/VotingContract.json")

def load_contract():
    """Load the deployed smart contract"""
    try:
        if not CONTRACT_ADDRESS:
            print("⚠️ WARNING: CONTRACT_ADDRESS not set in .env file")
            return None
            
        # Load ABI from JSON file
        if os.path.exists(CONTRACT_ABI_PATH):
            with open(CONTRACT_ABI_PATH, 'r') as f:
                contract_json = json.load(f)
                abi = contract_json.get('abi', [])
        else:
            print(f"⚠️ WARNING: Contract ABI file not found at {CONTRACT_ABI_PATH}")
            return None
        
        # Create contract instance
        contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)
        print(f"✅ Smart contract loaded at {CONTRACT_ADDRESS}")
        return contract
    except Exception as e:
        print(f"❌ Error loading contract: {e}")
        return None

# Load contract on startup
voting_contract = load_contract()

# =========================
# AUDIT LOGGING
# =========================

def log_audit(action_type, status, voter_id=None, user_email=None, action_details=None, error_message=None):
    """
    Log all actions to audit_log table for security and compliance
    
    Args:
        action_type: Type of action (REGISTRATION, AUTHENTICATION, VOTE_CAST, etc.)
        status: SUCCESS or FAILURE
        voter_id: Voter ID if applicable
        user_email: User email if applicable
        action_details: JSON string with additional details
        error_message: Error message if status is FAILURE
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get client IP address
        ip_address = request.remote_addr or request.environ.get('HTTP_X_FORWARDED_FOR', 'unknown')
        
        # Get user agent
        user_agent = request.headers.get('User-Agent', 'unknown')
        
        query = """
            INSERT INTO audit_log 
            (action_type, voter_id, user_email, ip_address, user_agent, action_details, status, error_message)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(query, (
            action_type,
            voter_id,
            user_email,
            ip_address,
            user_agent,
            action_details,
            status,
            error_message
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"[AUDIT LOG ERROR] Failed to log action: {e}")
        # Don't raise exception - audit logging should not break main functionality

# =========================
# RECEIPT GENERATION
# =========================

def generate_vote_receipt(voter_id, voter_name, candidate_name, tx_hash, timestamp):
    """
    Generate a professional PDF receipt for the voter
    
    Args:
        voter_id: Voter ID
        voter_name: Voter's name
        candidate_name: Selected candidate name
        tx_hash: Blockchain transaction hash
        timestamp: Vote timestamp
    
    Returns:
        BytesIO: In-memory PDF buffer
    """
    try:
        # Create unique receipt ID
        receipt_id = f"RECEIPT_{voter_id}_{int(datetime.now().timestamp())}"
        
        # Create PDF in memory
        pdf_buffer = BytesIO()
        c = canvas.Canvas(pdf_buffer, pagesize=letter)
        width, height = letter
        
        # Header - Blue background
        c.setFillColor(colors.HexColor('#053c6d'))
        c.rect(0, height - 150, width, 150, fill=True, stroke=False)
        
        # Title
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 32)
        c.drawCentredString(width/2, height - 60, "VOTING RECEIPT")
        
        c.setFont("Helvetica", 12)
        c.drawCentredString(width/2, height - 85, "Official Blockchain-Verified Ballot Confirmation")
        c.drawCentredString(width/2, height - 105, "Cyber District 01 • Election Commission")
        
        # Receipt ID
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(width/2, height - 130, f"Receipt ID: {receipt_id}")
        
        # Main content area
        y_position = height - 200
        
        # Voter Information Section
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y_position, "VOTER INFORMATION")
        
        c.setFont("Helvetica", 11)
        y_position -= 30
        c.drawString(70, y_position, f"Voter ID:")
        c.setFont("Helvetica-Bold", 11)
        c.drawString(200, y_position, voter_id)
        
        c.setFont("Helvetica", 11)
        y_position -= 25
        c.drawString(70, y_position, f"Name:")
        c.setFont("Helvetica-Bold", 11)
        c.drawString(200, y_position, voter_name)
        
        c.setFont("Helvetica", 11)
        y_position -= 25
        c.drawString(70, y_position, f"Timestamp:")
        c.setFont("Helvetica-Bold", 11)
        c.drawString(200, y_position, datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S'))
        
        # Divider line
        y_position -= 20
        c.setStrokeColor(colors.grey)
        c.setLineWidth(1)
        c.line(50, y_position, width - 50, y_position)
        
        # Vote Details Section
        y_position -= 30
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y_position, "VOTE DETAILS")
        
        c.setFont("Helvetica", 11)
        y_position -= 30
        c.drawString(70, y_position, f"Selected Candidate:")
        c.setFont("Helvetica-Bold", 11)
        c.drawString(200, y_position, candidate_name)
        
        c.setFont("Helvetica", 11)
        y_position -= 25
        c.drawString(70, y_position, f"Constituency:")
        c.setFont("Helvetica-Bold", 11)
        c.drawString(200, y_position, "Cyber District 01")
        
        # Divider line
        y_position -= 20
        c.line(50, y_position, width - 50, y_position)
        
        # Blockchain Verification Section
        y_position -= 30
        c.setFillColor(colors.HexColor('#10b981'))
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y_position, "✓ BLOCKCHAIN VERIFICATION")
        
        c.setFillColor(colors.black)
        c.setFont("Helvetica", 11)
        y_position -= 30
        c.drawString(70, y_position, f"Transaction Hash:")
        
        # Split transaction hash into multiple lines if needed
        c.setFont("Courier", 9)
        y_position -= 20
        c.drawString(70, y_position, tx_hash[:42])
        if len(tx_hash) > 42:
            y_position -= 15
            c.drawString(70, y_position, tx_hash[42:])
        
        c.setFont("Helvetica", 11)
        y_position -= 25
        c.drawString(70, y_position, f"Network:")
        c.setFont("Helvetica-Bold", 11)
        c.drawString(200, y_position, "Ethereum (Ganache)")
        
        c.setFont("Helvetica", 11)
        y_position -= 25
        c.drawString(70, y_position, f"Status:")
        c.setFillColor(colors.HexColor('#10b981'))
        c.setFont("Helvetica-Bold", 11)
        c.drawString(200, y_position, "CONFIRMED")
        
        # Generate QR code for transaction hash
        qr = qrcode.QRCode(version=1, box_size=10, border=2)
        qr.add_data(f"TX:{tx_hash}")
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        # Save QR code to BytesIO buffer
        qr_buffer = BytesIO()
        qr_img.save(qr_buffer, format='PNG')
        qr_buffer.seek(0)
        
        # Draw QR code using ImageReader
        c.drawImage(ImageReader(qr_buffer), width - 150, y_position - 100, width=100, height=100)
        
        # QR code label
        c.setFillColor(colors.black)
        c.setFont("Helvetica", 8)
        c.drawCentredString(width - 100, y_position - 115, "Scan to verify on blockchain")
        
        # Footer
        y_position = 100
        c.setFillColor(colors.grey)
        c.setFont("Helvetica", 8)
        c.drawCentredString(width/2, y_position, "This is an official voting receipt generated by the SmartVote Blockchain System")
        c.drawCentredString(width/2, y_position - 15, "Keep this receipt for your records. Your vote is anonymous and cannot be traced back to you.")
        c.drawCentredString(width/2, y_position - 30, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Watermark
        c.setFillColor(colors.HexColor('#f0f0f0'))
        c.setFont("Helvetica-Bold", 60)
        c.saveState()
        c.translate(width/2, height/2)
        c.rotate(45)
        c.drawCentredString(0, 0, "VERIFIED")
        c.restoreState()
        
        # Save PDF to buffer
        c.save()
        
        # Reset buffer position to beginning
        pdf_buffer.seek(0)
        
        return pdf_buffer
        
    except Exception as e:
        print(f"[RECEIPT ERROR] Failed to generate receipt: {e}")
        return None

def generate_voter_card(voter_id, name, age, gender, aadhaar, photo_path=None):
    """
    Generate a professional voter ID card (EPIC) PDF
    
    Args:
        voter_id: Voter ID
        name: Voter's name
        age: Voter's age
        gender: Voter's gender
        aadhaar: Masked Aadhaar number
        photo_path: Optional path to voter's photo
    
    Returns:
        BytesIO: In-memory PDF buffer
    """
    try:
        card_id = f"EPIC_{voter_id}_{int(datetime.now().timestamp())}"
        
        # Create PDF in memory
        pdf_buffer = BytesIO()
        
        # Standard ID Card Size: 3.375" x 2.125"
        card_size = (3.375 * inch, 2.125 * inch)
        c = canvas.Canvas(pdf_buffer, pagesize=card_size)
        width, height = card_size
        
        # --- 1. Background & Border ---
        c.setFillColor(colors.white)
        c.rect(0, 0, width, height, fill=True, stroke=False)
        
        # --- 2. WATERMARK FIRST (Behind everything) ---
        c.setFont("Helvetica-BoldOblique", 30)
        c.setFillColor(colors.HexColor('#f2f2f2'))  # Very faint watermark
        c.saveState()
        c.translate(width/2, height/2)
        c.rotate(30)
        c.drawCentredString(0, 0, "ORIGINAL")
        c.restoreState()
        
        # --- 3. Border ---
        c.setStrokeColor(colors.HexColor('#2c3e50'))  # Professional Slate Blue
        c.setLineWidth(1)
        c.rect(0.05*inch, 0.05*inch, width - 0.1*inch, height - 0.1*inch, fill=False, stroke=True)
        
        # --- 4. Header (Official Look) ---
        c.setFillColor(colors.HexColor('#053c6d'))  # Deep Navy
        c.rect(0.05*inch, height - 0.45*inch, width - 0.1*inch, 0.35*inch, fill=True, stroke=False)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(width/2, height - 0.28*inch, "ELECTION COMMISSION PORTAL")
        c.setFont("Helvetica", 6)
        c.drawCentredString(width/2, height - 0.38*inch, "GOVERNMENT OF SMART CITY • IDENTITY CARD")
        
        # --- 5. Voter Photo (Left Side) ---
        photo_x = 0.15*inch
        photo_y = 0.45*inch
        photo_width = 0.85*inch
        photo_height = 1.05*inch
        
        # Draw photo border
        c.setStrokeColor(colors.HexColor('#2c3e50'))
        c.setLineWidth(1)
        c.rect(photo_x, photo_y, photo_width, photo_height, fill=False, stroke=True)
        
        # Draw photo or placeholder
        if photo_path and os.path.exists(photo_path):
            try:
                c.drawImage(photo_path, photo_x, photo_y, width=photo_width, height=photo_height, preserveAspectRatio=True, mask='auto')
            except Exception as e:
                print(f"[PHOTO ERROR] Could not load photo: {e}")
                # Draw placeholder if photo fails
                c.setFillColor(colors.HexColor('#f0f0f0'))
                c.rect(photo_x, photo_y, photo_width, photo_height, fill=True, stroke=False)
                c.setFillColor(colors.grey)
                c.setFont("Helvetica", 6)
                c.drawCentredString(photo_x + photo_width/2, photo_y + photo_height/2, "PHOTO")
        else:
            # Draw placeholder
            c.setFillColor(colors.HexColor('#f0f0f0'))
            c.rect(photo_x, photo_y, photo_width, photo_height, fill=True, stroke=False)
            c.setFillColor(colors.grey)
            c.setFont("Helvetica", 6)
            c.drawCentredString(photo_x + photo_width/2, photo_y + photo_height/2, "PHOTO")
        
        # --- 6. Voter Details (Right Side) ---
        text_x = 1.15 * inch
        c.setFillColor(colors.black)
        
        # EPIC Number (Highlighted)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(text_x, 1.45*inch, "VOTER ID / EPIC NO.")
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(colors.HexColor('#e67e22'))  # Professional Orange for ID
        c.drawString(text_x, 1.3*inch, voter_id)
        
        # Personal Info
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 6)
        c.drawString(text_x, 1.1*inch, "NAME")
        c.setFont("Helvetica", 8)
        c.drawString(text_x, 0.98*inch, name.upper())
        
        c.setFont("Helvetica-Bold", 6)
        c.drawString(text_x, 0.82*inch, "AGE / GENDER")
        c.setFont("Helvetica", 8)
        c.drawString(text_x, 0.70*inch, f"{age}  /  {gender.upper()}")
        
        c.setFont("Helvetica-Bold", 6)
        c.drawString(text_x, 0.54*inch, "AADHAAR (MASKED)")
        c.setFont("Helvetica", 8)
        masked_aadhaar = f"XXXX-XXXX-{aadhaar[-4:]}"
        c.drawString(text_x, 0.42*inch, masked_aadhaar)
        
        # --- 7. QR Code & Security ---
        qr = qrcode.QRCode(version=1, box_size=3, border=1)
        qr.add_data(f"VOTER_ID:{voter_id}|NAME:{name}")
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        # Save QR code to BytesIO buffer
        qr_buffer = BytesIO()
        qr_img.save(qr_buffer, format='PNG')
        qr_buffer.seek(0)
        
        # Draw QR code using ImageReader
        c.drawImage(ImageReader(qr_buffer), width - 0.75*inch, 0.4*inch, width=0.6*inch, height=0.6*inch)
        
        # --- 8. Footer ---
        c.setFillColor(colors.grey)
        c.setFont("Helvetica-Bold", 5)
        c.drawString(text_x, 0.22*inch, "CONSTITUENCY: CYBER DISTRICT 01")
        c.drawRightString(width - 0.15*inch, 0.15*inch, f"ISSUED: {datetime.now().strftime('%d/%m/%Y')}")
        
        # Save PDF to buffer
        c.save()
        
        # Reset buffer position to beginning
        pdf_buffer.seek(0)
        
        return pdf_buffer
        
    except Exception as e:
        print(f"[VOTER CARD ERROR] {e}")
        return None

# =========================
# EMAIL FUNCTIONS
# =========================

def send_email(to_email, subject, body_html, attachment_path=None):
    """
    Send email with optional attachment
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        body_html: HTML body content
        attachment_path: Optional path to file attachment OR BytesIO buffer
    
    Returns:
        bool: True if sent successfully, False otherwise
    """
    try:
        # Check if email is configured
        if not app.config['MAIL_USERNAME'] or not app.config['MAIL_PASSWORD']:
            print("[EMAIL] Email not configured. Skipping email send.")
            return False
        
        msg = Message(
            subject=subject,
            recipients=[to_email],
            html=body_html
        )
        
        # Attach file if provided (supports both file paths and BytesIO buffers)
        if attachment_path:
            if isinstance(attachment_path, BytesIO):
                # Handle BytesIO buffer
                attachment_path.seek(0)
                msg.attach(
                    'receipt.pdf',
                    'application/pdf',
                    attachment_path.read()
                )
            elif os.path.exists(attachment_path):
                # Handle file path
                with open(attachment_path, 'rb') as f:
                    msg.attach(
                        os.path.basename(attachment_path),
                        'application/pdf',
                        f.read()
                    )
        
        mail.send(msg)
        print(f"[EMAIL] Sent to {to_email}: {subject}")
        return True
        
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {to_email}: {e}")
        return False

def send_registration_email(voter_name, voter_id, voter_email):
    """Send registration confirmation email"""
    subject = "🎉 Registration Successful - SmartVote System"
    

    body_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #053c6d; color: white; padding: 30px; text-align: center; border-radius: 10px;">
            <h1>🎉 Registration Successful!</h1>
        </div>
        <div style="padding: 30px; background: #f5f5f5; margin-top: 20px; border-radius: 10px;">
            <h2>Welcome to SmartVote, {voter_name}!</h2>
            <p>Your voter registration has been successfully completed.</p>
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Your Voter ID:</strong> <span style="color: #053c6d; font-size: 24px; font-weight: bold;">{voter_id}</span></p>
            </div>
            <p>Please keep this Voter ID safe. You will need it to authenticate and cast your vote.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This is an automated message from the SmartVote Blockchain Voting System.
            </p>
        </div>
    </body>
    </html>
    """
    
    return send_email(voter_email, subject, body_html)

# =========================
# OTP ENDPOINTS
# =========================

@app.route('/api/request-registration-otp', methods=['POST'])
@limiter.limit("5 per hour")
def request_registration_otp():
    """Send OTP to phone number for registration verification"""
    try:
        data = request.get_json()
        phone = data.get('phone', '').strip()
        
        # Validate phone number (exactly 10 digits)
        if not phone or not phone.isdigit() or len(phone) != 10:
            return jsonify({
                'success': False,
                'message': 'Invalid phone number. Must be exactly 10 digits.'
            }), 400
        
        # Generate 6-digit OTP
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Store OTP with timestamp
        otp_store[phone] = {
            'otp': otp,
            'timestamp': time.time()
        }
        
        # Send OTP via Fast2SMS
        # --- NEW CLEANER LOGIC ---
        fast2sms_key = os.getenv('FAST2SMS_KEY')
        
        if fast2sms_key:
            # Strip any spaces and take ONLY the first 80 characters
            # This fixes the "160 char" duplication error automatically
            fast2sms_key = fast2sms_key.strip()
            if len(fast2sms_key) > 80:
                fast2sms_key = fast2sms_key[:80]
        # --------------------------
        
        if not fast2sms_key:
            return jsonify({
                'success': False,
                'message': 'SMS service not configured'
            }), 500
        
        # Fast2SMS API call (Quick SMS Route - works immediately)
        url = "https://www.fast2sms.com/dev/bulkV2"
        
        # Use Quick SMS route (no verification needed, costs ₹5/SMS)
        payload = {
            "route": "q",
            "message": f"Your SmartVote registration OTP is {otp}. Valid for 5 minutes. Do not share this code.",
            "language": "english",
            "flash": 0,
            "numbers": phone
        }
        
        headers = {
            "authorization": fast2sms_key,
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('return'):
                    # Mask phone number for display
                    masked_phone = f"******{phone[-4:]}"
                    print(f"[FAST2SMS SUCCESS] OTP sent to {phone}")
                    return jsonify({
                        'success': True,
                        'message': f'OTP sent to {masked_phone}',
                        'maskedPhone': masked_phone
                    }), 200
                else:
                    print(f"[FAST2SMS ERROR] Response: {result}")
                    return jsonify({
                        'success': False,
                        'message': f"Failed to send OTP: {result.get('message', 'Unknown error')}"
                    }), 500
            else:
                print(f"[FAST2SMS ERROR] Status: {response.status_code}, Response: {response.text}")
                return jsonify({
                    'success': False,
                    'message': f'SMS service error: {response.status_code}'
                }), 500
        except Exception as e:
            print(f"CONNECTION ERROR: {e}")
            return jsonify({
                'success': False,
                'message': 'Connection failed'
            }), 500
            
    except Exception as e:
        print(f"[OTP REQUEST ERROR] {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to send OTP. Please try again.'
        }), 500


@app.route('/api/verify-registration-otp', methods=['POST'])
@limiter.limit("10 per hour")
def verify_registration_otp():
    """Verify OTP for registration"""
    try:
        data = request.get_json()
        phone = data.get('phone', '').strip()
        otp = data.get('otp', '').strip()
        
        if not phone or not otp:
            return jsonify({
                'success': False,
                'message': 'Phone number and OTP are required'
            }), 400
        
        # Check if OTP exists
        if phone not in otp_store:
            return jsonify({
                'success': False,
                'message': 'No OTP found. Please request a new one.'
            }), 404
        
        stored_data = otp_store[phone]
        stored_otp = stored_data['otp']
        timestamp = stored_data['timestamp']
        
        # Check if OTP expired (5 minutes = 300 seconds)
        if time.time() - timestamp > 300:
            del otp_store[phone]
            return jsonify({
                'success': False,
                'message': 'OTP expired. Please request a new one.'
            }), 401
        
        # Verify OTP
        if otp == stored_otp:
            # Delete OTP after successful verification
            del otp_store[phone]
            return jsonify({
                'success': True,
                'message': 'Phone number verified successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid OTP. Please try again.'
            }), 401
            
    except Exception as e:
        print(f"[OTP VERIFY ERROR] {e}")
        return jsonify({
            'success': False,
            'message': 'Verification failed. Please try again.'
        }), 500


# =========================
# API ENDPOINTS
# =========================

@app.route('/api/register', methods=['POST'])
@limiter.limit("10 per hour")
def register_voter():
    """Register a new voter with facial biometric"""
    try:
        # Get form data
        name = request.form.get('name')
        age = int(request.form.get('age', 0))
        gender = request.form.get('gender')
        email = request.form.get('email')
        mobile = request.form.get('mobile')
        aadhaar = request.form.get('aadhaar')
        photo = request.files.get('photo')
        
        # Validate required fields
        if not all([name, age, gender, email, mobile, aadhaar, photo]):
            log_audit('REGISTRATION', 'FAILURE', user_email=email, error_message='Missing required fields')
            return jsonify({'success': False, 'message': 'All fields are required'}), 400
        
        # Validate email format - only Gmail allowed
        import re
        email_regex = r'^[^\s@]+@gmail\.com$'
        if not re.match(email_regex, email.lower()):
            log_audit('REGISTRATION', 'FAILURE', user_email=email, error_message='Only Gmail addresses allowed')
            return jsonify({
                'success': False, 
                'message': 'Only Gmail addresses are allowed for voter registration (e.g., user@gmail.com)'
            }), 400
        
        # Validate phone number - exactly 10 digits
        phone_regex = r'^\d{10}$'
        if not re.match(phone_regex, mobile.strip()):
            log_audit('REGISTRATION', 'FAILURE', user_email=email, error_message='Invalid phone number')
            return jsonify({
                'success': False, 
                'message': 'Phone number must be exactly 10 digits'
            }), 400
        
        # Validate age
        if age < 18:
            log_audit('REGISTRATION', 'FAILURE', user_email=email, error_message='Age below 18')
            return jsonify({'success': False, 'message': 'You must be at least 18 years old to register'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Normalize Aadhaar for comparison (remove dashes and X)
        normalized_aadhaar = aadhaar.replace('-', '').replace('X', '')
        
        # Check if Aadhaar already exists (normalized comparison)
        cursor.execute(
            "SELECT voter_id FROM registered_voter WHERE REPLACE(REPLACE(aadhaar, '-', ''), 'X', '') = %s", 
            (normalized_aadhaar,)
        )
        if cursor.fetchone():
            cursor.close()
            conn.close()
            log_audit('REGISTRATION', 'FAILURE', user_email=email, error_message='Aadhaar already registered')
            return jsonify({'success': False, 'message': 'This Aadhaar number is already registered'}), 400
        
        # Check if email already exists
        cursor.execute("SELECT voter_id FROM registered_voter WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            log_audit('REGISTRATION', 'FAILURE', user_email=email, error_message='Email already registered')
            return jsonify({'success': False, 'message': 'This email is already registered'}), 400
        
        # Generate unique voter ID
        voter_id = f"VOTE{random.randint(100000, 999999)}"
        while True:
            cursor.execute("SELECT voter_id FROM registered_voter WHERE voter_id = %s", (voter_id,))
            if not cursor.fetchone():
                break
            voter_id = f"VOTE{random.randint(100000, 999999)}"
        
        # Save photo
        filename = secure_filename(f"{voter_id}_{uuid.uuid4().hex}.jpg")
        photo_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        photo.save(photo_path)
        
        # Insert voter into database
        query = """
            INSERT INTO registered_voter 
            (voter_id, name, age, gender, email, mobile, aadhaar, photo_path, has_voted)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, FALSE)
        """
        cursor.execute(query, (voter_id, name, age, gender, email, mobile, aadhaar, photo_path))
        conn.commit()
        cursor.close()
        conn.close()
        
        # Log success
        log_audit('REGISTRATION', 'SUCCESS', voter_id=voter_id, user_email=email, 
                 action_details=json.dumps({'name': name, 'aadhaar': aadhaar[-4:]}))
        
        # Send registration email
        send_registration_email(name, voter_id, email)
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'voter_id': voter_id
        }), 201
        
    except Exception as e:
        print(f"[REGISTRATION ERROR] {e}")
        log_audit('REGISTRATION', 'FAILURE', user_email=email, error_message=str(e))
        return jsonify({'success': False, 'message': f'Registration failed: {str(e)}'}), 500


@app.route('/api/find-voter', methods=['GET'])
@limiter.limit("30 per minute")
def find_voter():
    """Find voter by Voter ID or Aadhaar"""
    try:
        query = request.args.get('query', '').strip()
        
        if not query:
            return jsonify({'success': False, 'message': 'Query parameter is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Normalize Aadhaar by removing dashes and X for comparison
        normalized_query = query.replace('-', '').replace('X', '')
        
        # Search by voter_id or aadhaar (with normalization)
        sql = """
            SELECT voter_id, name, age, gender, email, mobile, aadhaar, 
                   photo_path, has_voted, registration_date
            FROM registered_voter 
            WHERE voter_id = %s 
               OR REPLACE(REPLACE(aadhaar, '-', ''), 'X', '') = %s
        """
        cursor.execute(sql, (query, normalized_query))
        voter = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if voter:
            # Convert to frontend format
            voter_data = {
                'voterId': voter['voter_id'],
                'name': voter['name'],
                'age': voter['age'],
                'gender': voter['gender'],
                'email': voter['email'],
                'phone': voter['mobile'],
                'aadhaar': voter['aadhaar'],
                'photoPath': voter['photo_path'],
                'hasVoted': bool(voter['has_voted']),
                'registrationDate': voter['registration_date'].isoformat() if voter['registration_date'] else None
            }
            
            log_audit('VOTER_LOOKUP', 'SUCCESS', voter_id=voter['voter_id'], 
                     action_details=json.dumps({'query': query}))
            
            return jsonify({'success': True, 'voter': voter_data}), 200
        else:
            return jsonify({'success': False, 'message': 'Voter not found'}), 404
            
    except Exception as e:
        print(f"[FIND VOTER ERROR] {e}")
        return jsonify({'success': False, 'message': f'Search failed: {str(e)}'}), 500


@app.route('/api/generate-voter-card', methods=['POST'])
@limiter.limit("10 per hour")
def generate_voter_card_api():
    """Generate and download voter ID card (EPIC)"""
    try:
        data = request.get_json()
        voter_id = data.get('voterId')
        
        if not voter_id:
            return jsonify({'success': False, 'message': 'Voter ID is required'}), 400
        
        # Get voter from database
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM registered_voter WHERE voter_id = %s", (voter_id,))
        voter = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not voter:
            return jsonify({'success': False, 'message': 'Voter not found'}), 404
        
        # Generate voter card PDF with photo (returns BytesIO buffer)
        pdf_buffer = generate_voter_card(
            voter_id=voter['voter_id'],
            name=voter['name'],
            age=voter['age'],
            gender=voter['gender'],
            aadhaar=voter['aadhaar'],
            photo_path=voter.get('photo_path')  # Pass the photo path
        )
        
        if not pdf_buffer:
            return jsonify({'success': False, 'message': 'Failed to generate voter card'}), 500
        
        # Send PDF from memory
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'voter_card_{voter_id}.pdf'
        )
        
    except Exception as e:
        print(f"[GENERATE VOTER CARD ERROR] {e}")
        return jsonify({'success': False, 'message': f'Failed to generate voter card: {str(e)}'}), 500


@app.route('/api/generate-receipt', methods=['POST'])
@limiter.limit("10 per hour")
def generate_receipt_api():
    """Generate and download voting receipt"""
    try:
        data = request.get_json()
        voter_id = data.get('voterId')
        voter_name = data.get('voterName')
        candidate_name = data.get('candidateName')
        tx_hash = data.get('txHash')
        timestamp = data.get('timestamp')
        
        if not all([voter_id, voter_name, candidate_name, tx_hash, timestamp]):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        # Generate receipt PDF (returns BytesIO buffer)
        pdf_buffer = generate_vote_receipt(
            voter_id=voter_id,
            voter_name=voter_name,
            candidate_name=candidate_name,
            tx_hash=tx_hash,
            timestamp=timestamp
        )
        
        if not pdf_buffer:
            return jsonify({'success': False, 'message': 'Failed to generate receipt'}), 500
        
        # Send PDF from memory
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'voting_receipt_{voter_id}.pdf'
        )
        
    except Exception as e:
        print(f"[GENERATE RECEIPT ERROR] {e}")
        return jsonify({'success': False, 'message': f'Failed to generate receipt: {str(e)}'}), 500


@app.route('/api/authenticate', methods=['POST'])
@limiter.limit("10 per minute")
def authenticate_voter():
    """Authenticate voter using facial recognition with liveness detection"""
    try:
        data = request.get_json()
        voter_id = data.get('voterId')
        live_image = data.get('image')  # Base64 encoded image
        liveness_frames = data.get('livenessFrames', [])  # Array of base64 frames for liveness
        
        if not voter_id or not live_image:
            return jsonify({'success': False, 'message': 'Voter ID and image are required'}), 400
        
        # Get voter from database
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM registered_voter WHERE voter_id = %s", (voter_id,))
        voter = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not voter:
            log_audit('AUTHENTICATION', 'FAILURE', voter_id=voter_id, error_message='Voter not found')
            return jsonify({'success': False, 'message': 'Voter not found'}), 404
        
        # Check if already voted
        if voter['has_voted']:
            log_audit('AUTHENTICATION', 'FAILURE', voter_id=voter_id, error_message='Already voted')
            return jsonify({'success': False, 'message': 'You have already voted'}), 403
        
        # ============================================
        # STAGE 1: LIVENESS DETECTION (Anti-Spoofing)
        # ============================================
        liveness_result = None
        if liveness_frames and len(liveness_frames) > 0:
            try:
                from liveness_detector import get_liveness_detector
                detector = get_liveness_detector()
                liveness_result = detector.verify_liveness_challenges(liveness_frames)
                
                print(f"[LIVENESS] Result: {liveness_result}")
                
                # If liveness check fails, reject authentication
                if not liveness_result.get('overall', False):
                    log_audit('AUTHENTICATION', 'FAILURE', voter_id=voter_id, user_email=voter['email'],
                             error_message=f"Liveness check failed: {liveness_result.get('message', 'Unknown')}")
                    
                    return jsonify({
                        'success': False,
                        'message': 'Liveness verification failed. Please ensure you are a real person and blink naturally.',
                        'liveness': liveness_result
                    }), 403
                
                print(f"[LIVENESS] ✓ Passed - Blinks: {liveness_result.get('blink_count', 0)}, Variation: {liveness_result.get('frame_variation', 0)}")
                
            except Exception as e:
                print(f"[LIVENESS ERROR] {str(e)}")
                # If liveness detection fails due to error, log but continue
                # (You can make this stricter by returning error here)
                liveness_result = {
                    'blink': False,
                    'blink_count': 0,
                    'frame_variation': 0.0,
                    'overall': False,
                    'message': f'Liveness detection error: {str(e)}'
                }
        else:
            print("[LIVENESS] No liveness frames provided - skipping liveness check")
        
        # ============================================
        # STAGE 2: DEEPFACE FACIAL RECOGNITION
        # ============================================
        
        # Decode base64 image
        try:
            image_data = live_image.split(',')[1] if ',' in live_image else live_image
            image_bytes = base64.b64decode(image_data)
            nparr = np.frombuffer(image_bytes, np.uint8)
            live_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception as e:
            log_audit('AUTHENTICATION', 'FAILURE', voter_id=voter_id, error_message='Invalid image format')
            return jsonify({'success': False, 'message': 'Invalid image format'}), 400
        
        # Get registered photo path
        registered_photo_path = voter['photo_path']
        
        if not os.path.exists(registered_photo_path):
            log_audit('AUTHENTICATION', 'FAILURE', voter_id=voter_id, error_message='Registered photo not found')
            return jsonify({'success': False, 'message': 'Registered photo not found'}), 500
        
        # Perform face verification using DeepFace
        temp_live_path = None
        try:
            # Save live image temporarily
            temp_live_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_{uuid.uuid4().hex}.jpg")
            cv2.imwrite(temp_live_path, live_img)
            
            # DeepFace verification
            result = DeepFace.verify(
                img1_path=registered_photo_path,
                img2_path=temp_live_path,
                model_name="Facenet",
                detector_backend="opencv",
                enforce_detection=True,
                distance_metric="cosine"
            )
            
            # Clean up temp file
            if os.path.exists(temp_live_path):
                os.remove(temp_live_path)
            
            # Check verification result with custom threshold
            distance = result['distance']
            custom_threshold = 0.60  # DeepFace default threshold for Facenet model
            verified = distance < custom_threshold
            confidence = max(0, min(100, (1 - distance) * 100))
            
            # DEBUG: Print distance for troubleshooting
            print(f"[DEEPFACE] Distance: {distance}, Threshold: {custom_threshold}, Verified: {verified}, Confidence: {confidence}%")
            
            if verified:
                # Prepare audit details
                audit_details = {
                    'confidence': confidence,
                    'distance': distance
                }
                
                # Add liveness metrics to audit log
                if liveness_result:
                    audit_details['liveness'] = {
                        'blink_count': liveness_result.get('blink_count', 0),
                        'frame_variation': liveness_result.get('frame_variation', 0.0),
                        'passed': liveness_result.get('overall', False)
                    }
                
                log_audit('AUTHENTICATION', 'SUCCESS', voter_id=voter_id, user_email=voter['email'],
                         action_details=json.dumps(audit_details))
                
                return jsonify({
                    'success': True,
                    'message': 'Authentication successful',
                    'confidence': round(confidence, 2),
                    'distance': round(distance, 4),
                    'liveness': liveness_result if liveness_result else None
                }), 200
            else:
                log_audit('AUTHENTICATION', 'FAILURE', voter_id=voter_id, user_email=voter['email'],
                         error_message=f'Face mismatch. Distance: {distance}, Threshold: {custom_threshold}')
                
                print(f"[DEEPFACE] ❌ FAILED - Distance {distance} exceeds threshold {custom_threshold}")
                
                return jsonify({
                    'success': False,
                    'message': f'Face verification failed. Distance: {round(distance, 4)} (threshold: {custom_threshold}). Please ensure good lighting and face the camera directly.',
                    'confidence': round(confidence, 2),
                    'distance': round(distance, 4),
                    'liveness': liveness_result if liveness_result else None
                }), 401
                
        except Exception as e:
            # Clean up temp file on error
            if temp_live_path and os.path.exists(temp_live_path):
                os.remove(temp_live_path)
            
            error_msg = str(e)
            if 'Face could not be detected' in error_msg:
                log_audit('AUTHENTICATION', 'FAILURE', voter_id=voter_id, error_message='No face detected')
                return jsonify({'success': False, 'message': 'No face detected in image. Please ensure your face is clearly visible.'}), 400
            
            # Generic user-friendly message for any verification error
            log_audit('AUTHENTICATION', 'FAILURE', voter_id=voter_id, error_message=error_msg)
            return jsonify({'success': False, 'message': 'Blink naturally for the first 5 seconds, then stay still for face matching.'}), 500
            
    except Exception as e:
        print(f"[AUTHENTICATION ERROR] {e}")
        return jsonify({'success': False, 'message': f'Authentication failed: {str(e)}'}), 500


@app.route('/api/vote', methods=['POST'])
@limiter.limit("5 per minute")
def cast_vote():
    """Cast vote on blockchain"""
    try:
        data = request.get_json()
        email = data.get('email')
        candidate_id = data.get('candidateId')
        
        if not all([email, candidate_id]):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        # Get voter from database
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM registered_voter WHERE email = %s", (email,))
        voter = cursor.fetchone()
        
        if not voter:
            cursor.close()
            conn.close()
            log_audit('VOTE_CAST', 'FAILURE', user_email=email, error_message='Voter not found')
            return jsonify({'success': False, 'message': 'Voter not found'}), 404
        
        # Check if already voted
        if voter['has_voted']:
            cursor.close()
            conn.close()
            log_audit('VOTE_CAST', 'FAILURE', voter_id=voter['voter_id'], user_email=email, 
                     error_message='Already voted')
            return jsonify({'success': False, 'message': 'You have already voted'}), 403
        
        # Generate voter hash from voter_id (not email)
        import hashlib
        voter_hash = '0x' + hashlib.sha256(voter['voter_id'].encode()).hexdigest()
        
        # Cast vote on blockchain
        if not voting_contract:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Blockchain contract not loaded'}), 500
        
        try:
            # Get admin account (first account in Ganache)
            accounts = w3.eth.accounts
            if not accounts:
                raise Exception("No accounts available")
            
            admin_account = accounts[0]
            
            # Call smart contract castVote function
            tx_hash = voting_contract.functions.castVote(
                voter_hash,
                candidate_id
            ).transact({
                'from': admin_account,
                'gas': 3000000
            })
            
            # Wait for transaction receipt
            tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if tx_receipt['status'] == 1:
                # Update database - mark as voted
                cursor.execute(
                    "UPDATE registered_voter SET has_voted = TRUE WHERE email = %s",
                    (email,)
                )
                conn.commit()
                cursor.close()
                conn.close()
                
                # Log success
                log_audit('VOTE_CAST', 'SUCCESS', voter_id=voter['voter_id'], user_email=email,
                         action_details=json.dumps({
                             'candidate_id': candidate_id,
                             'tx_hash': tx_hash.hex(),
                             'block_number': tx_receipt['blockNumber']
                         }))
                
                return jsonify({
                    'success': True,
                    'message': 'Vote cast successfully',
                    'tx_hash': tx_hash.hex(),
                    'block_number': tx_receipt['blockNumber']
                }), 200
            else:
                cursor.close()
                conn.close()
                log_audit('VOTE_CAST', 'FAILURE', voter_id=voter['voter_id'], user_email=email,
                         error_message='Transaction reverted')
                return jsonify({'success': False, 'message': 'Blockchain transaction failed'}), 500
                
        except Exception as e:
            cursor.close()
            conn.close()
            error_msg = str(e)
            log_audit('VOTE_CAST', 'FAILURE', voter_id=voter['voter_id'], user_email=email,
                     error_message=error_msg)
            
            if 'Already voted' in error_msg:
                return jsonify({'success': False, 'message': 'Vote already recorded on blockchain'}), 403
            
            return jsonify({'success': False, 'message': f'Blockchain error: {error_msg}'}), 500
            
    except Exception as e:
        print(f"[VOTE CAST ERROR] {e}")
        return jsonify({'success': False, 'message': f'Vote casting failed: {str(e)}'}), 500


@app.route('/api/results', methods=['GET'])
def get_results():
    """Get voting results from blockchain"""
    try:
        if not voting_contract:
            return jsonify([]), 200
        
        candidates_count = voting_contract.functions.candidatesCount().call()
        results = []
        
        for i in range(1, candidates_count + 1):
            candidate = voting_contract.functions.candidates(i).call()
            results.append({
                'id': candidate[0],
                'name': candidate[1],
                'votes': candidate[2]
            })
        
        return jsonify(results), 200
        
    except Exception as e:
        print(f"[RESULTS ERROR] {e}")
        return jsonify([]), 200


@app.route('/api/history', methods=['GET'])
def get_vote_history():
    """Get vote history from blockchain"""
    try:
        if not voting_contract:
            return jsonify([]), 200
        
        total_records = voting_contract.functions.getTotalVoteRecords().call()
        history = []
        
        for i in range(total_records):
            record = voting_contract.functions.getVoteRecord(i).call()
            history.append({
                'voterHash': record[0],
                'candidateId': record[1],
                'timestamp': record[2],
                'blockNumber': record[3]
            })
        
        return jsonify(history), 200
        
    except Exception as e:
        print(f"[HISTORY ERROR] {e}")
        return jsonify([]), 200


@app.route('/api/voters', methods=['GET'])
@require_admin_auth
def get_all_voters():
    """Get all registered voters (Admin only)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT voter_id, name, age, gender, email, mobile, aadhaar, 
                   has_voted, registration_date
            FROM registered_voter
            ORDER BY registration_date DESC
        """)
        
        voters = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Convert to frontend format
        voters_list = []
        for voter in voters:
            voters_list.append({
                'voterId': voter['voter_id'],
                'name': voter['name'],
                'age': voter['age'],
                'gender': voter['gender'],
                'email': voter['email'],
                'phone': voter['mobile'],
                'aadhaar': voter['aadhaar'],
                'hasVoted': bool(voter['has_voted']),
                'registrationDate': voter['registration_date'].isoformat() if voter['registration_date'] else None
            })
        
        return jsonify({'success': True, 'voters': voters_list}), 200
        
    except Exception as e:
        print(f"[GET VOTERS ERROR] {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/voting-status', methods=['GET'])
def get_voting_status():
    """Get current voting status from blockchain"""
    try:
        if not voting_contract:
            return jsonify({
                'active': False,
                'start': 0,
                'end': 0,
                'currentTime': 0
            }), 200
        
        status = voting_contract.functions.getVotingStatus().call()
        
        return jsonify({
            'active': status[0],
            'start': status[1],
            'end': status[2],
            'currentTime': status[3]
        }), 200
        
    except Exception as e:
        print(f"[VOTING STATUS ERROR] {e}")
        return jsonify({
            'active': False,
            'start': 0,
            'end': 0,
            'currentTime': 0
        }), 200


@app.route('/api/start-voting', methods=['POST'])
@require_admin_auth
def start_voting():
    """Start voting period (Admin only)"""
    try:
        if not voting_contract:
            return jsonify({'success': False, 'message': 'Contract not loaded'}), 500
        
        data = request.get_json()
        duration = data.get('duration', 86400)  # Default 24 hours in seconds
        
        # Get admin account (first account in Ganache)
        accounts = w3.eth.accounts
        if not accounts:
            return jsonify({'success': False, 'message': 'No accounts available'}), 500
        
        admin_account = accounts[0]
        
        # Call startVoting on contract
        tx_hash = voting_contract.functions.startVoting(duration).transact({
            'from': admin_account,
            'gas': 3000000
        })
        
        # Wait for transaction
        w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return jsonify({
            'success': True,
            'message': f'Voting started for {duration} seconds',
            'txHash': tx_hash.hex()
        }), 200
        
    except Exception as e:
        print(f"[START VOTING ERROR] {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/end-voting', methods=['POST'])
@require_admin_auth
def end_voting():
    """End voting period (Admin only)"""
    try:
        if not voting_contract:
            return jsonify({'success': False, 'message': 'Contract not loaded'}), 500
        
        # Get admin account (first account in Ganache)
        accounts = w3.eth.accounts
        if not accounts:
            return jsonify({'success': False, 'message': 'No accounts available'}), 500
        
        admin_account = accounts[0]
        
        # Call endVoting on contract
        tx_hash = voting_contract.functions.endVoting().transact({
            'from': admin_account,
            'gas': 3000000
        })
        
        # Wait for transaction
        w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return jsonify({
            'success': True,
            'message': 'Voting ended successfully',
            'txHash': tx_hash.hex()
        }), 200
        
    except Exception as e:
        print(f"[END VOTING ERROR] {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/extend-voting', methods=['POST'])
@require_admin_auth
def extend_voting():
    """Extend voting period (Admin only)"""
    try:
        if not voting_contract:
            return jsonify({'success': False, 'message': 'Contract not loaded'}), 500
        
        data = request.get_json()
        additional_time = data.get('additionalTime', 3600)  # Default 1 hour in seconds
        
        # Get admin account (first account in Ganache)
        accounts = w3.eth.accounts
        if not accounts:
            return jsonify({'success': False, 'message': 'No accounts available'}), 500
        
        admin_account = accounts[0]
        
        # Call extendVoting on contract
        tx_hash = voting_contract.functions.extendVoting(additional_time).transact({
            'from': admin_account,
            'gas': 3000000
        })
        
        # Wait for transaction
        w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return jsonify({
            'success': True,
            'message': f'Voting extended by {additional_time} seconds',
            'txHash': tx_hash.hex()
        }), 200
        
    except Exception as e:
        print(f"[EXTEND VOTING ERROR] {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/publish-results', methods=['POST'])
@require_admin_auth
def publish_results():
    """Publish election results (Admin only)"""
    try:
        if not voting_contract:
            return jsonify({'success': False, 'message': 'Contract not loaded'}), 500
        
        # Get admin account (first account in Ganache)
        accounts = w3.eth.accounts
        if not accounts:
            return jsonify({'success': False, 'message': 'No accounts available'}), 500
        
        admin_account = accounts[0]
        
        # Call publishResults on contract
        tx_hash = voting_contract.functions.publishResults().transact({
            'from': admin_account,
            'gas': 3000000
        })
        
        # Wait for transaction
        w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return jsonify({
            'success': True,
            'message': 'Results published successfully',
            'txHash': tx_hash.hex()
        }), 200
        
    except Exception as e:
        print(f"[PUBLISH RESULTS ERROR] {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/unpublish-results', methods=['POST'])
@require_admin_auth
def unpublish_results():
    """Unpublish election results (Admin only)"""
    try:
        if not voting_contract:
            return jsonify({'success': False, 'message': 'Contract not loaded'}), 500
        
        # Get admin account (first account in Ganache)
        accounts = w3.eth.accounts
        if not accounts:
            return jsonify({'success': False, 'message': 'No accounts available'}), 500
        
        admin_account = accounts[0]
        
        # Call unpublishResults on contract
        tx_hash = voting_contract.functions.unpublishResults().transact({
            'from': admin_account,
            'gas': 3000000
        })
        
        # Wait for transaction
        w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return jsonify({
            'success': True,
            'message': 'Results unpublished successfully',
            'txHash': tx_hash.hex()
        }), 200
        
    except Exception as e:
        print(f"[UNPUBLISH RESULTS ERROR] {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/results-status', methods=['GET'])
def get_results_status():
    """Get results publication status"""
    try:
        if not voting_contract:
            return jsonify({'published': False}), 200
        
        published = voting_contract.functions.resultsPublished().call()
        
        return jsonify({'published': published}), 200
        
    except Exception as e:
        print(f"[RESULTS STATUS ERROR] {e}")
        return jsonify({'published': False}), 200


@app.route('/api/voter-stats', methods=['GET'])
def get_voter_stats():
    """Get voter statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get total registered voters
        cursor.execute("SELECT COUNT(*) as total FROM registered_voter")
        total_voters = cursor.fetchone()['total']
        
        # Get total vote records from blockchain
        total_records = 0
        if voting_contract:
            total_records = voting_contract.functions.getTotalVoteRecords().call()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'totalVoters': total_voters,
            'totalRecords': total_records
        }), 200
        
    except Exception as e:
        print(f"[VOTER STATS ERROR] {e}")
        return jsonify({'totalVoters': 0, 'totalRecords': 0}), 200


@app.route('/api/audit-stats', methods=['GET'])
@require_admin_auth
def get_audit_stats():
    """Get audit log statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get total logs
        cursor.execute("SELECT COUNT(*) as total FROM audit_log")
        total_logs = cursor.fetchone()['total']
        
        # Get success count
        cursor.execute("SELECT COUNT(*) as count FROM audit_log WHERE status = 'SUCCESS'")
        success_count = cursor.fetchone()['count']
        
        # Get failure count
        cursor.execute("SELECT COUNT(*) as count FROM audit_log WHERE status = 'FAILURE'")
        failure_count = cursor.fetchone()['count']
        
        # Get action statistics
        cursor.execute("""
            SELECT action_type, status, COUNT(*) as count 
            FROM audit_log 
            GROUP BY action_type, status 
            ORDER BY count DESC 
            LIMIT 10
        """)
        action_stats = cursor.fetchall()
        
        # Get suspicious activities (multiple failures from same IP)
        cursor.execute("""
            SELECT ip_address, action_type, COUNT(*) as failure_count
            FROM audit_log
            WHERE status = 'FAILURE' 
            AND timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            GROUP BY ip_address, action_type
            HAVING failure_count >= 3
            ORDER BY failure_count DESC
        """)
        suspicious_activities = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'total_logs': total_logs,
            'success_count': success_count,
            'failure_count': failure_count,
            'action_stats': action_stats,
            'suspicious_activities': suspicious_activities
        }), 200
        
    except Exception as e:
        print(f"[AUDIT STATS ERROR] {e}")
        return jsonify({
            'total_logs': 0,
            'success_count': 0,
            'failure_count': 0,
            'action_stats': [],
            'suspicious_activities': []
        }), 200


@app.route('/api/audit-logs', methods=['GET'])
@require_admin_auth
def get_audit_logs():
    """Get recent audit logs"""
    try:
        limit = request.args.get('limit', 50, type=int)
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id, action_type, voter_id, user_email, ip_address, 
                   user_agent, action_details, status, error_message, timestamp
            FROM audit_log
            ORDER BY timestamp DESC
            LIMIT %s
        """, (limit,))
        
        logs = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'logs': logs}), 200
        
    except Exception as e:
        print(f"[AUDIT LOGS ERROR] {e}")
        return jsonify({'success': False, 'logs': []}), 200


# =========================
# RUN SERVER
# =========================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 SMARTVOTE BLOCKCHAIN VOTING SYSTEM")
    print("="*60)
    print(f"📡 Backend API: http://localhost:5000")
    print(f"🗄️  Database: {DB_CONFIG['database']}@{DB_CONFIG['host']}")
    print(f"⛓️  Blockchain: {GANACHE_URL}")
    if voting_contract:
        print(f"📜 Contract: {CONTRACT_ADDRESS}")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
