import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, User, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function validate() {
    if (!fullName.trim()) return 'Full name is required.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    if (phone && !/^[6-9]\d{9}$/.test(phone)) return 'Enter a valid 10-digit Indian mobile number.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsLoading(true);
    setError('');

    const { data, error: authError } = await signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        },
      },
    });

    if (authError) {
      setIsLoading(false);
      setError(authError.message);
      return;
    }

    // Profile is created automatically by the handle_new_user DB trigger
    // which reads full_name and phone from raw_user_meta_data

    setIsLoading(false);
    setSuccess(true);

    // If session exists (email confirm disabled), go straight to dashboard
    // If session is null (email confirm enabled), the success screen tells them to check email
    if (data?.session) {
      setTimeout(() => navigate('/dashboard'), 1500);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex flex-col">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ShieldCheck className="h-7 w-7 text-blue-700" />
          <span className="font-bold text-xl text-slate-900 tracking-tight">Pravah</span>
        </Link>
      </nav>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-700 rounded-2xl mb-4 shadow-lg shadow-blue-200">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Create your account</h1>
            <p className="text-slate-500 mt-1.5 text-sm">Join Pravah and report civic issues in seconds</p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 py-8 text-center"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Account created!</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Check your email for a confirmation link, then{' '}
                      <Link to="/login" className="text-blue-700 font-semibold hover:underline">sign in here</Link>.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-4"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
                      >
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => { setFullName(e.target.value); setError(''); }}
                        placeholder="Your full name"
                        autoComplete="name"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Email address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        id="reg-email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="reg-phone" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Mobile Number <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        id="reg-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setError(''); }}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        autoComplete="tel"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        placeholder="Min. 6 characters"
                        autoComplete="new-password"
                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md disabled:cursor-not-allowed mt-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Creating account...
                      </>
                    ) : 'Create Account'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
