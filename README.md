# 🗳️ SmartVote - Blockchain & AI Voting System

A secure, transparent, and tamper-proof voting system powered by Ethereum blockchain, AI-based facial recognition, and OTP verification.

## ⚡ Quick Start

```bash
# 1. Clone and install
git clone <your-repo-url>
cd smartvote_blockchain_ai_system
npm install

# 2. Setup backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows (or source venv/bin/activate on Linux/Mac)
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
cp backend/.env.example backend/.env
# Edit backend/.env with:
#   - MySQL password
#   - Ganache URL
#   - Fast2SMS API key (for OTP)
#   - Email credentials (optional)

# 4. Setup database
cd backend
python setup_db.py
# Or manually: mysql -u root -p < schema.sql

# 5. Start Ganache (port 7545)
# Open Ganache GUI or run: ganache --port 7545

# 6. Deploy smart contract
python deploy_contract.py
# Copy the contract address to backend/.env

# 7. Run application
python app.py  # Terminal 1 (backend on port 5000)
npm run dev    # Terminal 2 (frontend on port 3000)
```

Visit `http://localhost:3000` to access the application.

---

## 🌟 Features

- **🔐 Biometric Authentication**: DeepFace AI with Facenet model for facial recognition (0.60 threshold)
- **⛓️ Blockchain Voting**: Immutable vote storage on Ethereum (Ganache)
- **🎯 Liveness Detection**: 3-challenge system (Blink, Turn Left, Turn Right) to prevent photo/video spoofing
- **📊 Real-time Results**: Live vote counting from blockchain smart contract
- **🔒 Privacy-First**: SHA-256 voter hashing for anonymity on blockchain
- **� Voter Search**: Search by Voter ID or Aadhaar with au to-formatting
- **📱 Responsive UI**: Modern React interface with professional styling
- **🛡️ Double-Vote Prevention**: Smart contract + database validation

## 🏗️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling (via CDN)
- **Lucide React** for icons
- **Recharts** for data visualization
- **Web3.js** for blockchain interaction

### Backend
- **Flask** (Python web framework)
- **MySQL** for voter registry
- **DeepFace** for facial recognition (Facenet model)
- **OpenCV** for image processing
- **Web3.py** for blockchain interaction
- **Flask-Limiter** for rate limiting
- **Flask-Mail** for email notifications
- **ReportLab** for PDF generation
- **Fast2SMS** for OTP delivery

### Blockchain
- **Solidity** smart contracts (v0.8.0)
- **Ganache** local Ethereum blockchain
- **py-solc-x** for contract compilation

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+ (3.12 recommended)
- **MySQL** 8.0+
- **Ganache** (for local blockchain)
- **Fast2SMS Account** (for OTP functionality)
- **Gmail Account** (optional, for email notifications)

## 🚀 Installation

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd smartvote_blockchain_ai_system
```

### 2. Frontend Setup
```bash
npm install
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Database Setup
```bash
# Create MySQL database
mysql -u root -p < backend/schema.sql

# Or manually:
mysql -u root -p
CREATE DATABASE voter_db;
USE voter_db;
SOURCE backend/schema.sql;
```

### 5. Environment Configuration
```bash
# Copy example env files
cp .env.example .env
cp backend/.env.example backend/.env

# Edit backend/.env with your credentials:
DB_PASSWORD=your_mysql_password
GANACHE_URL=http://127.0.0.1:7545
CONTRACT_ADDRESS=0x... (will be set after deployment)

# Fast2SMS Configuration (Required for OTP)
FAST2SMS_KEY=your_fast2sms_api_key_here

# Email Configuration (Optional)
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password
MAIL_DEFAULT_SENDER=your_email@gmail.com

# Security
SECRET_KEY=generate-a-strong-random-key-here
```

**Getting Fast2SMS API Key:**
1. Sign up at https://www.fast2sms.com/
2. Go to Dashboard → API Keys
3. Copy your API key (80 characters)
4. Add to `backend/.env` as `FAST2SMS_KEY`

