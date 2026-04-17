import React, { useState } from 'react';
import { Download, ArrowLeft, CheckCircle2, AlertCircle, Loader2, CreditCard } from 'lucide-react';

interface DownloadEPICProps {
  onBack: () => void;
}

const DownloadEPIC: React.FC<DownloadEPICProps> = ({ onBack }) => {
  const [voterId, setVoterId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const formatVoterId = (value: string): string => {
    const cleaned = value.replace(/[^A-Z0-9]/g, '');
    const letters = cleaned.substring(0, 4).replace(/[^A-Z]/g, '');
    const numbers = cleaned.substring(4, 10).replace(/[^0-9]/g, '');
    return letters + numbers;
  };

  const handleInputChange = (value: string) => {
    setVoterId(formatVoterId(value.toUpperCase()));
    setError('');
  };

  const validateVoterId = (id: string): boolean => {
    return id.length === 10 && /^[A-Z]{4}[0-9]{6}$/.test(id);
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateVoterId(voterId)) {
      setError('Invalid Voter ID format. Must be 4 letters followed by 6 digits (e.g., VOTE123456)');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:5000/api/generate-voter-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voter_card_${voterId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setSuccess(true);
        setVoterId('');
      } else {
        const result = await response.json();
        setError(result.message || 'Failed to generate voter ID card. Please check your Voter ID.');
      }
    } catch (error) {
      console.error('Voter card download error:', error);
      setError('Failed to download voter ID card. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8fafc] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white p-12 rounded-3xl shadow-2xl border border-slate-200 text-center space-y-8 animate-in zoom-in-95">
            <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border-4 border-green-100">
              <CheckCircle2 size={48} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-[#053c6d] tracking-tight">Download Successful!</h2>
              <p className="text-slate-500 font-medium text-sm">Your EPIC card has been downloaded successfully.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <p className="text-sm text-blue-800 leading-relaxed">
                <span className="font-bold">Note:</span> Your Electronic Photo Identity Card (EPIC) has been saved to your downloads folder. Please keep it safe for voting purposes.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSuccess(false)}
                className="bg-slate-50 text-slate-700 py-4 rounded-xl font-bold border border-slate-200 hover:bg-slate-100 transition flex items-center justify-center gap-2"
              >
                <Download size={18} /> Download Another
              </button>
              <button
                onClick={onBack}
                className="bg-[#053c6d] text-white py-4 rounded-xl font-bold hover:bg-[#085091] transition shadow-lg shadow-blue-900/20"
              >
                Return to Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-[#053c6d] font-bold mb-6 transition"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>

          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-[#053c6d] p-10 text-white flex items-center gap-6">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20">
                <Download size={40} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight">Download EPIC Card</h2>
                <p className="text-blue-100/70 font-medium text-sm mt-1 uppercase tracking-widest text-[10px]">
                  Electronic Photo Identity Card
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-12 space-y-8">
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex gap-4">
                <CreditCard className="text-blue-600 shrink-0" size={24} />
                <div>
                  <p className="text-xs text-blue-900 font-bold uppercase tracking-wider mb-1">
                    About EPIC
                  </p>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    Your Electronic Photo Identity Card (EPIC) is an official document issued by the Election Commission. 
                    Enter your Voter ID below to download your card as a PDF.
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleDownload} className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700">
                    Voter ID Number
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#053c6d] transition-colors">
                      <CreditCard size={22} />
                    </div>
                    <input
                      required
                      autoFocus
                      type="text"
                      maxLength={10}
                      className="w-full pl-14 pr-5 py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:bg-white focus:border-[#053c6d] outline-none text-xl font-bold transition-all placeholder:text-slate-300 tracking-wider"
                      placeholder="VOTE123456"
                      value={voterId}
                      onChange={(e) => handleInputChange(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-slate-500 ml-1">
                    Format: 4 letters + 6 digits (e.g., VOTE123456)
                  </p>
                </div>

                {error && (
                  <div className="p-5 bg-red-50 border border-red-200 rounded-2xl flex gap-4 items-start animate-in zoom-in-95">
                    <AlertCircle className="text-red-600 shrink-0" size={24} />
                    <div>
                      <p className="text-red-900 font-bold text-xs uppercase tracking-wider mb-1">
                        Download Failed
                      </p>
                      <p className="text-red-700 text-sm font-medium leading-tight">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !validateVoterId(voterId)}
                  className="w-full bg-[#053c6d] text-white py-6 rounded-2xl font-black text-xl hover:bg-[#085091] transition shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Generating EPIC Card...
                    </>
                  ) : (
                    <>
                      <Download size={24} />
                      Download EPIC Card
                    </>
                  )}
                </button>
              </form>

              {/* Help Text */}
              <div className="pt-6 border-t border-slate-100">
                <p className="text-center text-xs text-slate-500 leading-relaxed">
                  Don't have a Voter ID yet?{' '}
                  <button
                    onClick={onBack}
                    className="text-[#053c6d] font-bold hover:underline"
                  >
                    Register as a new voter
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadEPIC;
