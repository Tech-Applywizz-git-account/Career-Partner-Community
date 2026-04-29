import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';

// ─── OTP Input (Same as Signup) ────────────────────────────────────────────────
const OtpInput = ({ value, onChange, disabled }) => {
    const refs = useRef([]);
    const digits = (value || '').split('');

    const handleKeyDown = (e, idx) => {
        if (e.key === 'Backspace') {
            if (digits[idx]) {
                const d = [...digits]; d[idx] = ''; onChange(d.join(''));
            } else if (idx > 0) refs.current[idx - 1]?.focus();
        } else if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus();
        else if (e.key === 'ArrowRight' && idx < 5) refs.current[idx + 1]?.focus();
    };

    const handleChange = (e, idx) => {
        const val = e.target.value.replace(/\D/g, '').slice(-1);
        const d = [...digits]; d[idx] = val; onChange(d.join(''));
        if (val && idx < 5) refs.current[idx + 1]?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(pasted.padEnd(6, '').slice(0, 6));
        refs.current[Math.min(pasted.length, 5)]?.focus();
    };

    return (
        <div className="flex items-center gap-2 justify-center my-6">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
                <input
                    key={idx}
                    ref={(el) => (refs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digits[idx] || ''}
                    onChange={(e) => handleChange(e, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={`w-10 h-12 text-center text-xl font-bold border-b-2 outline-none transition-all ${
                        digits[idx] ? 'border-[#29FE29] text-gray-900' : 'border-gray-200 text-gray-400'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}`}
                    style={{ background: 'transparent' }}
                />
            ))}
        </div>
    );
};

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState('email'); // 'email' | 'otp' | 'reset' | 'success'
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [otpToken, setOtpToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Resend countdown
    useEffect(() => {
        if (resendCooldown > 0) {
            const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [resendCooldown]);

    const callEdgeFn = async (name, body) => {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify(body),
        });
        return res.json();
    };

    // ── Step 1: Send Reset OTP ──
    const handleSendOtp = async (e) => {
        e?.preventDefault();
        setError('');
        if (!email) { setError('Please enter your email.'); return; }
        
        setLoading(true);
        try {
            const result = await callEdgeFn('send-password-reset-otp', { email });
            if (!result.success) throw new Error(result.error || 'Failed to send reset code');
            
            setOtpToken(result.token);
            setStep('otp');
            setResendCooldown(60);
        } catch (err) {
            setError(err.message || 'Failed to send reset code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Verify OTP ──
    const handleVerifyOtp = async () => {
        if (otp.length < 6 || loading) return;
        setError('');
        setLoading(true);
        try {
            const result = await callEdgeFn('verify-password-reset-otp', { email, otp, token: otpToken });
            if (!result.success) throw new Error(result.error || 'Invalid code');
            
            setOtpToken(result.token); // Store the verification token for the final reset
            setStep('reset');
        } catch (err) {
            setError(err.message || 'Verification failed. Please try again.');
            setOtp('');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (otp.length === 6 && step === 'otp') handleVerifyOtp();
    }, [otp]);

    // ── Step 3: Complete Reset ──
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const result = await callEdgeFn('reset-password-final', {
                email,
                token: otpToken,
                newPassword
            });
            
            if (!result.success) throw new Error(result.error || 'Reset failed');
            setStep('success');
        } catch (err) {
            setError(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setOtp('');
        await handleSendOtp();
    };

    return (
        <div className="min-h-screen bg-[#29FE29] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#29FE29]/10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3"></div>
            <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-[#29FE29]/5 rounded-full -translate-y-1/2"></div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-in { animation: animateIn 0.5s ease-out; }
                @keyframes animateIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 md:p-10 transition-all duration-300">
                {/* Back Link */}
                {step !== 'success' && (
                    <button
                        onClick={() => {
                            if (step === 'otp') setStep('email');
                            else if (step === 'reset') setStep('otp');
                            else navigate('/login');
                            setError('');
                        }}
                        className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}

                {/* Logo */}
                <div className="text-center mb-8 pt-4">
                    <div className="inline-flex items-center gap-3">
                        <div className="relative">
                            <img 
                                src="/cp-logo.png" 
                                alt="Career Partner" 
                                className="w-10 h-10 rounded-xl object-contain shadow-lg"
                            />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-xl font-bold text-[#29FE29] tracking-tight leading-none">Career</span>
                            <span className="text-xl font-bold text-[#29FE29] tracking-tight leading-none">Partner</span>
                        </div>
                    </div>
                </div>

                {/* ─── EMAIL STEP ─── */}
                {step === 'email' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-2xl font-black text-gray-900 text-center mb-2">Forgot Password?</h1>
                        <p className="text-sm text-gray-400 text-center mb-8 font-medium">
                            No worries! Enter your email and we'll send you a reset code.
                        </p>

                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100 focus-within:border-[#29FE29]/30 focus-within:ring-1 focus-within:ring-[#29FE29]/10 transition-all">
                                <Mail size={18} className="text-gray-300 shrink-0" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="flex-1 bg-transparent text-sm font-semibold text-gray-700 outline-none placeholder:text-gray-300"
                                    required
                                />
                            </div>

                            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-[#29FE29] hover:bg-[#1a2a47] text-[#1E1E1E] font-black text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ─── OTP STEP ─── */}
                {step === 'otp' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-2xl font-black text-gray-900 text-center mb-2">Check your email</h1>
                        <p className="text-sm text-gray-400 text-center mb-6 font-medium">
                            We've sent a 6-digit code to <br/>
                            <span className="text-[#29FE29] font-bold">{email}</span>
                        </p>

                        <OtpInput value={otp} onChange={setOtp} disabled={loading} />

                        {error && <p className="text-red-500 text-xs font-bold text-center mb-4">{error}</p>}

                        <div className="text-center mb-8">
                            <p className="text-xs text-gray-400 font-medium">
                                Didn't receive the code?{' '}
                                <button
                                    onClick={handleResend}
                                    disabled={resendCooldown > 0}
                                    className={`font-black uppercase tracking-wider ${
                                        resendCooldown > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-[#29FE29] hover:text-[#e5a811]'
                                    }`}
                                >
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Now'}
                                </button>
                            </p>
                        </div>

                        <button
                            onClick={handleVerifyOtp}
                            disabled={otp.length < 6 || loading}
                            className="w-full py-4 bg-[#29FE29] hover:bg-[#1a2a47] text-[#1E1E1E] font-black text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </div>
                )}

                {/* ─── RESET PASSWORD STEP ─── */}
                {step === 'reset' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-2xl font-black text-gray-900 text-center mb-2">New Password</h1>
                        <p className="text-sm text-gray-400 text-center mb-8 font-medium">
                            Create a secure password to protect your account.
                        </p>

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100 focus-within:border-[#29FE29]/30 transition-all">
                                    <Lock size={18} className="text-gray-300 shrink-0" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="New Password"
                                        className="flex-1 bg-transparent text-sm font-semibold text-gray-700 outline-none placeholder:text-gray-300"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-gray-300 hover:text-gray-500"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100 focus-within:border-[#29FE29]/30 transition-all">
                                    <ShieldCheck size={18} className="text-gray-300 shrink-0" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm Password"
                                        className="flex-1 bg-transparent text-sm font-semibold text-gray-700 outline-none placeholder:text-gray-300"
                                        required
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-[#29FE29] hover:bg-[#1a2a47] text-[#1E1E1E] font-black text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? 'Resetting...' : 'Create New Password'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ─── SUCCESS STEP ─── */}
                {step === 'success' && (
                    <div className="text-center animate-in zoom-in duration-500">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-12 h-12 text-emerald-500" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-black text-gray-900 mb-2">Password Reset!</h1>
                        <p className="text-sm text-gray-400 font-medium mb-8">
                            Your password has been changed successfully. You can now log in with your new credentials.
                        </p>

                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-4 bg-[#29FE29] hover:bg-[#1a2a47] text-[#1E1E1E] font-black text-base rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.95]"
                        >
                            Go to Login →
                        </button>
                    </div>
                )}

                {/* Bottom Link */}
                {step === 'email' && (
                    <div className="mt-8 text-center border-t border-gray-100 pt-6">
                        <p className="text-gray-400 font-medium text-sm">
                            Remember your password?{' '}
                            <Link to="/login" className="text-[#29FE29] font-bold hover:underline">Log in</Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;