### 6. Deploy Smart Contract
```bash
# Make sure Ganache is running on port 7545

# Deploy using Python script (recommended)
cd backend
python deploy_contract.py

# The script will:
# 1. Compile the Solidity contract
# 2. Deploy to Ganache
# 3. Automatically update backend/.env with contract address
# 4. Save ABI to contracts/VotingContract.json

# Verify deployment
# You should see: "✅ CONTRACT DEPLOYED SUCCESSFULLY!"
# Contract address will be displayed
```

## 🎮 Running the Application

### Prerequisites Check
```bash
# 1. Verify MySQL is running
mysql -u root -p -e "SELECT 1;"

# 2. Verify Ganache is running
# Open Ganache GUI or run: ganache --port 7545

# 3. Verify Python packages installed
cd backend
pip list | findstr deepface

# 4. Verify database is set up
mysql -u root -p voter_db -e "SHOW TABLES;"
# Should show: registered_voter, audit_log, voting_control
```

### Start Backend (Terminal 1)
```bash
cd backend
venv\Scripts\activate  # Windows
python app.py
# Backend runs on http://localhost:5000
# You should see:
# ✅ Connected to Ganache
# ✅ Smart contract loaded
```

### Start Frontend (Terminal 2)
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

### Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Ganache**: http://localhost:7545

## 📁 Project Structure

```
smartvote_blockchain_ai_system/
├── components/              # React components
│   ├── VoterRegistration.tsx
│   ├── VoterAuthentication.tsx
│   ├── VotingPanel.tsx
│   ├── VoterSearch.tsx
│   └── AdminDashboard.tsx
├── services/
│   └── api.ts              # API service layer
├── backend/
│   ├── app.py              # Flask server
│   ├── schema.sql          # Database schema
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment template
├── contracts/
│   ├── VotingContract.sol  # Smart contract
│   └── deploy.js           # Deployment script
├── types.ts                # TypeScript definitions
├── constants.tsx           # App constants
└── package.json            # Node dependencies
```

## 🔑 Key Features Explained

### Voter Registration (4-Step Process)
1. **Phone Entry**: Enter 10-digit mobile number
2. **OTP Verification**: Receive and verify 6-digit OTP via SMS (expires in 5 minutes)
3. **Aadhaar Verification**: Enter Aadhaar number (auto-formats as XXXX-XXXX-XXXX)
   - System checks if Aadhaar is already registered
   - Prevents duplicate registrations
4. **Registration Form**:
   - Personal details (Name, Age, Gender)
   - Contact info (Email - Gmail only, Phone - locked from OTP)
   - Biometric photo upload (JPEG/PNG, face detection required)
5. **EPIC ID Generation**: Unique 10-character voter ID (e.g., VOTE123456)
6. **Email Confirmation**: Automated email with voter ID

### Authentication Flow
1. **ID Type Selection**: Choose Voter ID (VOTE123456) or Aadhaar (XXXX-XXXX-XXXX)
2. **Input Validation**: Auto-formatting with real-time validation
3. **Registry Lookup**: Verify voter exists in database
4. **Camera Initialization**: Requests camera permissions
5. **Preparation Phase**: 2.5 seconds to position face
6. **Liveness Challenges** (3 challenges, 5 seconds each):
   - Challenge 1: Blink Eyes
   - Challenge 2: Turn Head Left
   - Challenge 3: Turn Head Right
   - **During challenges**: System captures 15 frames over 3 seconds for liveness detection
7. **Image Capture**: Main authentication image captured 1 second into first challenge
8. **Two-Stage Verification**:
   - **Stage 1 - Liveness Detection** (Anti-Spoofing):
     - Blink detection using Haar Cascades
     - Frame variation analysis (detects static images)
     - Threshold: Frame variation must be ≥ 2.0
     - Rejects printed photos and screen recordings
   - **Stage 2 - DeepFace Verification** (only if liveness passes):
     - Model: Facenet
     - Threshold: 0.40 cosine distance (stricter than default)
     - Detector: OpenCV
9. **Result**: Access granted/denied with confidence score and liveness metrics
10. **Rate Limiting**: Max 10 attempts per minute

