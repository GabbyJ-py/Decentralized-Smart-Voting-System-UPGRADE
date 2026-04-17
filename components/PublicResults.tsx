import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Trophy, TrendingUp, Users, CheckCircle, Award, BarChart3 } from 'lucide-react';

const PARTY_COLORS: Record<string, string> = {
  'TVK': '#ef4444',
  'DMK': '#eab308',
  'ADMK': '#22c55e',
  'NTK': '#3b82f6',
  'PMK': '#a855f7',
  'MNM': '#64748b',
  'OTA': '#0f172a',
};

const PublicResults: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [published, setPublished] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [winner, setWinner] = useState<any>(null);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchResults = async () => {
    try {
      // Check if results are published
      const statusResponse = await fetch('http://localhost:5000/api/results-status');
      const statusData = await statusResponse.json();
      setPublished(statusData.published);

      if (statusData.published) {
        // Fetch results
        const resultsResponse = await fetch('http://localhost:5000/api/results');
        const resultsData = await resultsResponse.json();
        
        const total = resultsData.reduce((sum: number, c: any) => sum + c.votes, 0);
        setTotalVotes(total);
        
        // Calculate percentages
        const withPercentages = resultsData.map((c: any) => ({
          ...c,
          percentage: total > 0 ? ((c.votes / total) * 100).toFixed(1) : 0
        }));
        
        setResults(withPercentages);
        
        // Find winner
        const sorted = [...withPercentages].sort((a, b) => b.votes - a.votes);
        setWinner(sorted[0]);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-100 border-t-[#053c6d] rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 size={32} className="text-[#053c6d] animate-pulse" />
            </div>
          </div>
          <p className="text-slate-600 font-bold text-lg">Loading Election Results...</p>
        </div>
      </div>
    );
  }

  if (!published) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
        <div className="max-w-2xl w-full bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-200 text-center space-y-8">
          <div className="w-24 h-24 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto border-4 border-orange-100">
            <Award size={48} />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-[#053c6d] tracking-tight">Results Not Yet Published</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              The election results will be published by the Election Commission once the voting period has concluded and all votes have been verified.
            </p>
          </div>
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <p className="text-xs text-blue-700 font-bold uppercase tracking-widest">
              Please check back later for official results
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-xs font-black uppercase tracking-widest border border-green-200">
            <CheckCircle size={16} />
            Official Results Published
          </div>
          <h1 className="text-5xl font-black text-[#053c6d] tracking-tight">Election Results 2026</h1>
          <p className="text-slate-500 font-medium text-lg">Cyber District 01 • Blockchain Verified</p>
        </div>

        {/* Winner Card */}
        {winner && (
          <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 p-1 rounded-[3rem] shadow-2xl animate-in zoom-in-95">
            <div className="bg-white p-10 rounded-[2.8rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Trophy size={200} />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center text-5xl shadow-xl border-4 border-white">
                    <Trophy size={48} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Winner</p>
                    <h2 className="text-4xl font-black text-[#053c6d] tracking-tight">{winner.name}</h2>
                    <p className="text-sm text-slate-500 font-bold mt-1">{winner.party}</p>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-6xl font-black text-[#053c6d]">{winner.votes}</p>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Votes ({winner.percentage}%)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={<Users />} label="Total Votes Cast" value={totalVotes} color="bg-blue-500" />
          <StatCard icon={<TrendingUp />} label="Winning Margin" value={winner && results[1] ? winner.votes - results[1].votes : 0} color="bg-green-500" />
          <StatCard icon={<Award />} label="Candidates" value={results.length} color="bg-purple-500" />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200">
            <h3 className="text-2xl font-black text-[#053c6d] mb-8 flex items-center gap-3">
              <BarChart3 size={28} />
              Vote Distribution
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} style={{ fontSize: '12px', fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#94a3b8' }} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="votes" radius={[0, 12, 12, 0]} barSize={40}>
                    {results.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PARTY_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200">
            <h3 className="text-2xl font-black text-[#053c6d] mb-8 flex items-center gap-3">
              <TrendingUp size={28} />
              Vote Share
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={results}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="votes"
                  >
                    {results.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PARTY_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Results Table */}
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200">
          <h3 className="text-2xl font-black text-[#053c6d] mb-8">Detailed Results</h3>
          <div className="space-y-4">
            {results.map((candidate, index) => (
              <div key={candidate.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-lg transition group">
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-200 text-slate-600'}`}>
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-[#053c6d]">{candidate.name}</h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{candidate.party}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-[#053c6d]">{candidate.votes}</p>
                  <p className="text-sm font-bold text-slate-500 mt-1">{candidate.percentage}% of votes</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-blue-900 text-white p-8 rounded-[3rem] text-center">
          <p className="text-sm font-bold uppercase tracking-widest opacity-80">
            Results verified on Ethereum Blockchain • Immutable & Transparent
          </p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: any) => (
  <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 flex items-center gap-6">
    <div className={`w-16 h-16 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
      {React.cloneElement(icon, { size: 32 })}
    </div>
    <div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-[#053c6d]">{value}</p>
    </div>
  </div>
);

export default PublicResults;