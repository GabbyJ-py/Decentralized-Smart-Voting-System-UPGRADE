import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { UserPlus, Camera, Upload, ShieldCheck, AlertCircle, Phone, User, Calendar, Mail, Fingerprint, CheckCircle2, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';

const VoterRegistration: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [regPhase, setRegPhase] = useState<'PHONE_ENTRY' | 'OTP_VERIFY' | 'AADHAAR_VERIFY' | 'FORM'>('PHONE_ENTRY');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [formData, setFormData] = useState({ 
    name: '', 
    age: '', 
    gender: 'Male',
    email: '', 
    phone: '',
    aadhaar: '' 
  });
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to download voter ID card
  const handleDownloadEPIC = async () => {
    if (!successId) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/generate-voter-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterId: successId,
          name: formData.name,
          age: formData.age,
          gender: formData.gender,
          aadhaar: formData.aadhaar
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voter_card_${successId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to generate voter ID card');
      }
    } catch (error) {
      console.error('Voter card download error:', error);
      alert('Failed to download voter ID card');
    }
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    // Only Gmail addresses allowed
    const emailRegex = /^[^\s@]+@gmail\.com$/i;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Only 10 digits allowed
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone.trim());
  };

  const validateAge = (age: string): boolean => {
    const ageNum = parseInt(age, 10);
    return !isNaN(ageNum) && ageNum >= 18 && ageNum <= 120;
  };

  const validateAadhaar = (aadhaar: string): boolean => {
    const cleaned = aadhaar.replace(/[^0-9X]/g, '');
    return cleaned.length === 12;
  };

  const validateName = (name: string): boolean => {
    return name.trim().length >= 3 && /^[a-zA-Z\s]+$/.test(name);
  };

  const formatAadhaar = (value: string) => {
    // Allow digits and X only
    const cleaned = value
      .toUpperCase()
      .replace(/[^0-9X]/g, '');

    const trimmed = cleaned.substring(0, 12);

    const parts = [];
    for (let i = 0; i < trimmed.length; i += 4) {
      parts.push(trimmed.substring(i, i + 4));
    }

    return parts.join('-');
  };

  // Handle phone number OTP request
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phoneNumber.length !== 10 || !/^\d{10}$/.test(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    const result = await api.requestRegistrationOtp(phoneNumber);
    
    if (result.success) {
      setMaskedPhone(result.maskedPhone || '');
      setRegPhase('OTP_VERIFY');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  // Handle OTP verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpInput.length !== 6 || !/^\d{6}$/.test(otpInput)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    const result = await api.verifyRegistrationOtp(phoneNumber, otpInput);
    
    if (result.success) {
      setFormData({ ...formData, phone: phoneNumber });
      setRegPhase('AADHAAR_VERIFY');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setOtpInput('');
    setError('');
    setLoading(true);

    const result = await api.requestRegistrationOtp(phoneNumber);
    
    if (result.success) {
      setError('');
      alert('OTP resent successfully!');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };


  const handleInitialAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAadhaarInput(formatAadhaar(e.target.value));
  };

  const verifyAadhaarRegistry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaarInput.length < 14) {
      setError('Invalid Aadhaar: Please enter a full 12-digit Aadhaar number.');
      return;
    }

    setLoading(true);
    setError('');

    // Check if Aadhaar already exists in the system
    const result = await api.findVoterById(aadhaarInput);
    
    // If success is true, it means a record was found
    if (result.success) {
      setError('Registration Error: This Aadhaar number is already enrolled in the National Voter Registry.');
      setLoading(false);
    } else {
      // Aadhaar is not found, safe to proceed
      setFormData({ ...formData, aadhaar: aadhaarInput });
      setRegPhase('FORM');
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setError('Format Error: Only JPEG, JPG, and PNG images are accepted for facial recognition.');
        setUploadedImage(null);
        setValidationErrors({...validationErrors, image: 'Format Error: Only JPEG, JPG, and PNG images are accepted.'});
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setError('');
        // Clear image validation error when image is successfully uploaded
        const newErrors = {...validationErrors};
        delete newErrors.image;
        setValidationErrors(newErrors);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setValidationErrors({});
    setError('');
    
    // Validate all fields
    const errors: Record<string, string> = {};
    
    if (!validateName(formData.name)) {
      errors.name = 'Name must be at least 3 characters and contain only letters';
    }
    
    if (!validateAge(formData.age)) {
      errors.age = 'You must be at least 18 years old to register';
    }
    
    if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!validatePhone(formData.phone)) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }
    
    if (!validateAadhaar(formData.aadhaar)) {
      errors.aadhaar = 'Aadhaar must be exactly 12 digits';
    }
    
    if (!uploadedImage) { 
      errors.image = 'Biometric enrollment is mandatory. Please upload a clear facial photo (JPEG/PNG).';
      const element = document.getElementById('biometric-section');
      element?.scrollIntoView({ behavior: 'smooth' });
    }
    
    // If there are validation errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fix the validation errors before submitting');
      return;
    }
    
    setLoading(true);

    const result = await api.registerVoter({
      ...formData,
      age: parseInt(formData.age, 10) || 0
    }, uploadedImage!);

    if (result.success && result.voterId) { 
      setSuccessId(result.voterId);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  if (successId) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-12 rounded-3xl shadow-2xl border border-slate-200 text-center space-y-8 animate-in zoom-in-95">
        <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border-4 border-green-100">
          <ShieldCheck size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-[#053c6d] tracking-tight">E-Roll Enrollment Success</h2>
          <p className="text-slate-500 font-medium text-sm">Your digital identity has been verified and stored on the blockchain.</p>
        </div>
        
        <div className="bg-[#0b2447] text-white p-8 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ShieldCheck size={120} />
          </div>
          <div className="relative z-10 text-left space-y-4">
            <div>
              <p className="text-lg font-semibold text-white">A digital confirmation has been sent to your registered email address.</p>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-[8px] font-bold uppercase opacity-40">Voter Name</p>
                <p className="text-xs font-bold">{formData.name}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase opacity-40">Aadhaar (Masked)</p>
                <p className="text-xs font-bold">XXXX-XXXX-{formData.aadhaar.slice(-4)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleDownloadEPIC}
            className="bg-slate-50 text-slate-700 py-4 rounded-xl font-bold border border-slate-200 hover:bg-slate-100 transition flex items-center justify-center gap-2"
          >
            <Upload size={18} /> Download EPIC
          </button>
          <button onClick={onComplete} className="bg-[#053c6d] text-white py-4 rounded-xl font-bold hover:bg-[#085091] transition shadow-lg shadow-blue-900/20">
            Return to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-[#053c6d] p-10 text-white flex items-center gap-6">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20">
            <UserPlus size={40} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight">Voter E-Enrollment</h2>
            <p className="text-blue-100/70 font-medium text-sm mt-1 uppercase tracking-widest text-[10px]">Ministry of Digital Governance • Electoral Registry v4.0</p>
          </div>
        </div>

        {regPhase === 'PHONE_ENTRY' ? (
          <div className="p-12 md:p-20 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            <div className="max-w-md mx-auto space-y-8">
              <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto text-green-600 border border-green-100 shadow-inner">
                <Phone size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-[#053c6d]">Phone Verification</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">Enter your 10-digit mobile number to receive a verification code.</p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#053c6d] transition-colors">
                    <Phone size={22} />
                  </div>
                  <input 
                    required
                    autoFocus
                    type="tel"
                    maxLength={10}
                    className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:bg-white focus:border-[#053c6d] outline-none text-xl font-bold transition-all placeholder:text-slate-300 shadow-sm"
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <button 
                  disabled={loading || phoneNumber.length !== 10}
                  className="w-full bg-[#053c6d] text-white py-6 rounded-3xl font-black text-xl hover:bg-[#085091] transition shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 group"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>Send OTP <ArrowRight className="group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </form>

              {error && (
                <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex gap-4 items-center text-left animate-in zoom-in-95">
                  <AlertCircle className="text-red-600 shrink-0" size={24} />
                  <p className="text-red-700 text-sm font-bold leading-tight">{error}</p>
                </div>
              )}
            </div>
          </div>
        ) : regPhase === 'OTP_VERIFY' ? (
          <div className="p-12 md:p-20 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            <div className="max-w-md mx-auto space-y-8">
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto text-[#053c6d] border border-blue-100 shadow-inner">
                <ShieldCheck size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-[#053c6d]">Enter OTP</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                  We've sent a 6-digit code to {maskedPhone}
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="relative group">
                  <input 
                    required
                    autoFocus
                    type="text"
                    maxLength={6}
                    className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:bg-white focus:border-[#053c6d] outline-none text-2xl font-bold text-center transition-all placeholder:text-slate-300 shadow-sm tracking-widest"
                    placeholder="000000"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <button 
                  disabled={loading || otpInput.length !== 6}
                  className="w-full bg-[#053c6d] text-white py-6 rounded-3xl font-black text-xl hover:bg-[#085091] transition shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 group"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>Verify OTP <CheckCircle2 className="group-hover:scale-110 transition-transform" /></>}
                </button>
                
                <button 
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="w-full text-[#053c6d] py-3 rounded-xl font-bold hover:bg-blue-50 transition disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </form>

              {error && (
                <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex gap-4 items-center text-left animate-in zoom-in-95">
                  <AlertCircle className="text-red-600 shrink-0" size={24} />
                  <p className="text-red-700 text-sm font-bold leading-tight">{error}</p>
                </div>
              )}
            </div>
          </div>
        ) : regPhase === 'AADHAAR_VERIFY' ? (
          <div className="p-12 md:p-20 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            <div className="max-w-md mx-auto space-y-8">
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto text-[#053c6d] border border-blue-100 shadow-inner">
                <Fingerprint size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-[#053c6d]">Registry Verification</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">Please provide your 12-digit Aadhaar number to verify your current eligibility status in the national registry.</p>
              </div>

              <form onSubmit={verifyAadhaarRegistry} className="space-y-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-[#053c6d] transition-colors">
                    <Fingerprint size={22} />
                  </div>
                  <input 
                    required
                    autoFocus
                    className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:bg-white focus:border-[#053c6d] outline-none text-xl font-bold transition-all placeholder:text-slate-300 shadow-sm"
                    placeholder="XXXX-XXXX-XXXX"
                    value={aadhaarInput}
                    onChange={handleInitialAadhaarChange}
                  />
                </div>
                <button 
                  disabled={loading || !aadhaarInput}
                  className="w-full bg-[#053c6d] text-white py-6 rounded-3xl font-black text-xl hover:bg-[#085091] transition shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 group"
                >
                  {/* Using Loader2 correctly after adding the import */}
                  {loading ? <Loader2 className="animate-spin" /> : <>Check Registry Status <ArrowRight className="group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </form>

              {error && (
                <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex gap-4 items-center text-left animate-in zoom-in-95">
                  <ShieldAlert className="text-red-600 shrink-0" size={24} />
                  <div>
                    <p className="text-red-900 font-black text-[10px] uppercase tracking-widest mb-1">Registration Blocked</p>
                    <p className="text-red-700 text-sm font-bold leading-tight">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12 animate-in fade-in duration-500">
            {/* Section 1: Personal Details */}
            <div className="space-y-8">
              <div className="flex items-center gap-2 text-[#053c6d]">
                <User size={20} className="shrink-0" />
                <h3 className="text-lg font-black uppercase tracking-widest">Personal Identification</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <Input 
                  icon={<User size={18} />}
                  label="Full Name as per Aadhaar" 
                  value={formData.name} 
                  onChange={(v: string) => setFormData({...formData, name: v})} 
                  placeholder="Ex: John Alexander Doe"
                  error={validationErrors.name}
                />
                <Input 
                  icon={<Calendar size={18} />}
                  label="Age" 
                  type="number" 
                  value={formData.age} 
                  onChange={(v: string) => setFormData({...formData, age: v})} 
                  placeholder="Minimum 18 years"
                  error={validationErrors.age}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Gender Specification</label>
                <div className="grid grid-cols-3 gap-4">
                  {['Male', 'Female', 'Other'].map(option => (
                    <label key={option} className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer font-bold text-sm ${
                      formData.gender === option 
                        ? 'bg-blue-50 border-[#053c6d] text-[#053c6d]' 
                        : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'
                    }`}>
                      <input 
                        type="radio" 
                        className="hidden" 
                        name="gender" 
                        value={option} 
                        checked={formData.gender === option} 
                        onChange={() => setFormData({...formData, gender: option})} 
                      />
                      {formData.gender === option && <CheckCircle2 size={16} />}
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2: Contact & Identity */}
            <div className="space-y-8">
              <div className="flex items-center gap-2 text-[#053c6d]">
                <Mail size={20} className="shrink-0" />
                <h3 className="text-lg font-black uppercase tracking-widest">Contact & Identity</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Input 
                  icon={<Mail size={18} />}
                  label="Official Email ID" 
                  type="email" 
                  value={formData.email} 
                  onChange={(v: string) => setFormData({...formData, email: v})} 
                  placeholder="voter@registry.gov"
                  error={validationErrors.email}
                />
                <Input 
                  icon={<Phone size={18} />}
                  label="Mobile Number" 
                  type="tel" 
                  value={formData.phone} 
                  onChange={(v: string) => setFormData({...formData, phone: v})} 
                  placeholder="+91 00000 00000"
                  error={validationErrors.phone}
                  disabled={true}
                />
              </div>

              <div className="relative group opacity-60">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2">Verified Aadhaar Number (Locked)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-[#053c6d]">
                    <ShieldCheck size={20} />
                  </div>
                  <input 
                    readOnly 
                    type="text" 
                    className="w-full pl-14 pr-5 py-5 bg-slate-100 border-2 border-slate-200 rounded-2xl outline-none font-bold text-xl tracking-widest text-[#053c6d]" 
                    value={formData.aadhaar} 
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Biometric Enrollment (Mandatory) */}
            <div id="biometric-section" className="space-y-8 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#053c6d]">
                  <Camera size={20} className="shrink-0" />
                  <h3 className="text-lg font-black uppercase tracking-widest">Facial Biometrics</h3>
                </div>
                <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">Required for AI Auth</span>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative group cursor-pointer border-4 border-dashed rounded-[2.5rem] p-10 transition-all flex flex-col items-center justify-center min-h-[340px] ${
                  validationErrors.image
                    ? 'border-red-300 bg-red-50/30 hover:border-red-400'
                    : uploadedImage 
                      ? 'border-green-200 bg-green-50/30 hover:border-green-400' 
                      : 'border-slate-100 bg-slate-50 hover:border-[#053c6d]/30 hover:bg-blue-50/30'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".jpg,.jpeg,.png" 
                  onChange={handleImageUpload} 
                />

                {uploadedImage ? (
                  <div className="relative">
                    <div className="w-56 h-56 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl relative">
                      <img src={uploadedImage} className="w-full h-full object-cover" alt="Biometric Preview" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                         <Upload className="text-white" size={32} />
                      </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 bg-green-500 text-white p-3 rounded-2xl shadow-xl border-4 border-white">
                      <CheckCircle2 size={24} />
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-slate-300 shadow-xl border border-slate-100 mx-auto group-hover:scale-110 group-hover:text-[#053c6d] transition-all duration-500">
                      <Camera size={40} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-black text-slate-600">Click to Upload Enrollment Portrait</p>
                      <p className="text-xs text-slate-400 font-medium">Clear background • High-resolution • JPG or PNG only</p>
                    </div>
                  </div>
                )}
              </div>
              
              {validationErrors.image && (
                <p className="text-red-600 text-sm font-bold ml-1 flex items-center gap-2 animate-in slide-in-from-top-1">
                  <AlertCircle size={16} /> {validationErrors.image}
                </p>
              )}
              
              <div className="bg-blue-50/50 p-6 rounded-3xl flex gap-4 border border-blue-100">
                <ShieldCheck className="text-blue-600 shrink-0" size={24} />
                <div>
                  <p className="text-xs text-blue-900 font-bold uppercase tracking-wider mb-1">FaceNet-v3 Encryption Policy</p>
                  <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                    Your facial image is converted into a 128-dimensional mathematical vector (embedding). The actual image is purged after vectorization to maintain privacy while ensuring 100% identity match during voting.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="space-y-6 pt-6">
              {error && (
                <div className="p-5 bg-red-50 border-2 border-red-100 rounded-2xl flex gap-4 items-center animate-in slide-in-from-top-2">
                  <AlertCircle className="text-red-600 shrink-0" size={20} />
                  <p className="text-red-700 text-sm font-bold">{error}</p>
                </div>
              )}
              
              <button 
                disabled={loading} 
                className="w-full bg-[#053c6d] text-white py-6 rounded-2xl font-black text-xl hover:bg-[#085091] transition disabled:opacity-50 shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating Digital Identity...
                  </>
                ) : (
                  <>Finalize Enrollment & Issue EPIC</>
                )}
              </button>
              <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">By enrolling, you agree to the Electoral Blockchain Integrity Protocol.</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const Input = ({ label, icon, type = "text", value, onChange, placeholder, maxLength, error, disabled = false }: any) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
    <div className="relative group">
      <div className={`absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors ${
        error ? 'text-red-500' : disabled ? 'text-green-500' : 'text-slate-400 group-focus-within:text-[#053c6d]'
      }`}>
        {icon}
      </div>
      <input 
        required 
        type={type} 
        maxLength={maxLength}
        disabled={disabled}
        className={`w-full pl-12 pr-5 py-4 border-2 rounded-2xl outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300 ${
          disabled
            ? 'bg-green-50 border-green-200 cursor-not-allowed'
            : error 
            ? 'bg-red-50 border-red-300 focus:border-red-500' 
            : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-[#053c6d]'
        }`}
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder} 
      />
    </div>
    {error && (
      <p className="text-red-600 text-xs font-bold ml-1 flex items-center gap-1 animate-in slide-in-from-top-1">
        <AlertCircle size={12} /> {error}
      </p>
    )}
    {disabled && (
      <p className="text-green-600 text-xs font-bold ml-1 flex items-center gap-1">
        <CheckCircle2 size={12} /> Verified
      </p>
    )}
  </div>
);

export default VoterRegistration;