### Voting Process
1. **Authentication**: Biometric verification required
2. **Voting Status Check**: System verifies voting period is active
3. **Candidate Selection**: Choose from 7 candidates (TVK, DMK, ADMK, NTK, PMK, MNM, OTA)
4. **Confirmation**: Review selection before final submission
5. **Blockchain Recording**: 
   - Vote cast on smart contract
   - Voter hash (SHA-256) used for anonymity
   - Transaction hash generated
6. **Database Update**: has_voted flag set to TRUE
7. **Receipt Generation**: 
   - PDF receipt with transaction hash
   - QR code for blockchain verification
   - Downloadable and emailable
8. **Double-Vote Prevention**: Smart contract + database validation
9. **Auto-Redirect**: Return to portal after 30 seconds (optional)

### Admin Dashboard (6 Tabs)
1. **Analytics**: 
   - Real-time vote counts from blockchain
   - Voter statistics (total voters, votes cast)
   - Bar charts and metrics
2. **Control Panel**:
   - Start voting (1 hour, 2 hours, 24 hours)
   - End voting immediately
   - Extend voting period (+30 min, +1 hour)
   - Publish/unpublish results
3. **Audit Trail**:
   - Recent activity logs (50 most recent)
   - Suspicious activity detection
   - Action statistics
4. **Voter Registry**:
   - View all registered voters (limited to 20 for performance)
   - Search and filter capabilities
5. **Blockchain Explorer**:
   - Transaction history
   - Vote records with timestamps
6. **Settings**:
   - Admin credential management

## 🔒 Security Features

### Authentication & Verification
- **OTP Verification**: 6-digit OTP via Fast2SMS (5-minute expiry)
- **Face Recognition**: Facenet model with 0.40 cosine distance threshold (stricter)
- **Advanced Liveness Detection**: 
  - Blink detection using OpenCV Haar Cascades
  - Frame variation analysis (threshold: 2.0)
  - Captures 15 frames over 3 seconds
  - Detects and rejects static images (photos/screens)
  - Two-stage verification: Liveness → Face Match
- **Gmail-Only Registration**: Enhanced security with verified email addresses
- **Phone Validation**: Exactly 10 digits required

### Data Protection
- **Voter Anonymity**: SHA-256 hashing before blockchain storage
- **Aadhaar Masking**: Only last 4 digits displayed (XXXX-XXXX-1234)
- **Secure Storage**: Environment variables for sensitive data
- **Photo Encryption**: Biometric images stored securely

### System Security
- **Rate Limiting**: 
  - Registration: 10 per hour
  - OTP Request: 5 per hour
  - OTP Verify: 10 per hour
  - Authentication: 10 per minute
  - Vote Casting: 5 per minute
  - Search: 30 per minute
- **Audit Logging**: All actions logged with IP addresses and timestamps
- **Double-Vote Prevention**: Smart contract + database validation
- **Suspicious Activity Detection**: Automatic flagging of multiple failures
- **Input Validation**: Strict validation on all user inputs
- **SQL Injection Prevention**: Parameterized queries throughout

## 🛠️ Configuration

### DeepFace Settings (backend/app.py)
```python
# Line ~1000 in authenticate_voter()
custom_threshold = 0.4    # Stricter threshold (default: 0.60)
model_name="Facenet"      # Options: VGG-Face, Facenet, OpenFace, ArcFace
detector_backend="opencv" # Options: opencv, ssd, mtcnn, retinaface
enforce_detection=True    # Require face detection
distance_metric="cosine"  # Options: cosine, euclidean, euclidean_l2
```

### Liveness Detection Settings (backend/liveness_detector.py)
```python
# Thresholds
FRAME_VARIATION_THRESHOLD = 2.0  # Minimum variation to detect movement
MIN_BLINK_COUNT = 1              # Minimum blinks required

# Frame capture (components/VoterAuthentication.tsx)
maxFrames = 15           # Number of frames to capture
frameInterval = 200      # Capture every 200ms (5 FPS)
```

### Rate Limiting (backend/app.py)
```python
# Adjust limits in decorator
@limiter.limit("10 per hour")  # Change number and time unit
```

