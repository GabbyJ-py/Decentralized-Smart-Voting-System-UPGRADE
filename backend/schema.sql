-- Database: voter_db
CREATE DATABASE IF NOT EXISTS voter_db;
USE voter_db;

-- Table for Voter Metadata (Strictly metadata, NOT votes)
CREATE TABLE registered_voter (
    id INT AUTO_INCREMENT PRIMARY KEY,

    voter_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender ENUM('Male','Female','Other') NOT NULL,

    email VARCHAR(100) UNIQUE NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    aadhaar VARCHAR(20) UNIQUE NOT NULL,

    photo_path VARCHAR(255) NOT NULL,
    has_voted BOOLEAN DEFAULT FALSE NOT NULL,
    
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for faster queries
    INDEX idx_voter_id (voter_id),
    INDEX idx_aadhaar (aadhaar),
    INDEX idx_email (email),
    INDEX idx_has_voted (has_voted)
);


-- Table for Audit Trail (Security & Compliance)
CREATE TABLE audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    action_type VARCHAR(50) NOT NULL,
    voter_id VARCHAR(20),
    user_email VARCHAR(100),
    
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    
    action_details TEXT,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for faster queries
    INDEX idx_action_type (action_type),
    INDEX idx_voter_id (voter_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_status (status),
    INDEX idx_ip_address (ip_address)
);

-- Table for Voting Control (Admin controls for voting period)
CREATE TABLE voting_control (
    id INT PRIMARY KEY DEFAULT 1,
    voting_active BOOLEAN DEFAULT FALSE NOT NULL,
    start_time INT,
    end_time INT,
    results_published BOOLEAN DEFAULT FALSE NOT NULL,
    CHECK (id = 1)
);

-- Insert default voting control row
INSERT INTO voting_control (id, voting_active, results_published) 
VALUES (1, FALSE, FALSE);

-- Note: Votes are stored on the Ethereum Blockchain, not in this MySQL table.