import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD"),
}

try:
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # Create database if not exists
    cursor.execute("CREATE DATABASE IF NOT EXISTS voter_db")
    print("Database 'voter_db' created or already exists.")

    # Use the database
    cursor.execute("USE voter_db")

    # Create table
    create_table_query = """
    CREATE TABLE IF NOT EXISTS registered_voter (
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
        INDEX idx_voter_id (voter_id),
        INDEX idx_aadhaar (aadhaar),
        INDEX idx_email (email),
        INDEX idx_has_voted (has_voted)
    );
    """

    cursor.execute(create_table_query)
    print("Table 'registered_voter' created or already exists.")

    # Create audit_log table
    create_audit_table_query = """
    CREATE TABLE IF NOT EXISTS audit_log (
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
        INDEX idx_action_type (action_type),
        INDEX idx_voter_id (voter_id),
        INDEX idx_timestamp (timestamp),
        INDEX idx_status (status),
        INDEX idx_ip_address (ip_address)
    );
    """

    cursor.execute(create_audit_table_query)
    print("Table 'audit_log' created or already exists.")

    # Create voting_control table
    create_voting_control_query = """
    CREATE TABLE IF NOT EXISTS voting_control (
        id INT PRIMARY KEY DEFAULT 1,
        voting_active BOOLEAN DEFAULT FALSE NOT NULL,
        start_time INT,
        end_time INT,
        results_published BOOLEAN DEFAULT FALSE NOT NULL,
        CHECK (id = 1)
    );
    """

    cursor.execute(create_voting_control_query)
    print("Table 'voting_control' created or already exists.")

    # Insert default voting control row if not exists
    cursor.execute("SELECT COUNT(*) FROM voting_control WHERE id = 1")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO voting_control (id, voting_active, results_published) 
            VALUES (1, FALSE, FALSE)
        """)
        print("Default voting control row inserted.")

    conn.commit()
    cursor.close()
    conn.close()
    print("Database setup completed successfully!")

except Error as e:
    print(f"Database setup error: {e}")