### OTP Settings (backend/app.py)
```python
# OTP expiry time (line ~620)
if time.time() - timestamp > 300:  # 300 seconds = 5 minutes
```

### Blockchain Settings (backend/.env)
```env
GANACHE_URL=http://127.0.0.1:7545
CONTRACT_ADDRESS=0x...  # Auto-set by deploy_contract.py
```

### Email Settings (backend/.env)
```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password  # Not regular password!
```

## � API Endpoints

### Public Endpoints

**Registration & Authentication**
- `POST /api/request-registration-otp` - Request OTP for phone verification
- `POST /api/verify-registration-otp` - Verify OTP code
- `POST /api/register` - Register new voter with biometric data
- `GET /api/find-voter?query=<id>` - Find voter by Voter ID or Aadhaar
- `POST /api/authenticate` - Authenticate voter using facial recognition

**Voting**
- `POST /api/vote` - Cast vote on blockchain
- `GET /api/voting-status` - Get current voting status
- `GET /api/results` - Get voting results from blockchain
- `GET /api/results-status` - Check if results are published

**Receipts & Documents**
- `POST /api/generate-receipt` - Generate PDF voting receipt
- `POST /api/generate-voter-card` - Generate PDF voter ID card

### Admin Endpoints

**Voting Control**
- `POST /api/start-voting` - Start voting period
  ```json
  { "duration": 3600 }  // Duration in seconds
  ```
- `POST /api/end-voting` - End voting period immediately
- `POST /api/extend-voting` - Extend voting period
  ```json
  { "additionalTime": 1800 }  // Additional seconds
  ```

**Results Management**
- `POST /api/publish-results` - Publish election results
- `POST /api/unpublish-results` - Unpublish election results

**Data & Analytics**
- `GET /api/voters` - Get all registered voters
- `GET /api/history` - Get blockchain vote history
- `GET /api/voter-stats` - Get voter statistics
- `GET /api/audit-stats` - Get audit log statistics
- `GET /api/audit-logs?limit=50` - Get recent audit logs

### Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/api/register` | 10 per hour |
| `/api/request-registration-otp` | 5 per hour |
| `/api/verify-registration-otp` | 10 per hour |
| `/api/authenticate` | 10 per minute |
| `/api/vote` | 5 per minute |
| `/api/find-voter` | 30 per minute |
| All others | 200 per hour, 1000 per day |

### Response Format

**Success Response**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response**
```json
{
  "success": false,
  "message": "Error description",
  "error": "error_code"
}
```

**Rate Limit Response (429)**
```json
{
  "success": false,
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later.",
  "retry_after": "3600 seconds"
}
```

## 🔧 Development

### Project Structure
```
smartvote_blockchain_ai_system/
├── components/              # React components
│   ├── Header.tsx
│   ├── AdminDashboard.tsx
│   ├── VoterRegistration.tsx
│   ├── VoterAuthentication.tsx
│   ├── VotingPanel.tsx
│   ├── PublicResults.tsx
│   ├── VoterSearch.tsx
│   └── DocumentationViewer.tsx
├── services/
│   └── api.ts              # API service layer
├── backend/
│   ├── app.py              # Flask server (1,589 lines)
│   ├── liveness_detector.py # Liveness detection module (NEW)
│   ├── setup_db.py         # Database setup script
│   ├── deploy_contract.py  # Contract deployment script
│   ├── schema.sql          # Database schema
│   ├── requirements.txt    # Python dependencies
│   ├── uploads/            # Voter photos
│   ├── receipts/           # Generated PDFs
│   └── .env                # Environment variables
├── contracts/
│   ├── VotingContract.sol  # Smart contract
│   └── VotingContract.json # Contract ABI
├── types.ts                # TypeScript definitions
├── constants.tsx           # App constants
├── App.tsx                 # Main React component
├── index.tsx               # React entry point
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Node dependencies
```

### Adding New Candidates

**1. Update Smart Contract** (`contracts/VotingContract.sol`)
```solidity
// No changes needed - contract accepts dynamic candidate list
```

**2. Update Deployment Script** (`backend/deploy_contract.py`)
```python
# Line ~60
candidates = ["TVK", "DMK", "ADMK", "NTK", "PMK", "MNM", "OTA", "NEW_PARTY"]
```

