# User Guide: How to Cast Your Vote

## Overview

This guide explains the complete voting process using the Smart Voting System with facial biometric authentication.

## Prerequisites

Before voting, ensure you have:

- Your **Voter ID** (received after registration)
- A working webcam
- Good lighting conditions
- Stable internet connection
- Voting period must be **active** (check with admin)

## Step-by-Step Voting Process

### Step 1: Check Voting Status

1. Ensure the voting period has been activated by the Election Commission
2. If inactive, you'll see a notification modal
3. Wait for official announcement of voting period

### Step 2: Enter Voting Chamber

1. From the homepage, click **"Enter Voting Chamber"**
2. You will be redirected to the authentication page

### Step 3: Voter Lookup

1. Select your ID type:
   - **Voter ID**: Format VOTE123456
   - **Aadhaar**: Format XXXX-XXXX-XXXX

2. Enter your ID in the input field
3. Press Enter
4. System will verify your registration

**Possible Outcomes:**
- ✅ Voter found - Proceed to authentication
- ❌ Voter not found - Check ID and try again
- ⚠️ Already voted - Cannot vote twice

### Step 4: Liveness Detection & Authentication

This is a **two-stage security process**:

#### Stage 1: Liveness Detection (Anti-Spoofing)

1. Click **"Allow Camera Access"** when prompted
2. Position your face in the center
3. Follow the on-screen challenge:
   - Blink naturally

4. System captures 15 frames over 5 seconds
5. AI analyzes for:
   - Natural blink patterns
   - Frame variation (movement detection)
   - Real person vs photo/screen

**Liveness Requirements:**
- At least 1 natural blink detected, OR
- Frame variation ≥ 2.0 (movement threshold)
- Prevents printed photos and screen recordings

#### Stage 2: Facial Recognition

1. After liveness passes, system performs DeepFace matching
2. Compares live capture with registered photo
3. Uses Facenet model with cosine distance
4. Threshold: 0.40 (strict security)

**Authentication Results:**
- Success
- Failure

### Step 5: Cast Your Ballot

Once authenticated:

1. You'll see the digital ballot with all candidates
2. Each candidate shows:
   - Name
   - Party affiliation
   - Symbol/logo

3. **Select your preferred candidate** by clicking their card
4. Review your selection carefully
5. Click **"Confirm Vote"** button

**Important:**
- You can only vote once
- Vote cannot be changed after submission
- Take your time to decide

### Step 6: Blockchain Confirmation

After confirming:

1. Vote is encrypted and sent to blockchain
2. Smart contract processes the vote
3. Transaction is mined on Ganache network
4. You receive a **Transaction Hash** (TX Hash)

**Transaction Hash Example:**
```
0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z
```

### Step 7: Download Receipt

You will receive a **PDF voting receipt** containing:

- Your Voter ID
- Timestamp of vote
- Transaction Hash
- QR code for verification
- Blockchain confirmation

**Receipt Details:**
- Automatically downloaded
- Keep for your records
- Can verify on blockchain explorer
- Does NOT reveal your candidate choice (anonymous)

## Verification Process

### Verify Your Vote on Blockchain

1. Copy your Transaction Hash from receipt
2. Go to "View Results" page
3. Click "Blockchain History" tab
4. Search for your TX Hash
5. Confirm your vote was recorded

**What You'll See:**
- Transaction timestamp
- Block number
- Voter hash (anonymous)
- Confirmation status

## Security Features

### Liveness Detection

Prevents spoofing attacks:
- ❌ Printed photos (no movement)
- ❌ Screen recordings (no natural blinks)
- ❌ Static images (low frame variation)
- ✅ Real person (blinks + movement)

### Facial Recognition

- Uses state-of-the-art DeepFace AI
- Facenet model (99.6% accuracy)
- Strict threshold (0.40 cosine distance)
- Encrypted biometric storage

### Blockchain Security

- Immutable vote records
- Cryptographically secured
- Anonymous voter identity
- Transparent audit trail
- No central authority can alter votes

### Common Issues & Solutions

## "Voting Not Yet Active"

**Problem**: Admin hasn't started voting period

**Solution**:
- Wait for official announcement
- Check with election commission
- Try again later

## "Liveness Verification Failed"

**Problem**: System detected static image or insufficient movement

**Solutions**:
- Blink naturally during capture
- Move your head slightly
- Ensure good lighting
- Don't use photos or screens
- Try again with real-time camera

## "Face Verification Failed"

**Problem**: Live face doesn't match registered photo

**Solutions**:
- Ensure good lighting
- Remove sunglasses/accessories
- Face camera directly
- Check if you're the registered voter
- Contact support if persistent

## "Already Voted"

**Problem**: System shows you've already cast a vote

**Solutions**:
- Check if you voted earlier
- One person can only vote once
- Contact support if you believe this is an error
- Check blockchain history for your vote

### Important Reminders

## Before Voting

- ✅ Have your Voter ID ready
- ✅ Check voting period is active
- ✅ Ensure good lighting
- ✅ Test your camera
- ✅ Stable internet connection

## During Voting

- ✅ Follow liveness challenges carefully
- ✅ Blink naturally
- ✅ Review candidate selection
- ✅ Confirm before submitting
- ✅ Wait for blockchain confirmation

## After Voting

- ✅ Download and save receipt
- ✅ Note your Transaction Hash
- ✅ Verify on blockchain
- ✅ Keep receipt secure
- ✅ Do not share TX Hash publicly

### Privacy & Anonymity

## What is Recorded

- ✅ Vote was cast (timestamp)
- ✅ Transaction on blockchain
- ✅ Candidate received a vote

## What is NOT Recorded

- ❌ Your identity with your vote
- ❌ Which candidate you chose (linked to you)
- ❌ Your personal information on blockchain

**Your vote is completely anonymous!**

Your Aadhaar/Voter ID is used only for authentication. On the blockchain, your vote is stored as an anonymous hash. No one can trace your vote back to you.

## Need Help?

If you encounter issues:

- Check this guide thoroughly
- Review FAQ section
- Contact election support
- Email: support@smartvote.gov
- Phone: 1800-XXX-XXXX

## Legal Information

- Voting is your constitutional right
- One person = one vote
- Vote buying/selling is illegal
- Report any irregularities immediately
- Your vote is secret and protected by law

---

**Remember**: Your vote matters. Cast it responsibly and securely!
