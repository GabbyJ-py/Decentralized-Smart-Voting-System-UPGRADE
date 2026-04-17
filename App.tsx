import React, { useState, Suspense } from 'react';
import { AppView, Voter } from './types.ts';
import Header from './components/Header.tsx';
import VoterRegistration from './components/VoterRegistration.tsx';
import VoterAuthentication from './components/VoterAuthentication.tsx';
import VotingPanel from './components/VotingPanel.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import VoterSearch from './components/VoterSearch.tsx';
import PublicResults from './components/PublicResults.tsx';
import DocumentationViewer from './components/DocumentationViewer.tsx';
import DownloadEPIC from './components/DownloadEPIC.tsx';
import { Search, Info, ExternalLink, ShieldCheck, BarChart3, Lock, UserPlus, Download } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [authenticatedVoter, setAuthenticatedVoter] = useState<Voter | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [showVotingInactiveModal, setShowVotingInactiveModal] = useState(false);

  const handleAuthSuccess = (voter: Voter) => {
    setAuthenticatedVoter(voter);
    setCurrentView(AppView.VOTING);
  };

  const resetSession = () => {
    setAuthenticatedVoter(null);
    setCurrentView(AppView.LANDING);
  };

  // Handle Download EPIC - Navigate to dedicated page
  const handleDownloadEPIC = () => {
    setCurrentView(AppView.DOWNLOAD_EPIC);
  };

  // Check voting status before navigating to authentication
  const handleAuthNavigation = async () => {
    // Show modal immediately for instant feedback
    setShowVotingInactiveModal(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/voting-status');
      const data = await response.json();
      
      if (data.active) {
        // Voting is active - close modal and navigate
        setShowVotingInactiveModal(false);
        setCurrentView(AppView.AUTHENTICATION);
      }
      // If not active, modal stays open
    } catch (error) {
      console.error('Failed to check voting status:', error);
      // On error, close modal and allow navigation anyway
      setShowVotingInactiveModal(false);
      setCurrentView(AppView.AUTHENTICATION);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header 
        currentView={currentView} 
        setView={setCurrentView} 
        isAuthenticated={!!authenticatedVoter}
        onLogout={resetSession}
      />

      <main className="flex-grow">
        <Suspense fallback={<div className="p-20 text-center text-slate-400 font-bold">Initializing Portal Systems...</div>}>
          {currentView === AppView.LANDING && (
            <div className="animate-in fade-in duration-700">
              {/* Hero Section */}
              <div className="gov-gradient py-16 text-white overflow-hidden relative">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
                
                <div className="container mx-auto px-4 relative z-10">
                  <div className="max-w-5xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-white/20">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Centralized Voter Services Portal
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                      Decentralized Smart Voting System<br/>
                      <span className="text-3xl md:text-5xl"><span className="text-[#ff9933]">AI-Verified</span> & <span className="text-[#10b981]">Blockchain Integrated</span></span>
                    </h1>
                    <p className="text-xl text-blue-100 max-w-4xl leading-relaxed mb-10 opacity-90">
                      High-integrity voting infrastructure powered by AI biometrics and Blockchain. Ensuring every vote is unique, anonymous, and permanently secured against any form of manipulation.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={handleAuthNavigation}
                        className="bg-[#ff9933] hover:bg-[#e68a00] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-orange-900/20 transition transform hover:-translate-y-1"
                      >
                        Enter Voting Chamber
                      </button>
                      <button 
                        onClick={() => setCurrentView(AppView.REGISTRATION)}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm px-8 py-4 rounded-xl font-bold text-lg transition"
                      >
                        New Registration
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Services Grid */}
              <div className="container mx-auto px-4 -mt-12 mb-16 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <ServiceCard 
                    icon={<UserPlus className="text-blue-600" />} 
                    title="New Registration" 
                    description="Register yourself as a new voter with biometric capture."
                    onClick={() => setCurrentView(AppView.REGISTRATION)}
                  />
                  <ServiceCard 
                    icon={<Download className="text-purple-600" />} 
                    title="Download EPIC" 
                    description="Download your Electronic Photo Identity Card (EPIC) as PDF."
                    onClick={handleDownloadEPIC}
                  />
                  <ServiceCard 
                    icon={<Search className="text-orange-600" />} 
                    title="Search E-Roll" 
                    description="Verify your name and details in the official voter list."
                    onClick={() => setCurrentView(AppView.SEARCH)}
                  />
                  <ServiceCard 
                    icon={<BarChart3 className="text-pink-600" />} 
                    title="View Results" 
                    description="Check official election results published by the commission."
                    onClick={() => setCurrentView(AppView.RESULTS)}
                  />
                </div>
              </div>

              {/* Information Section */}
              <div className="container mx-auto px-4 pb-20 grid md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-8">
                  <h2 className="text-3xl font-black text-[#053c6d] tracking-tight border-b-4 border-blue-100 inline-block pb-2">Latest Notifications</h2>
                  <div className="space-y-4">
                    {/* Notification 1 */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition group flex gap-6">
                      <div className="hidden sm:flex flex-col items-center justify-center bg-slate-50 p-4 rounded-xl text-slate-400 font-bold w-20">
                        <span className="text-xs uppercase">Mar</span>
                        <span className="text-2xl text-[#053c6d]">10</span>
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-lg group-hover:text-blue-700 transition">Voter Registration Deadline Approaching</h4>
                        <p className="text-slate-500 text-sm mt-1">The final date for E-Enrollment for the upcoming General Election is March 15th. Ensure your Aadhaar-linked mobile number is active for OTP verification.</p>
                        <button className="mt-4 text-blue-600 font-bold text-xs uppercase flex items-center gap-1">View Enrollment Timeline <ExternalLink size={14} /></button>
                      </div>
                    </div>

                    {/* Notification 2 */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition group flex gap-6">
                      <div className="hidden sm:flex flex-col items-center justify-center bg-slate-50 p-4 rounded-xl text-slate-400 font-bold w-20">
                        <span className="text-xs uppercase">Mar</span>
                        <span className="text-2xl text-[#053c6d]">05</span>
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-lg group-hover:text-blue-700 transition">Annual Blockchain Integrity Audit Completed</h4>
                        <p className="text-slate-500 text-sm mt-1">Independent auditors have verified the Smart Contract v4.0. The ledger remains 100% immutable with zero unauthorized access attempts detected since deployment.</p>
                        <button className="mt-4 text-blue-600 font-bold text-xs uppercase flex items-center gap-1">Download Audit Report <ExternalLink size={14} /></button>
                      </div>
                    </div>

                    {/* Notification 3 */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition group flex gap-6">
                      <div className="hidden sm:flex flex-col items-center justify-center bg-slate-50 p-4 rounded-xl text-slate-400 font-bold w-20">
                        <span className="text-xs uppercase">Feb</span>
                        <span className="text-2xl text-[#053c6d]">28</span>
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-lg group-hover:text-blue-700 transition">New Privacy Protocol for Biometric Data</h4>
                        <p className="text-slate-500 text-sm mt-1">Learn how your facial data is converted into encrypted mathematical vectors. The system stores only the vector, not your actual photo, ensuring your privacy is mathematically guaranteed.</p>
                        <button className="mt-4 text-blue-600 font-bold text-xs uppercase flex items-center gap-1">Read Data Privacy Policy <ExternalLink size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-8">
                  <h2 className="text-3xl font-black text-[#053c6d] tracking-tight border-b-4 border-blue-100 inline-block pb-2">Resources & Guides</h2>
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 space-y-2">
                      <ResourceLink 
                        label="How to Register as a Voter" 
                        description="Step-by-step guide to register and get your Voter ID"
                        onClick={() => setSelectedDoc('USER_GUIDE_HOW_TO_REGISTER.md')}
                      />
                      <ResourceLink 
                        label="How to Cast Your Vote" 
                        description="Complete voting process from authentication to receipt"
                        onClick={() => setSelectedDoc('USER_GUIDE_HOW_TO_VOTE.md')}
                      />
                      <ResourceLink 
                        label="Understanding Your Voting Receipt" 
                        description="Learn what's on your receipt and how to verify your vote"
                        onClick={() => setSelectedDoc('USER_GUIDE_UNDERSTANDING_RECEIPT.md')}
                      />
                      <ResourceLink 
                        label="How to View Election Results" 
                        description="Access and understand election results and charts"
                        onClick={() => setSelectedDoc('USER_GUIDE_VIEW_RESULTS.md')}
                      />
                    </div>
                    <div className="bg-blue-50 p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Info size={20} className="text-blue-600" />
                        <span className="font-bold text-blue-900">Need Assistance?</span>
                      </div>
                      <p className="text-sm text-blue-700 leading-relaxed mb-4">Check our comprehensive voter guides above for step-by-step instructions on registration, voting, and viewing results.</p>
                      <button className="w-full bg-[#053c6d] text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-[#074a8a] transition">Contact Support</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === AppView.REGISTRATION && (
            <div className="container mx-auto px-4 py-12">
              <VoterRegistration onComplete={() => setCurrentView(AppView.LANDING)} />
            </div>
          )}

          {currentView === AppView.AUTHENTICATION && (
            <div className="container mx-auto px-4 py-12">
              <VoterAuthentication onAuthSuccess={handleAuthSuccess} />
            </div>
          )}

          {currentView === AppView.VOTING && authenticatedVoter && (
            <div className="container mx-auto px-4 py-12">
              <VotingPanel voter={authenticatedVoter} onVoteCast={resetSession} />
            </div>
          )}

          {currentView === AppView.ADMIN && (
            <div className="container mx-auto px-4 py-12">
              <AdminDashboard />
            </div>
          )}

          {currentView === AppView.SEARCH && (
            <div className="container mx-auto px-4 py-12">
              <VoterSearch onRegisterClick={() => setCurrentView(AppView.REGISTRATION)} />
            </div>
          )}

          {currentView === AppView.RESULTS && (
            <PublicResults />
          )}

          {currentView === AppView.DOWNLOAD_EPIC && (
            <DownloadEPIC onBack={() => setCurrentView(AppView.LANDING)} />
          )}
        </Suspense>
      </main>

      <footer className="bg-[#0b2447] text-white border-t border-white/5 py-16 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <ShieldCheck size={28} className="text-[#ff9933]" />
                <span className="font-black text-2xl tracking-tighter uppercase">SmartVote</span>
              </div>
              <p className="text-blue-200/60 text-sm leading-relaxed">
                Empowering citizens through transparent, technology-driven election processes. A joint initiative for secure democracy.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">General Links</h4>
              <ul className="space-y-3 text-blue-200/60 text-sm">
                <li><a href="#" className="hover:text-white transition">About the Portal</a></li>
                <li><a href="#" className="hover:text-white transition">Voter Education</a></li>
                <li><a href="#" className="hover:text-white transition">Electoral Laws</a></li>
                <li><a href="#" className="hover:text-white transition">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">Media Presence</h4>
              <ul className="space-y-3 text-blue-200/60 text-sm">
                <li><a href="#" className="hover:text-white transition">Press Releases</a></li>
                <li><a href="#" className="hover:text-white transition">Video Gallery</a></li>
                <li><a href="#" className="hover:text-white transition">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6">Connect</h4>
              <p className="text-blue-200/60 text-sm mb-4">Election Commission Office, Cyber City - 01</p>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition cursor-pointer">X</div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition cursor-pointer">FB</div>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 text-center">
            <p className="text-blue-200/40 text-xs font-medium tracking-widest uppercase">
              Final Year Academic Project &copy; {new Date().getFullYear()} - MINISTRY OF DIGITAL GOVERNANCE
            </p>
          </div>
        </div>
      </footer>

      {/* Documentation Viewer Modal */}
      {selectedDoc && (
        <DocumentationViewer 
          file={selectedDoc} 
          onClose={() => setSelectedDoc(null)} 
        />
      )}

      {/* Voting Inactive Modal */}
      {showVotingInactiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur - smooth fade in */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 ease-out"
            style={{
              animation: 'fadeIn 0.3s ease-out forwards'
            }}
            onClick={() => setShowVotingInactiveModal(false)}
          />
          
          {/* Modal Container - smooth scale and fade */}
          <div 
            className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 transition-all duration-300 ease-out"
            style={{
              animation: 'modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            }}
          >
            {/* Icon */}
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock size={32} className="text-orange-600" />
            </div>
            
            {/* Title */}
            <h3 className="text-2xl font-black text-[#053c6d] text-center mb-3">
              Voting Not Yet Active
            </h3>
            
            {/* Message */}
            <p className="text-slate-600 text-center leading-relaxed mb-8">
              The voting period has not been started yet by the Election Commission. Please check back later once the voting period has been officially activated.
            </p>
            
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-blue-800 leading-relaxed">
                <span className="font-bold">Note:</span> The admin must start the voting period from the Admin Dashboard before voters can cast their ballots. Contact your election administrator for more information.
              </p>
            </div>
            
            {/* Action Button */}
            <button
              onClick={() => setShowVotingInactiveModal(false)}
              className="w-full bg-[#053c6d] hover:bg-[#074a8a] text-white py-4 rounded-xl font-bold transition-all duration-200 ease-out shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              I Understand
            </button>
            
            {/* Footer Text */}
            <p className="text-center text-xs text-slate-400 mt-4 uppercase tracking-widest">
              Please check back later
            </p>
          </div>
        </div>
      )}

      {/* Smooth Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Smooth backdrop blur transition */
        .backdrop-blur-sm {
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
      `}</style>
    </div>
  );
};

const ServiceCard: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick: () => void }> = ({ icon, title, description, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-900/10 transition transform hover:-translate-y-2 cursor-pointer group"
  >
    <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-500">
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 28 }) : icon}
    </div>
    <h3 className="text-xl font-extrabold text-[#053c6d] mb-3">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed mb-6">{description}</p>
    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider group-hover:gap-4 transition-all">
      Proceed Service <span className="text-xl">→</span>
    </div>
  </div>
);

const ResourceLink: React.FC<{ label: string; description?: string; onClick?: () => void }> = ({ label, description, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-start justify-between text-slate-600 hover:text-blue-700 transition p-4 hover:bg-slate-50 rounded-xl group border border-transparent hover:border-blue-200 text-left"
    >
      <div className="flex-1">
        <span className="font-semibold text-sm block">{label}</span>
        {description && <span className="text-xs text-slate-500 mt-1 block">{description}</span>}
      </div>
      <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition mt-1 flex-shrink-0 ml-2" />
    </button>
  );
};

export default App;