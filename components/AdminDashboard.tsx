import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../services/api';
import { Candidate, Voter, SystemMetrics, VoteRecord } from '../types';
import { CANDIDATES } from '../constants';
import { 
  Lock, 
  ShieldAlert, 
  Terminal, 
  Activity, 
  Database, 
  Key, 
  Settings, 
  LayoutDashboard, 
  UserCircle, 
  Save, 
  CheckCircle,
  Info,
  History,
  Cpu,
  Link as LinkIcon,
  Clock,
  Hash,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'VOTERS' | 'EXPLORER' | 'SETTINGS' | 'CONTROL' | 'AUDIT'>('ANALYTICS');
  const [results, setResults] = useState<Candidate[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [history, setHistory] = useState<VoteRecord[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [votingStatus, setVotingStatus] = useState<any>(null);
  const [controlLoading, setControlLoading] = useState(false);
  const [controlMessage, setControlMessage] = useState('');
  const [voterStats, setVoterStats] = useState<any>(null);
  const [resultsStatus, setResultsStatus] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditStats, setAuditStats] = useState<any>(null);

  const [newCreds, setNewCreds] = useState({ username: '', password: '' });
  const [updateStatus, setUpdateStatus] = useState(false);

  const COLORS = ['#053c6d', '#10b981', '#ff9933', '#ef4444', '#6366f1'];

  /** Build Basic Auth header from current admin credentials */
  const getAuthHeader = () => {
    const encoded = btoa(`${credentials.username}:${credentials.password}`);
    return { Authorization: `Basic ${encoded}` };
  };

  useEffect(() => {
    if (isAdmin) {
      const updateData = async () => {
        setLoading(true);
        const authHeader = getAuthHeader();
        try {
          setResults(await api.getResults());
          setVoters(await api.getVoters());
          setMetrics(api.getMetrics());
          setLogs(api.getLogs());
          setHistory(await api.getBlockchainHistory());
          
          // Fetch voting status (public endpoint - no auth needed)
          const statusResponse = await fetch('http://localhost:5000/api/voting-status');
          const statusData = await statusResponse.json();
          setVotingStatus(statusData);
          
          // Fetch voter statistics (public endpoint - no auth needed)
          const statsResponse = await fetch('http://localhost:5000/api/voter-stats');
          const statsData = await statsResponse.json();
          setVoterStats(statsData);
          
          // Fetch results status (public endpoint - no auth needed)
          const resultsStatusResponse = await fetch('http://localhost:5000/api/results-status');
          const resultsStatusData = await resultsStatusResponse.json();
          setResultsStatus(resultsStatusData);
          
          // Fetch audit stats (admin-protected)
          const auditStatsResponse = await fetch('http://localhost:5000/api/audit-stats', { headers: authHeader });
          const auditStatsData = await auditStatsResponse.json();
          setAuditStats(auditStatsData);
          
          // Fetch recent audit logs (admin-protected)
          const auditLogsResponse = await fetch('http://localhost:5000/api/audit-logs?limit=50', { headers: authHeader });
          const auditLogsData = await auditLogsResponse.json();
          setAuditLogs(auditLogsData.logs || []);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        } finally {
          setLoading(false);
        }
      };
      updateData();
      const interval = setInterval(updateData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const current = api.getAdminCredentials();
    if (credentials.username === current.username && credentials.password === current.password) {
      setIsAdmin(true);
      setError('');
      setNewCreds(current);
    } else {
      setError('Invalid system administrator credentials. Access Denied.');
    }
  };

  const handleUpdateCreds = (e: React.FormEvent) => {
    e.preventDefault();
    api.updateAdminCredentials(newCreds);
    setUpdateStatus(true);
    setTimeout(() => setUpdateStatus(false), 3000);
  };

  const handleStartVoting = async (duration: number) => {
    setControlLoading(true);
    setControlMessage('');
    try {
      const response = await fetch('http://localhost:5000/api/start-voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ duration })
      });
      const result = await response.json();
      if (result.success) {
        setControlMessage(`✅ ${result.message}`);
      } else {
        setControlMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setControlMessage('❌ Failed to start voting');
    } finally {
      setControlLoading(false);
    }
  };

  const handleEndVoting = async () => {
    setControlLoading(true);
    setControlMessage('');
    try {
      const response = await fetch('http://localhost:5000/api/end-voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
      });
      const result = await response.json();
      if (result.success) {
        setControlMessage(`✅ ${result.message}`);
      } else {
        setControlMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setControlMessage('❌ Failed to end voting');
    } finally {
      setControlLoading(false);
    }
  };

  const handleExtendVoting = async (additionalTime: number) => {
    setControlLoading(true);
    setControlMessage('');
    try {
      const response = await fetch('http://localhost:5000/api/extend-voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ additionalTime })
      });
      const result = await response.json();
      if (result.success) {
        setControlMessage(`✅ ${result.message}`);
      } else {
        setControlMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setControlMessage('❌ Failed to extend voting');
    } finally {
      setControlLoading(false);
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const handlePublishResults = async () => {
    setControlLoading(true);
    setControlMessage('');
    try {
      const response = await fetch('http://localhost:5000/api/publish-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
      });
      const result = await response.json();
      if (result.success) {
        setControlMessage(`✅ ${result.message}`);
      } else {
        setControlMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setControlMessage('❌ Failed to publish results');
    } finally {
      setControlLoading(false);
    }
  };

  const handleUnpublishResults = async () => {
    setControlLoading(true);
    setControlMessage('');
    try {
      const response = await fetch('http://localhost:5000/api/unpublish-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
      });
      const result = await response.json();
      if (result.success) {
        setControlMessage(`✅ ${result.message}`);
      } else {
        setControlMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setControlMessage('❌ Failed to unpublish results');
    } finally {
      setControlLoading(false);
    }
  };

  // ==========================================
  // PHASE 1: THE LOGIN / AUTHENTICATION GATE
  // (This is what you see FIRST)
  // ==========================================
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto mt-10 animate-in fade-in zoom-in-95 duration-500 px-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          <div className="md:w-1/2 bg-[#053c6d] text-white p-12 flex flex-col justify-between">
            <div className="space-y-8">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl">
                <ShieldAlert size={32} className="text-blue-300" />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black tracking-tight leading-none uppercase">Overseer <br/>Access Terminal</h2>
                <p className="text-blue-200/50 text-sm leading-relaxed font-medium">
                  Verify administrative authorization to access the global Decentralized Voting Ledger.
                </p>
              </div>
            </div>
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-300">
                <Terminal size={14} /> System Access Note
              </div>
              <p className="text-[11px] text-blue-100/60 leading-relaxed italic">
                Secure encryption layer enabled. All access attempts are timestamped and logged.
              </p>
            </div>
          </div>
          <div className="md:w-1/2 p-12 space-y-8">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-[#053c6d]">Authenticate Session</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">National Election Commission</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Database size={18} />
                  </div>
                  <input type="text" value={credentials.username} onChange={(e) => setCredentials({...credentials, username: e.target.value})} className="w-full pl-12 pr-5 py-4 border-2 border-slate-100 bg-slate-50 rounded-2xl focus:bg-white focus:border-[#053c6d] outline-none font-bold text-slate-700 transition-all" placeholder="Enter admin ID" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Key size={18} />
                  </div>
                  <input type="password" value={credentials.password} onChange={(e) => setCredentials({...credentials, password: e.target.value})} className="w-full pl-12 pr-5 py-4 border-2 border-slate-100 bg-slate-50 rounded-2xl focus:bg-white focus:border-[#053c6d] outline-none font-bold text-slate-700 transition-all" placeholder="••••••••" />
                </div>
              </div>
              {error && <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-in shake"><ShieldAlert size={18} /><span className="text-[11px] font-bold uppercase">{error}</span></div>}
              <button className="w-full bg-[#053c6d] text-white py-5 rounded-2xl font-black text-lg hover:bg-[#085091] transition shadow-2xl shadow-blue-900/10 active:scale-95 flex items-center justify-center gap-3"><Lock size={20} /> Authorize Session</button>
            </form>
            <div className="pt-4 border-t border-slate-50 flex flex-col items-center">
              <button type="button" onClick={() => setShowHint(!showHint)} className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-[#053c6d] transition flex items-center gap-1.5"><Info size={12} /> {showHint ? 'Hide Credential Hint' : 'Reveal Default Access (Demo)'}</button>
              {showHint && <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-[10px] font-mono font-bold text-blue-700 animate-in fade-in slide-in-from-top-2 text-center w-full"><p>USER: admin</p><p>PASS: password123</p></div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 2: THE ACTUAL DASHBOARD (OTHER PAGE)
  // (This is what you see AFTER LOGIN)
  // ==========================================
  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-[#053c6d] tracking-tight">Electoral Oversight Dashboard</h1>
          <p className="text-slate-500 font-medium">
            <span className="inline-flex items-center gap-2 mr-6">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> 
              Blockchain Nodes: <span className="text-[#053c6d] font-black">Connected (5/5)</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div> 
              Security: <span className="text-[#053c6d] font-black">Encrypted</span>
            </span>
          </p>
        </div>
        
        <div className="bg-white p-1.5 rounded-2xl border border-zinc-200 flex gap-1 shadow-sm overflow-x-auto">
          <TabButton active={activeTab === 'ANALYTICS'} onClick={() => setActiveTab('ANALYTICS')} icon={<LayoutDashboard size={16} />} label="Analytics" />
          <TabButton active={activeTab === 'CONTROL'} onClick={() => setActiveTab('CONTROL')} icon={<Activity size={16} />} label="Control" />
          <TabButton active={activeTab === 'AUDIT'} onClick={() => setActiveTab('AUDIT')} icon={<Terminal size={16} />} label="Audit" />
          <TabButton active={activeTab === 'VOTERS'} onClick={() => setActiveTab('VOTERS')} icon={<UserCircle size={16} />} label="Registry" />
          <TabButton active={activeTab === 'EXPLORER'} onClick={() => setActiveTab('EXPLORER')} icon={<History size={16} />} label="Explorer" />
          <TabButton active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} icon={<Settings size={16} />} label="Access" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          {/* TAB 1: ANALYTICS VIEW */}
          {activeTab === 'ANALYTICS' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {loading && results.length === 0 ? (
                <div className="bg-white p-20 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-100 border-t-[#053c6d] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Activity size={24} className="text-[#053c6d] animate-pulse" />
                    </div>
                  </div>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Loading Dashboard Data...</p>
                </div>
              ) : (
                <>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <MetricCard label="Total Voters" value={voters.length} color="text-blue-600" />
                 <MetricCard label="Votes Cast" value={results.reduce((a, b) => a + b.votes, 0)} color="text-emerald-600" />
                 <MetricCard label="Blockchain Voters" value={voterStats?.totalVoters || 0} color="text-purple-600" />
                 <MetricCard label="Vote Records" value={voterStats?.totalRecords || 0} color="text-orange-600" />
               </div>

              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-black tracking-tight text-[#053c6d]">Consensus Vote Count <span className="text-slate-400 text-xs font-bold uppercase ml-2 tracking-widest">(On-Chain)</span></h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                    <Activity size={12} /> Real-time
                  </div>
                </div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px', fill: '#94a3b8' }} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="votes" radius={[12, 12, 0, 0]} barSize={45}>
                        {results.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: VOTING CONTROL CENTER */}
          {activeTab === 'CONTROL' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Voting Status Card */}
              <div className={`p-10 rounded-[2.5rem] shadow-xl border-4 ${votingStatus?.active ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${votingStatus?.active ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                      <Activity size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-[#053c6d]">Voting Status</h3>
                      <p className="text-sm font-bold uppercase tracking-widest mt-1">
                        {votingStatus?.active ? (
                          <span className="text-green-600">🟢 ACTIVE</span>
                        ) : (
                          <span className="text-slate-500">⚫ INACTIVE</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {votingStatus?.active && (
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Time Remaining</p>
                      <p className="text-3xl font-black text-[#053c6d]">{formatTimeRemaining(Math.max(0, votingStatus.end - votingStatus.currentTime))}</p>
                    </div>
                  )}
                </div>
                
                {votingStatus?.active && (
                  <div className="grid grid-cols-3 gap-4 p-6 bg-white/50 rounded-2xl border border-slate-200">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Start Time</p>
                      <p className="text-xs font-bold text-slate-700">{new Date(votingStatus.start * 1000).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">End Time</p>
                      <p className="text-xs font-bold text-slate-700">{new Date(votingStatus.end * 1000).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Time</p>
                      <p className="text-xs font-bold text-slate-700">{new Date(votingStatus.currentTime * 1000).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Control Actions */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Start Voting */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
                    <Activity size={24} />
                  </div>
                  <h4 className="text-lg font-black text-[#053c6d] mb-2">Start Voting Period</h4>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">Activate the voting period for a specified duration. Voters can cast ballots during this time.</p>
                  
                  <div className="space-y-3">
                    <button 
                      disabled={votingStatus?.active || controlLoading}
                      onClick={() => handleStartVoting(3600)}
                      className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Start (1 Hour)
                    </button>
                    <button 
                      disabled={votingStatus?.active || controlLoading}
                      onClick={() => handleStartVoting(7200)}
                      className="w-full bg-green-500 text-white py-4 rounded-xl font-bold hover:bg-green-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Start (2 Hours)
                    </button>
                    <button 
                      disabled={votingStatus?.active || controlLoading}
                      onClick={() => handleStartVoting(86400)}
                      className="w-full bg-green-400 text-white py-4 rounded-xl font-bold hover:bg-green-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Start (24 Hours)
                    </button>
                  </div>
                </div>

                {/* End Voting */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4">
                    <ShieldAlert size={24} />
                  </div>
                  <h4 className="text-lg font-black text-[#053c6d] mb-2">End Voting Period</h4>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">Immediately terminate the voting period. No more votes can be cast after this action.</p>
                  
                  <button 
                    disabled={!votingStatus?.active || controlLoading}
                    onClick={handleEndVoting}
                    className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    End Voting Now
                  </button>
                </div>

                {/* Extend Voting */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <Clock size={24} />
                  </div>
                  <h4 className="text-lg font-black text-[#053c6d] mb-2">Extend Voting Period</h4>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">Add additional time to the current voting period without interruption.</p>
                  
                  <div className="space-y-3">
                    <button 
                      disabled={!votingStatus?.active || controlLoading}
                      onClick={() => handleExtendVoting(1800)}
                      className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Extend +30 Minutes
                    </button>
                    <button 
                      disabled={!votingStatus?.active || controlLoading}
                      onClick={() => handleExtendVoting(3600)}
                      className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Extend +1 Hour
                    </button>
                  </div>
                </div>

                {/* Publish Results */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${resultsStatus?.published ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'}`}>
                    <Activity size={24} />
                  </div>
                  <h4 className="text-lg font-black text-[#053c6d] mb-2">Publish Results</h4>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    {resultsStatus?.published 
                      ? 'Results are currently published and visible to all voters.'
                      : 'Make election results publicly visible to all voters after voting ends.'}
                  </p>
                  
                  {resultsStatus?.published ? (
                    <button 
                      disabled={controlLoading}
                      onClick={handleUnpublishResults}
                      className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Unpublish Results
                    </button>
                  ) : (
                    <button 
                      disabled={votingStatus?.active || controlLoading || resultsStatus?.published}
                      onClick={handlePublishResults}
                      className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Publish Results
                    </button>
                  )}
                  
                  {resultsStatus?.published && (
                    <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-xs text-green-700 font-bold flex items-center gap-2">
                        <CheckCircle size={14} /> Results are live at /results
                      </p>
                    </div>
                  )}
                </div>

                {/* Status Message */}
                {controlMessage && (
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center justify-center">
                    <p className="text-sm font-bold text-center">{controlMessage}</p>
                  </div>
                )}
              </div>

              {/* Warning Notice */}
              <div className="bg-orange-50 border-2 border-orange-200 p-8 rounded-[2.5rem]">
                <div className="flex items-start gap-4">
                  <AlertCircle className="text-orange-600 shrink-0 mt-1" size={24} />
                  <div>
                    <h5 className="text-sm font-black text-orange-900 uppercase tracking-widest mb-2">Security Notice</h5>
                    <p className="text-xs text-orange-700 leading-relaxed">
                      All voting control actions are recorded on the blockchain and cannot be reversed. Ensure proper authorization before executing any control commands. Starting or ending voting periods will affect all voters immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL VIEW */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Audit Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Total Logs" value={auditStats?.total_logs || 0} color="text-blue-600" />
                <MetricCard label="Successful" value={auditStats?.success_count || 0} color="text-green-600" />
                <MetricCard label="Failed" value={auditStats?.failure_count || 0} color="text-red-600" />
                <MetricCard label="Suspicious" value={auditStats?.suspicious_activities?.length || 0} color="text-orange-600" />
              </div>

              {/* Suspicious Activities Alert */}
              {auditStats?.suspicious_activities && auditStats.suspicious_activities.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 p-8 rounded-[2.5rem]">
                  <div className="flex items-start gap-4">
                    <ShieldAlert className="text-red-600 shrink-0 mt-1" size={32} />
                    <div className="flex-grow">
                      <h4 className="text-lg font-black text-red-900 uppercase tracking-widest mb-4">⚠️ Suspicious Activities Detected</h4>
                      <div className="space-y-3">
                        {auditStats.suspicious_activities.map((activity: any, idx: number) => (
                          <div key={idx} className="bg-white p-4 rounded-xl border border-red-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-bold text-red-900">{activity.ip_address}</p>
                                <p className="text-xs text-red-600 mt-1">{activity.action_type}: {activity.failure_count} failures in last hour</p>
                              </div>
                              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-black">ALERT</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Audit Logs Table */}
              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-[#053c6d]">Recent Audit Logs</h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                    <Terminal size={12} /> Live Monitoring
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="text-left py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                        <th className="text-left py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
                        <th className="text-left py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Voter ID</th>
                        <th className="text-left py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">IP Address</th>
                        <th className="text-left py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-20 text-slate-400 font-bold">No audit logs found</td>
                        </tr>
                      ) : (
                        auditLogs.map((log: any) => (
                          <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                            <td className="py-4 px-4 text-xs font-mono text-slate-600">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-xs font-bold text-[#053c6d] uppercase tracking-wider">
                                {log.action_type}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-xs font-mono text-slate-600">
                              {log.voter_id || log.user_email || '-'}
                            </td>
                            <td className="py-4 px-4 text-xs font-mono text-slate-600">
                              {log.ip_address}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                                log.status === 'SUCCESS' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Statistics */}
              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h3 className="text-2xl font-black text-[#053c6d] mb-8">Action Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {auditStats?.action_stats && auditStats.action_stats.map((stat: any, idx: number) => (
                    <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{stat.action_type}</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-[#053c6d]">{stat.count}</p>
                        <span className={`text-xs font-bold ${stat.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BLOCKCHAIN EXPLORER VIEW (LEDGER HISTORY) */}
          {activeTab === 'EXPLORER' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              {loading && history.length === 0 ? (
                <div className="bg-white p-20 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-100 border-t-[#053c6d] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <History size={24} className="text-[#053c6d] animate-pulse" />
                    </div>
                  </div>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Loading Blockchain History...</p>
                </div>
              ) : (
              <>
              <div className="bg-[#0b2447] rounded-[2.5rem] p-10 text-white overflow-hidden shadow-2xl relative border border-white/5">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl font-black">LEDGER</div>
                <div className="flex items-center justify-between relative z-10 mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <ShieldCheck size={24} className="text-blue-400" />
                    Blockchain Transaction Explorer
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Live Syncing
                    </span>
                  </div>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar relative z-10">
                  {history.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-[2rem]">
                      <Cpu size={48} className="mx-auto text-blue-900 mb-4" />
                      <p className="text-slate-500 font-bold uppercase text-xs">Genesis Block Awaiting Transactions...</p>
                    </div>
                  ) : (
                    history.slice().reverse().map((tx, idx) => (
                      <div key={idx} className="group flex gap-6 animate-in slide-in-from-left-4" style={{ animationDelay: `${idx * 100}ms` }}>
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-blue-600 transition-colors">
                            <LinkIcon size={18} className="text-blue-300" />
                          </div>
                          {idx !== history.length - 1 && <div className="w-0.5 flex-grow bg-blue-900/30 my-2"></div>}
                        </div>
                        <div className="flex-grow bg-white/5 border border-white/10 rounded-3xl p-6 transition-all group-hover:bg-white/10 group-hover:border-blue-500/30">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Block ID #{(history.length - idx).toString().padStart(4, '0')}</p>
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                Transaction Confirmed
                              </h4>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-500 flex items-center gap-1.5 justify-end">
                                <Clock size={12} /> {new Date(tx.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mb-1 flex items-center gap-1">
                                <Hash size={10} /> Cryptographic Hash
                              </p>
                              <p className="text-[10px] font-mono text-blue-200 truncate">{tx.voterHash}</p>
                            </div>
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mb-1 flex items-center gap-1">
                                <UserCircle size={10} /> Selection
                              </p>
                              <p className="text-[10px] font-bold text-white uppercase">{CANDIDATES.find(c => c.id === tx.candidateId)?.name || 'OTA'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-slate-900 rounded-[2rem] p-8">
                 <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Terminal size={14} /> System Console Traces
                 </h4>
                 <div className="font-mono text-[9px] h-[150px] overflow-y-auto space-y-1 opacity-70 custom-scrollbar">
                    {logs.map((log, i) => (
                      <div key={i} className="text-slate-400">
                        <span className="text-slate-600 mr-2">[{i}]</span>
                        {log}
                      </div>
                    ))}
                 </div>
              </div>
              </>
              )}
            </div>
          )}

          {/* TAB 5: VOTER REGISTRY VIEW */}
          {activeTab === 'VOTERS' && (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-[#053c6d] uppercase tracking-widest">Identity Registry</h3>
                  <p className="text-xs text-slate-400 font-bold mt-2">Showing {Math.min(20, voters.length)} of {voters.length} registered voters</p>
                </div>
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                  <Database size={20} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {voters.length === 0 ? (
                  <p className="col-span-2 text-center py-20 text-slate-400 font-bold uppercase">No records found</p>
                ) : (
                  voters.slice(0, 20).map(v => (
                    <div key={v.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:shadow-lg group">
                      <div className="flex justify-between items-start mb-3">
                        <p className="font-black text-sm text-[#053c6d]">{v.name}</p>
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${v.hasVoted ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>{v.hasVoted ? 'Voted' : 'Eligible'}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-tight">EPIC: <span className="text-[#053c6d]">{v.voterId}</span></p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{v.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: SYSTEM SETTINGS (ADMIN ACCESS) VIEW */}
          {activeTab === 'SETTINGS' && (
            <div className="bg-white p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 animate-in slide-in-from-right-4">
               <div className="max-w-md">
                 <div className="w-16 h-16 bg-blue-50 text-[#053c6d] rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                   <Settings size={28} />
                 </div>
                 <h3 className="text-2xl font-black text-[#053c6d] mb-2 tracking-tight">Access Control Center</h3>
                 <p className="text-slate-400 text-sm font-medium mb-10 leading-relaxed">Update the primary overseer credentials. New keys take effect for the next authentication session.</p>
                 <form onSubmit={handleUpdateCreds} className="space-y-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Master Username</label>
                       <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300"><UserCircle size={20} /></div>
                          <input type="text" required value={newCreds.username} onChange={(e) => setNewCreds({...newCreds, username: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-[#053c6d] focus:bg-white transition-all shadow-inner" />
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New System Access Key</label>
                       <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300"><Key size={20} /></div>
                          <input type="text" required value={newCreds.password} onChange={(e) => setNewCreds({...newCreds, password: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-[#053c6d] focus:bg-white transition-all shadow-inner" />
                       </div>
                    </div>
                    <div className="pt-6 flex flex-col items-start gap-4">
                      <button className="bg-[#053c6d] text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:bg-[#085091] transition flex items-center gap-2 active:scale-95"><Save size={18} /> Update Authorized Key</button>
                      {updateStatus && <div className="flex items-center gap-2 text-green-600 font-bold text-[10px] uppercase tracking-widest animate-in fade-in slide-in-from-left-2"><CheckCircle size={14} /> Security Protocol Updated Immutably</div>}
                    </div>
                 </form>
               </div>
            </div>
          )}
        </div>

        {/* SIDEBAR OVERVIEW */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
             <h3 className="text-lg font-black mb-6 tracking-tight text-gray-900 flex items-center gap-2">
                <Activity size={18} className="text-blue-600" /> Security Health
             </h3>
             <div className="space-y-6">
                <HealthItem label="Database Latency" value="14ms" status="OPTIMAL" />
                <HealthItem label="AI Inference Time" value="1.2s" status="STABLE" />
                <HealthItem label="Blockchain Sync" value="99.9%" status="ACTIVE" />
             </div>
           </div>
           
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
             <h3 className="text-lg font-black mb-6 tracking-tight text-gray-900 flex items-center gap-2">
                <ShieldAlert size={18} className="text-orange-600" /> Rate Limits
             </h3>
             <div className="space-y-4">
                <RateLimitItem label="Authentication" limit="5 / min" color="text-red-600" />
                <RateLimitItem label="Registration" limit="5 / hour" color="text-orange-600" />
                <RateLimitItem label="Voting" limit="3 / min" color="text-purple-600" />
                <RateLimitItem label="Lookups" limit="20 / min" color="text-blue-600" />
             </div>
             <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
               <p className="text-[9px] text-blue-700 font-bold uppercase tracking-widest">
                 🛡️ DDoS Protection Active
               </p>
             </div>
           </div>
           
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
             <h3 className="text-lg font-black mb-6 tracking-tight text-gray-900 flex items-center gap-2">
                <Info size={18} className="text-green-600" /> Resources & Guides
             </h3>
             <div className="space-y-3">
                <GuideLink 
                  title="Quick Reference" 
                  description="Common tasks and commands"
                  file="QUICK_REFERENCE.md"
                />
                <GuideLink 
                  title="Email Setup Guide" 
                  description="Configure email notifications"
                  file="EMAIL_SETUP_GUIDE.md"
                />
                <GuideLink 
                  title="Start Voting Guide" 
                  description="How to start voting period"
                  file="QUICK_START_VOTING.md"
                />
                <GuideLink 
                  title="All Improvements" 
                  description="Complete feature summary"
                  file="COMPLETED_IMPROVEMENTS_SUMMARY.md"
                />
             </div>
           </div>
           
           <div className="bg-blue-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldAlert size={80} /></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-2">Emergency Override</p>
              <h4 className="text-lg font-bold mb-4">Ballot Suspension</h4>
              <p className="text-xs text-blue-100/70 leading-relaxed mb-6">Administrators can pause the electoral process immediately in case of physical security breaches.</p>
              <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition">Trigger Emergency Pause</button>
           </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${active ? 'bg-[#053c6d] text-white shadow-lg shadow-blue-900/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
    {icon}
    <span className="hidden xl:inline">{label}</span>
  </button>
);

const MetricCard = ({ label, value, color }: { label: string; value: any; color: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm text-center">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-2xl font-black ${color}`}>{value}</p>
  </div>
);

const HealthItem = ({ label, value, status }: { label: string; value: string; status: string }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-slate-700">{value}</p>
    </div>
    <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{status}</span>
  </div>
);

const RateLimitItem = ({ label, limit, color }: { label: string; limit: string; color: string }) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{limit}</p>
    </div>
    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
  </div>
);

const GuideLink = ({ title, description, file }: { title: string; description: string; file: string }) => (
  <button 
    onClick={() => window.open(`/${file}`, '_blank')}
    className="block w-full text-left p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition">{title}</p>
        <p className="text-[10px] text-slate-500 mt-1">{description}</p>
      </div>
      <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </div>
  </button>
);

export default AdminDashboard;