**3. Update Frontend Constants** (`constants.tsx`)
```typescript
export const CANDIDATES: Candidate[] = [
  { id: 1, name: "TVK", party: "Tamil Valarchi Kazhagam", logo: "🌾", votes: 0 },
  // ... add new candidate
  { id: 8, name: "NEW", party: "New Party Name", logo: "🎯", votes: 0 },
];
```

**4. Update Party Colors** (`components/VotingPanel.tsx` and `components/PublicResults.tsx`)
```typescript
const PARTY_COLORS: Record<string, string> = {
  'TVK': '#ef4444',
  // ... add new party color
  'NEW': '#f59e0b',
};
```

**5. Re-deploy Contract**
```bash
cd backend
python deploy_contract.py
```

### Testing

**Manual Testing Checklist**
- [ ] Voter registration with OTP
- [ ] Aadhaar duplicate check
- [ ] Face detection during registration
- [ ] Voter search by ID and Aadhaar
- [ ] Facial authentication with liveness
- [ ] Vote casting on blockchain
- [ ] Double-vote prevention
- [ ] Admin voting controls
- [ ] Results publication
- [ ] PDF receipt generation
- [ ] Email notifications
- [ ] Rate limiting
- [ ] Audit logging

**Database Testing**
```sql
-- Check registered voters
SELECT COUNT(*) FROM registered_voter;

-- Check voting status
SELECT * FROM registered_voter WHERE has_voted = TRUE;

-- Check audit logs
SELECT action_type, status, COUNT(*) 
FROM audit_log 
GROUP BY action_type, status;

-- Check suspicious activities
SELECT ip_address, COUNT(*) as failures
FROM audit_log
WHERE status = 'FAILURE' 
  AND timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY ip_address
HAVING failures >= 3;
```

**Blockchain Testing**
```python
# Test in Python console
from web3 import Web3
w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:7545'))

# Check connection
print(w3.is_connected())

# Get accounts
print(w3.eth.accounts)

# Check balance
print(w3.from_wei(w3.eth.get_balance(w3.eth.accounts[0]), 'ether'))
```

## 📊 Database Schema

### registered_voter
Stores voter metadata (NOT votes - those are on blockchain)
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- voter_id (VARCHAR(20), UNIQUE) - EPIC ID (e.g., VOTE123456)
- name (VARCHAR(100))
- age (INT)
- gender (ENUM: Male, Female, Other)
- email (VARCHAR(100), UNIQUE) - Gmail only
- mobile (VARCHAR(15), UNIQUE) - 10 digits
- aadhaar (VARCHAR(20), UNIQUE) - Format: XXXX-XXXX-XXXX
- photo_path (VARCHAR(255)) - Path to biometric image
- has_voted (BOOLEAN, DEFAULT FALSE)
- registration_date (TIMESTAMP)
```

### audit_log
Complete activity tracking for security and compliance
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- action_type (VARCHAR(50)) - REGISTRATION, AUTHENTICATION, VOTE_CAST, etc.
- voter_id (VARCHAR(20))
- user_email (VARCHAR(100))
- ip_address (VARCHAR(45))
- user_agent (TEXT)
- action_details (TEXT) - JSON with additional info
- status (VARCHAR(20)) - SUCCESS or FAILURE
- error_message (TEXT)
- timestamp (TIMESTAMP)
```

### voting_control
Admin controls for voting period (single row)
```sql
- id (INT, PRIMARY KEY, DEFAULT 1)
- voting_active (BOOLEAN, DEFAULT FALSE)
- start_time (INT) - Unix timestamp
- end_time (INT) - Unix timestamp
- results_published (BOOLEAN, DEFAULT FALSE)
```

## 🎯 Smart Contract Functions

### Voting Functions
- `castVote(voterHash, candidateId)` - Record vote on blockchain
- `hasVoted(voterHash)` - Check if voter has voted
- `candidates(id)` - Get candidate information
- `candidatesCount()` - Get total number of candidates
- `totalVoters()` - Get total voters who have voted

