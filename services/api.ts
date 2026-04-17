import { Voter, Candidate, VoteRecord, SystemMetrics, AdminCredentials } from '../types';
import { CANDIDATES, DEFAULT_ADMIN } from '../constants';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

class VotingApiService {
  private adminCreds: AdminCredentials = DEFAULT_ADMIN;
  private systemLogs: string[] = [];

  constructor() {
    this.loadPersistedAdmin();
  }

  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.systemLogs.unshift(`[${timestamp}] ${message}`);
    if (this.systemLogs.length > 50) this.systemLogs.pop();
  }

  /**
   * Centralized error handler for API calls
   */
  private handleApiError(error: any, context: string): { success: false; message: string } {
    console.error(`[API ERROR - ${context}]`, error);
    this.log(`ERROR: ${context} - ${error.message || 'Unknown error'}`);
    
    if (error.message?.includes('Failed to fetch')) {
      return { 
        success: false, 
        message: 'Backend server is offline. Please ensure Flask is running on port 5000.' 
      };
    }
    
    return { 
      success: false, 
      message: error.message || `${context} failed. Please try again.` 
    };
  }

  getAdminCredentials(): AdminCredentials {
    return this.adminCreds;
  }

  /** Build Basic Auth header from stored admin credentials */
  private getAdminAuthHeader(): { Authorization: string } {
    const { username, password } = this.adminCreds;
    const encoded = btoa(`${username}:${password}`);
    return { Authorization: `Basic ${encoded}` };
  }

  updateAdminCredentials(creds: AdminCredentials) {
    this.adminCreds = creds;
    localStorage.setItem('admin_creds', JSON.stringify(creds));
    this.log(`SECURITY: Administrative access keys updated.`);
  }

  async registerVoter(data: Partial<Voter>, faceImage: string): Promise<{ success: boolean; message: string; voterId?: string }> {
    try {
      // Convert base64 image to Blob
      const base64Response = await fetch(faceImage);
      const blob = await base64Response.blob();
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', data.name || '');
      formData.append('age', String(data.age || 0));
      formData.append('gender', data.gender || 'Other');
      formData.append('email', data.email || '');
      formData.append('mobile', data.phone || '');
      formData.append('aadhaar', data.aadhaar || '');
      formData.append('photo', blob, 'photo.jpg');

      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        body: formData  // Don't set Content-Type header, browser will set it with boundary
      });

      const result = await response.json();
      
      // Handle rate limit
      if (response.status === 429) {
        return { success: false, message: "⏱️ Too many registration attempts. Please try again in an hour." };
      }
      
      if (result.success) {
        this.log(`MYSQL: Registration confirmed for voter ID ${result.voter_id}`);
        return { ...result, voterId: result.voter_id };
      }
      return result;
    } catch (e) {
      return this.handleApiError(e, 'Voter Registration');
    }
  }

  async requestRegistrationOtp(phone: string): Promise<{ success: boolean; message: string; maskedPhone?: string }> {
    try {
      const response = await fetch(`${API_BASE}/request-registration-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const result = await response.json();
      
      if (response.status === 429) {
        return { success: false, message: "⏱️ Too many OTP requests. Please try again later." };
      }
      
      if (result.success) {
        this.log(`OTP: Sent to ${result.maskedPhone}`);
      }
      
      return result;
    } catch (e) {
      return this.handleApiError(e, 'OTP Request');
    }
  }

  async verifyRegistrationOtp(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE}/verify-registration-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });

      const result = await response.json();
      
      if (response.status === 429) {
        return { success: false, message: "⏱️ Too many verification attempts. Please try again later." };
      }
      
      if (result.success) {
        this.log(`OTP: Verified successfully`);
      }
      
      return result;
    } catch (e) {
      return this.handleApiError(e, 'OTP Verification');
    }
  }

  async findVoterById(query: string): Promise<{ success: boolean; voter?: Voter; message?: string }> {
    try {
      const response = await fetch(`${API_BASE}/find-voter?query=${query}`);
      const result = await response.json();
      
      if (result.success && result.voter?.hasVoted) {
        return { success: false, message: "Security Alert: Ballot already cast for this identity." };
      }
      
      return result;
    } catch (e) {
      return this.handleApiError(e, 'Voter Lookup');
    }
  }

  async searchVotersById(query: string): Promise<Voter[]> {
    try {
      const response = await fetch(`${API_BASE}/find-voter?query=${query}`);
      const result = await response.json();
      if (result.success && result.voter) {
        return [result.voter];
      }
      return [];
    } catch {
      return [];
    }
  }

  async authenticateVoter(voterId: string, liveFace: string, livenessFrames: string[] = []): Promise<{ success: boolean; voter?: Voter; confidence?: number; message?: string; liveness?: any }> {
    console.log('[API] Starting authentication for:', voterId);
    console.log('[API] Liveness frames provided:', livenessFrames.length);
    this.log(`AI: Executing FaceNet matching for ${voterId} with liveness detection`);
    try {
      // First, get voter details
      console.log('[API] Fetching voter details...');
      const voterResponse = await fetch(`${API_BASE}/find-voter?query=${voterId}`);
      const voterData = await voterResponse.json();
      console.log('[API] Voter data:', voterData);

      if (!voterData.success || !voterData.voter) {
        return { success: false, message: "Voter not found in registry" };
      }

      // Check if already voted
      if (voterData.voter.hasVoted) {
        return { success: false, message: "Security Alert: Ballot already cast for this identity." };
      }

      // Now perform facial authentication with liveness detection
      console.log('[API] Calling authenticate endpoint with liveness frames...');
      const authResponse = await fetch(`${API_BASE}/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterId: voterId,
          image: liveFace,
          livenessFrames: livenessFrames  // Send liveness frames
        })
      });

      console.log('[API] Auth response status:', authResponse.status);
      
      // Handle rate limit
      if (authResponse.status === 429) {
        return { success: false, message: "⏱️ Too many authentication attempts. Please wait a few minutes and try again." };
      }
      
      const authResult = await authResponse.json();
      console.log('[API] Auth result:', authResult);

      if (authResult.success) {
        const livenessInfo = authResult.liveness ? 
          `Liveness: ${authResult.liveness.blink_count} blink(s), variation: ${authResult.liveness.frame_variation}` : 
          'No liveness data';
        this.log(`AI: Face verification successful. Confidence: ${authResult.confidence}. ${livenessInfo}`);
        return {
          success: true,
          voter: voterData.voter,
          confidence: authResult.confidence,
          liveness: authResult.liveness
        };
      } else {
        this.log(`AI: Face verification failed - ${authResult.message}`);
        return {
          success: false,
          message: authResult.message || "Facial verification failed. Please try again.",
          liveness: authResult.liveness
        };
      }
    } catch (e) {
      console.error('[API ERROR]', e);
      this.log(`ERROR: Authentication failed - ${e}`);
      return this.handleApiError(e, 'Voter Authentication');
    }
  }

  async castVote(email: string, candidateId: number): Promise<{ success: boolean; message: string; txHash?: string }> {
    try {
      const response = await fetch(`${API_BASE}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, candidateId })
      });

      // Handle rate limit
      if (response.status === 429) {
        return { success: false, message: "⏱️ Too many vote attempts. Please wait a moment and try again." };
      }

      const result = await response.json();
      if (result.success) {
        this.log(`BLOCKCHAIN: Vote confirmed. TX: ${result.tx_hash}`);
        // Map tx_hash to txHash for frontend consistency
        return { 
          success: true, 
          message: result.message || "Ballot recorded on Ethereum.",
          txHash: result.tx_hash 
        };
      }
      return result;
    } catch (e) {
      return this.handleApiError(e, 'Vote Casting');
    }
  }

  /**
   * Generate secure SHA-256 hash for voter anonymity
   * @param voterId Voter ID
   * @returns Hex string hash (0x prefixed)
   */
  private async generateSecureHash(voterId: string): Promise<string> {
    // Use Web Crypto API for secure hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(voterId.toUpperCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return '0x' + hashHex;
  }

  async getResults(): Promise<Candidate[]> {
    try {
      const response = await fetch(`${API_BASE}/results`);
      return await response.json();
    } catch {
      return CANDIDATES.map(c => ({ ...c, votes: 0 }));
    }
  }

  async getBlockchainHistory(): Promise<VoteRecord[]> {
    try {
      const response = await fetch(`${API_BASE}/history`);
      return await response.json();
    } catch {
      return [];
    }
  }

  getLogs() { return this.systemLogs; }
  
  // Fetch voters from MySQL backend
  async getVoters(): Promise<Voter[]> {
    try {
      const response = await fetch(`${API_BASE}/voters`, {
        headers: { ...this.getAdminAuthHeader() }
      });
      const result = await response.json();
      if (result.success && Array.isArray(result.voters)) {
        return result.voters;
      }
      return [];
    } catch (e) {
      console.error('Failed to fetch voters:', e);
      return [];
    }
  }

  getMetrics(): SystemMetrics {
    return { 
      accuracy: 99.4, 
      successRate: 100, 
      avgTimePerVote: 1.2, 
      totalAttempts: 1, 
      successfulAuths: 1 
    };
  }

  private loadPersistedAdmin() {
    const a = localStorage.getItem('admin_creds');
    if (a) this.adminCreds = JSON.parse(a);
  }
}

export const api = new VotingApiService();