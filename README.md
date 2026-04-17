# 🗳️ SmartVote — Blockchain & AI Voting System

A secure and tamper-proof digital voting system using **blockchain**, **face recognition**, and **OTP verification**.

---

## 🚀 Features

- Face recognition with OpenCV & DeepFace (liveness detection)  
- Blockchain-based vote storage (Ethereum smart contract)  
- OTP-based user authentication  
- Admin dashboard with analytics  
- PDF voter ID & receipt generation  

---

## 🛠️ Tech Stack

- **Frontend:** React, TailwindCSS  
- **Backend:** Flask, MySQL  
- **AI/CV:** OpenCV, DeepFace  
- **Blockchain:** Solidity, Web3.py, Ganache  

---

## ⚙️ How SmartVote Works

SmartVote combines **OTP verification, face recognition, and blockchain** to create a secure voting system.

---

### 🧑‍💻 1. Registration

- User verifies phone via OTP  
- Aadhaar checked to prevent duplicates  
- User submits details + photo  
- System generates unique Voter ID and stores data in MySQL  

---

### 🔐 2. Authentication

- User enters Voter ID / Aadhaar  
- Liveness detection using OpenCV (blink + motion check)  
- Face verified using DeepFace (FaceNet model)  
- Access granted only if identity matches  

---

### 🗳️ 3. Voting

- User selects candidate  
- Voter ID is hashed (SHA-256) for anonymity  
- Vote stored on Ethereum smart contract  
- MySQL flag prevents double voting  
- PDF receipt generated with transaction hash  

---

### 👨‍💼 4. Admin Control

- Admin starts/ends voting via smart contract  
- Results published after voting ends  
- Dashboard shows real-time analytics  

---

### 🔒 Security Highlights

- Duplicate prevention (Aadhaar + DB + blockchain)  
- Face recognition + liveness detection  
- Votes stored immutably on blockchain  
- Rate limiting and audit logs for all actions  

---

## 📸 Screenshots

### 🏠 Landing Page
![Landing Page](screenshots/landingpage.png)

### 📝 Registration
![Registration](screenshots/registration.png)

### 🔐 Authentication
![Authentication](screenshots/authentication.png)

### 📊 Admin Dashboard
![Admin Dashboard](screenshots/admindashboard.png)

---

## 👩‍💻 Author

**Gabby Jacob**  
Final Year Computer Science Student