### Admin Functions (onlyAdmin modifier)
- `startVoting(durationInSeconds)` - Start voting period
- `endVoting()` - End voting period immediately
- `extendVoting(additionalSeconds)` - Extend voting period
- `publishResults()` - Make results publicly visible
- `unpublishResults()` - Hide results from public

### View Functions
- `getVotingStatus()` - Get current voting status (active, start, end, currentTime)
- `getTotalVoteRecords()` - Get total number of vote records
- `getVoteRecord(index)` - Get specific vote record details
- `getVoterTimestamp(voterHash)` - Get timestamp when voter voted
- `resultsPublished()` - Check if results are published

### Events
- `VoteCast(voterHash, candidateId, timestamp)` - Emitted when vote is cast
- `VotingStarted(startTime, endTime)` - Emitted when voting starts
- `VotingEnded(endTime)` - Emitted when voting ends
- `ResultsPublished(timestamp)` - Emitted when results are published
- `VoterRecorded(voterHash, timestamp, blockNumber)` - Emitted when voter is recorded

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# Verify .env file exists
ls backend/.env

# Check Python packages
pip list | findstr "flask deepface mysql"

# Test database connection
cd backend
python -c "import mysql.connector; print('MySQL OK')"
```

### Face recognition fails
- **Lighting**: Ensure good lighting, avoid shadows
- **Camera**: Grant browser camera permissions
- **Models**: DeepFace downloads models on first run (~100MB)
- **Threshold**: Adjust `STRICT_THRESHOLD` in `backend/app.py` (0.40-0.70)
- **Distance**: Check console logs for actual distance values

### Blockchain errors
```bash
# Check Ganache is running
curl http://127.0.0.1:7545

# Verify contract address in .env
cat backend/.env | findstr CONTRACT_ADDRESS

# Test Web3 connection
cd backend
python -c "from web3 import Web3; w3=Web3(Web3.HTTPProvider('http://127.0.0.1:7545')); print('Connected:', w3.is_connected())"
```

### Image upload issues
- **Format**: Only JPEG/PNG accepted
- **Size**: Max 5MB (configurable in `.env`)
- **Folder**: Ensure `backend/uploads/` directory exists
- **Permissions**: Check write permissions on uploads folder

### Common Errors

**"Face could not be detected"**
- Ensure face is clearly visible and well-lit
- Remove glasses, hats, or masks
- Try different lighting conditions

**"Distance exceeds threshold"**
- Lighting may be different from registration photo
- Try adjusting threshold in `backend/app.py`
- Re-register with better quality photo

**"Blockchain connection failed"**
- Start Ganache on port 7545
- Check `GANACHE_URL` in `.env`
- Verify contract is deployed

## � Troubleshooting

### Backend Won't Start

**MySQL Connection Error**
```bash
# Check if MySQL is running
mysql -u root -p -e "SELECT 1;"

# Verify database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'voter_db';"

# Re-run setup if needed
cd backend
python setup_db.py
```

**Ganache Connection Error**
```bash
# Check if Ganache is running
curl http://127.0.0.1:7545

# Verify GANACHE_URL in backend/.env
cat backend/.env | findstr GANACHE_URL

# Test Web3 connection
python -c "from web3 import Web3; w3=Web3(Web3.HTTPProvider('http://127.0.0.1:7545')); print('Connected:', w3.is_connected())"
```

**Contract Not Loaded**
```bash
# Verify contract address is set
cat backend/.env | findstr CONTRACT_ADDRESS

# Re-deploy contract
cd backend
python deploy_contract.py
```

### Face Recognition Issues

**"Face could not be detected"**
- Ensure face is clearly visible and centered
- Use good lighting (avoid shadows and backlighting)
- Remove glasses, hats, or masks
- Try different camera angles
- Ensure camera permissions are granted

**"Face verification failed"**
- Lighting conditions should match registration photo
- Face should be at similar distance from camera
- Try re-registering with a better quality photo
- Check threshold setting in `backend/app.py` (line ~1000)

**"Liveness verification failed"**
- Ensure you blink naturally during capture
- Don't use a printed photo or screen recording
- Move your head slightly during capture
- Ensure good lighting and clear face visibility
- Check frame variation threshold in `backend/liveness_detector.py`

**DeepFace Model Download Issues**
```bash
# DeepFace downloads models on first run (~100MB)
# If download fails, manually download:
# 1. Go to: https://github.com/serengil/deepface_models/releases
# 2. Download facenet_weights.h5
# 3. Place in: C:\Users\<YourUser>\.deepface\weights\
```

### OTP Issues

**"SMS service not configured"**
- Verify `FAST2SMS_KEY` is set in `backend/.env`
- Check API key is exactly 80 characters
- Ensure you have SMS credits in Fast2SMS account

**"OTP expired"**
- OTP expires after 5 minutes
- Request a new OTP
- Check system time is correct

**"Too many OTP requests"**
- Rate limit: 5 requests per hour
- Wait 1 hour before trying again
- Or restart Flask server to reset rate limits

### Blockchain Issues

**"Blockchain transaction failed"**
- Ensure Ganache is running
- Check you have enough ETH in admin account
- Verify contract address is correct
- Check gas limit (default: 3,000,000)

**"Already voted" Error**
- Vote is already recorded on blockchain
- Check voter's `has_voted` status in database
- Verify voter hash matches

### Image Upload Issues

**"Format Error: Only JPEG, JPG, and PNG images are accepted"**
- Convert image to JPEG or PNG format
- Use image editing software or online converter

**"File too large"**
- Max file size: 5MB (configurable in `.env`)
- Compress image before uploading
- Reduce image resolution

**Upload folder not found**
```bash
# Create uploads folder manually
mkdir backend\uploads
mkdir backend\receipts
```

### Common Errors

**Port Already in Use**
```bash
# Backend (port 5000)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Frontend (port 3000)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Python Package Conflicts**
```bash
# Create fresh virtual environment
cd backend
rmdir /s /q venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**Database Connection Pool Exhausted**
```bash
# Restart MySQL service
net stop MySQL80
net start MySQL80

# Or restart Flask server
```

### Performance Issues

**Slow Face Recognition**
- First authentication takes longer (model loading)
- Subsequent authentications are faster
- Consider using GPU for faster processing
- Reduce image resolution before processing

**Admin Dashboard Slow**
- Voter registry limited to 20 records for performance
- Use search functionality for specific voters
- Consider pagination for large datasets

### Getting Help

If you encounter issues not covered here:
1. Check Flask console for error messages
2. Check browser console for frontend errors
3. Review audit logs in database
4. Check Ganache logs for blockchain errors
5. Verify all environment variables are set correctly

## 📝 License

This project is for educational and demonstration purposes.

## 👥 Contributors

- Gabby J & Jesithra J

## 🔗 Links

- [DeepFace Documentation](https://github.com/serengil/deepface)
- [Ganache Documentation](https://trufflesuite.com/ganache/)
- [Web3.py Documentation](https://web3py.readthedocs.io/)
- [Flask Documentation](https://flask.palletsprojects.com/)

## 🙏 Acknowledgments

- **DeepFace** by Sefik Ilkin Serengil for facial recognition
- **Ethereum/Ganache** for blockchain infrastructure
- **React** and **Flask** communities for excellent frameworks
- **OpenCV** for computer vision capabilities
- **Fast2SMS** for OTP delivery service

## 🚀 Production Deployment Considerations

### Security Enhancements
1. **Use HTTPS**: Deploy with SSL/TLS certificates
2. **Secure Keys**: Use environment variables, never commit secrets
3. **Database Security**: 
   - Use strong passwords
   - Enable SSL for MySQL connections
   - Implement connection pooling
4. **Rate Limiting**: Use Redis instead of in-memory storage
5. **Session Management**: Implement JWT tokens for authentication
6. **Input Sanitization**: Already implemented, but review regularly
7. **CORS**: Configure specific origins instead of allowing all

### Infrastructure
1. **Blockchain**: 
   - Use private Ethereum network (Quorum, Hyperledger Besu)
   - Or deploy to Ethereum testnet (Sepolia, Goerli)
   - Never use Ganache in production
2. **Database**: 
   - Use managed MySQL (AWS RDS, Azure Database)
   - Implement automated backups
   - Set up replication for high availability
3. **File Storage**: 
   - Use cloud storage (AWS S3, Azure Blob) for photos
   - Implement CDN for faster access
4. **Email**: 
   - Use transactional email service (SendGrid, AWS SES)
   - Implement email queuing
5. **SMS**: 
   - Use enterprise SMS gateway
   - Implement fallback providers

### Performance Optimization
1. **Caching**: 
   - Redis for session storage
   - Cache blockchain results
   - Cache voter lookups
2. **Database Indexing**: Already implemented, monitor query performance
3. **Image Optimization**: 
   - Compress images before storage
   - Use WebP format for web display
4. **Load Balancing**: 
   - Multiple Flask instances behind Nginx
   - Horizontal scaling for high traffic
5. **Async Processing**: 
   - Use Celery for background tasks
   - Queue email and PDF generation

### Monitoring & Logging
1. **Application Monitoring**: 
   - Use APM tools (New Relic, Datadog)
   - Monitor response times and errors
2. **Blockchain Monitoring**: 
   - Track transaction success rates
   - Monitor gas usage
3. **Security Monitoring**: 
   - Alert on suspicious activities
   - Monitor failed authentication attempts
4. **Audit Logs**: 
   - Already implemented
   - Archive old logs regularly
   - Implement log analysis

### Compliance & Legal
1. **Data Protection**: 
   - GDPR compliance for EU users
   - Data retention policies
   - Right to be forgotten implementation
2. **Accessibility**: 
   - WCAG 2.1 compliance
   - Screen reader support
   - Keyboard navigation
3. **Audit Trail**: 
   - Already implemented
   - Ensure immutability
   - Regular compliance audits
4. **Voter Privacy**: 
   - Already using SHA-256 hashing
   - Ensure no vote-to-voter linkage
   - Regular security audits

### Backup & Recovery
1. **Database Backups**: 
   - Automated daily backups
   - Test restore procedures
   - Off-site backup storage
2. **Blockchain Backups**: 
   - Regular node snapshots
   - Multiple node redundancy
3. **Disaster Recovery**: 
   - Document recovery procedures
   - Regular DR drills
   - RTO/RPO targets

### Testing Before Production
1. **Load Testing**: 
   - Simulate 1000+ concurrent users
   - Test peak voting hours
2. **Security Testing**: 
   - Penetration testing
   - Vulnerability scanning
   - Code security review
3. **Integration Testing**: 
   - End-to-end user flows
   - Blockchain integration
   - Email/SMS delivery
4. **User Acceptance Testing**: 
   - Test with real users
   - Gather feedback
   - Iterate on UX

### Deployment Checklist
- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] Smart contract deployed and verified
- [ ] SSL certificates installed
- [ ] Monitoring and alerting configured
- [ ] Backup procedures tested
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Support team trained
- [ ] Rollback plan documented
- [ ] Incident response plan ready

---

**⚠️ Disclaimer**: This is an educational project for demonstration purposes. For production deployment, additional security measures, compliance checks, and professional audits are required.

## � Contributors

- **Gabby J** - Full Stack Development, Blockchain Integration
- **Jesithra J** - AI/ML Implementation, UI/UX Design

## 📞 Support

For questions or issues:
- Check the troubleshooting section above
- Review inline code comments
- Check Flask and browser console logs

## 📈 Project Statistics

- **Total Lines of Code**: ~8,000+
- **Components**: 8 React components
- **API Endpoints**: 20+ endpoints
- **Database Tables**: 3 tables
- **Smart Contract Functions**: 15+ functions
- **Development Time**: Final Year Academic Project

## 🎓 Academic Context

This project demonstrates:
- Full-stack web development (React + Flask)
- Blockchain technology (Solidity + Web3)
- AI/ML integration (DeepFace facial recognition)
- Database design (MySQL)
- Security best practices (rate limiting, audit logs, encryption)
- Real-world problem solving

---

**© 2026 SmartVote - Ministry of Digital Governance (Academic Project)**

Made with ❤️ by Gabby J & Jesithra J
