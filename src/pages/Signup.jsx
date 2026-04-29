// src/pages/Signup.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, User, Phone } from 'lucide-react';
import { supabase } from '../supabaseClient';
import useAuth from '../hooks/useAuth';

const LANDMARKS = [
    {
        image: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
        city: 'Arizona',
        name: 'Grand Canyon',
        coords: '36.0998° N, 112.1125° W',
    },
    {
        image: 'https://images.unsplash.com/photo-1501466044931-62695aada8e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
        city: 'Washington, DC',
        name: 'Washington Monument',
        coords: '38.8895° N, 77.0353° W',
    },
    {
        image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
        city: 'Chicago, Illinois',
        name: 'The Skyline',
        coords: '41.8827° N, 87.6233° W',
    },
    {
        image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80',
        city: 'New York',
        name: 'Times Square',
        coords: '40.7580° N, 73.9855° W',
    },
];

// ─── OTP Input ─────────────────────────────────────────────────────────────────
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', margin: '24px 0', flexWrap: 'nowrap' }}>
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
                    className="otp-box"
                    style={{
                        width: 'clamp(36px, 12vw, 44px)',
                        height: 'clamp(44px, 13vw, 52px)',
                        textAlign: 'center',
                        fontSize: 'clamp(18px, 5vw, 22px)',
                        fontWeight: 800,
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderBottom: `2px solid ${digits[idx] ? '#2C76FF' : '#d1d5db'}`,
                        background: 'transparent',
                        outline: 'none',
                        color: digits[idx] ? '#1a1a2e' : '#9ca3af',
                        opacity: disabled ? 0.5 : 1,
                        cursor: disabled ? 'not-allowed' : 'text',
                        caretColor: '#2C76FF',
                        transition: 'border-color 0.2s',
                        padding: '4px 0',
                        minWidth: 0,
                    }}
                />
            ))}
        </div>
    );
};

// ─── Country codes ─────────────────────────────────────────────────────────────
const COUNTRY_CODES = [
    { code: '+1', country: 'US' }, { code: '+44', country: 'UK' },
    { code: '+91', country: 'India' }, { code: '+61', country: 'AU' },
    { code: '+49', country: 'DE' }, { code: '+33', country: 'FR' },
    { code: '+81', country: 'JP' }, { code: '+86', country: 'CN' },
];

// ─── Landmark panel ────────────────────────────────────────────────────────────
const LandmarkPanel = ({ idx, setIdx, mobile }) => (
    <div
        className={mobile ? 'signup-landmark-mobile' : 'signup-landmark-panel shrink-0'}
        style={mobile
            ? { position: 'relative', width: '100%', overflow: 'hidden', flexShrink: 0 }
            : { width: '46%', position: 'sticky', top: 0, height: '100vh', minHeight: '100vh', overflow: 'hidden', flexShrink: 0 }
        }
    >
        {LANDMARKS.map((lm, i) => (
            <div
                key={i}
                style={{
                    position: 'absolute', inset: 0,
                    transition: 'opacity 1s ease',
                    opacity: idx === i ? 1 : 0,
                    zIndex: idx === i ? 1 : 0,
                }}
            >
                <img
                    src={lm.image}
                    alt={lm.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: mobile ? 16 : 32,
                    left: mobile ? 16 : 32,
                    color: 'white',
                    zIndex: 10,
                }}>
                    <p style={{ fontSize: mobile ? 10 : 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{lm.city}</p>
                    <h3 style={{ fontSize: mobile ? 16 : 22, fontWeight: 900, marginBottom: 2, lineHeight: 1.2 }}>{lm.name}</h3>
                    <p style={{ fontSize: mobile ? 10 : 11, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{lm.coords}</p>
                </div>
            </div>
        ))}
        {/* Progress dots */}
        <div style={{
            position: 'absolute',
            bottom: mobile ? 16 : 32,
            right: mobile ? 16 : 32,
            display: 'flex',
            gap: 6,
            zIndex: 10,
        }}>
            {LANDMARKS.map((_, i) => (
                <button
                    key={i}
                    onClick={() => setIdx(i)}
                    style={{
                        height: 6,
                        width: idx === i ? 20 : 6,
                        borderRadius: 3,
                        background: idx === i ? 'white' : 'rgba(255,255,255,0.4)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        padding: 0,
                    }}
                />
            ))}
        </div>
    </div>
);

// ─── Main Signup ───────────────────────────────────────────────────────────────
const Signup = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && user) {
            navigate('/app', { replace: true });
        }
    }, [user, authLoading, navigate]);

    const [step, setStep] = useState('email'); // 'email' | 'otp' | 'details' | 'success'
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', mobileNumber: '',
        countryCode: '+1', promoCode: '', experience: '',
    });
    const [otpToken, setOtpToken] = useState(''); // stateless HMAC token from server
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({ firstName: '', lastName: '', mobileNumber: '' });
    const [resendCooldown, setResendCooldown] = useState(0);
    const [landmarkIdx, setLandmarkIdx] = useState(0);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Slideshow
    useEffect(() => {
        const t = setInterval(() => setLandmarkIdx((i) => (i + 1) % LANDMARKS.length), 5000);
        return () => clearInterval(t);
    }, []);

    // Resend countdown
    useEffect(() => {
        if (resendCooldown > 0) {
            const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [resendCooldown]);

    // ── Helpers ────────────────────────────────────────────────────────────────
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

    // ── Step 1: Send OTP via edge function ──────────────────────────────────────
    const handleSendOtp = async (e) => {
        e?.preventDefault();
        setError('');
        if (!email) { setError('Please enter your email address.'); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) { setError('Please enter a valid email address.'); return; }

        setLoading(true);
        try {
            const result = await callEdgeFn('send-otp-email', { email });
            if (!result.success) throw new Error(result.error || 'Failed to send OTP');
            setOtpToken(result.token); // store HMAC token (no DB needed)
            setStep('otp');
            setOtp('');
            setResendCooldown(60);
        } catch (err) {
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
    const handleVerifyOtp = async () => {
        if (otp.length < 6 || loading) return;
        setError('');
        setLoading(true);
        try {
            // Pass token (stateless — server verifies HMAC, no DB lookup)
            const result = await callEdgeFn('verify-otp-email', { email, otp, token: otpToken });
            if (!result.success) throw new Error(result.error || 'Invalid OTP');
            setStep('details');
        } catch (err) {
            setError(err.message || 'Invalid code. Please try again.');
            setOtp('');
        } finally {
            setLoading(false);
        }
    };

    // Auto-verify when all 6 digits entered
    useEffect(() => {
        if (otp.length === 6 && step === 'otp') handleVerifyOtp();
    }, [otp]);

    // ── Step 3: Complete signup via edge function ────────────────────────────────
    const handleCompleteProfile = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.firstName || !formData.lastName || !formData.mobileNumber) {
            setError('Please fill in all required fields.'); return;
        }
        setLoading(true);
        try {
            // 1. Create auth user + profile
            const result = await callEdgeFn('complete-signup', {
                email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                mobileNumber: formData.mobileNumber,
                countryCode: formData.countryCode,
                promoCode: formData.promoCode,
                experience: formData.experience,
            });
            if (!result.success) throw new Error(result.error || 'Signup failed');

            // 2. Send welcome email with credentials
            await callEdgeFn('send-welcome-email', {
                email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                password: result.password,
            }).catch(() => {/* non-fatal */ });

            setStep('success');
        } catch (err) {
            setError(err.message || 'Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Google OAuth ─────────────────────────────────────────────────────────────
    const handleGoogleSignIn = async () => {
        setGoogleLoading(true); setError('');
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        prompt: 'select_account',
                    },
                },
            });
            if (error) throw error;
        } catch (err) {
            setError(err.message || 'Google sign-in failed.');
            setGoogleLoading(false);
        }
    };

    // ── Resend OTP ───────────────────────────────────────────────────────────────
    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setOtp(''); setError('');
        await handleSendOtp();
    };

    // ── Spinner button helper ─────────────────────────────────────────────────────
    const PurpleBtn = ({ children, onClick, type = 'button', disabled }) => (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{
                width: '100%',
                padding: '12px 0',
                background: disabled ? '#a0a0a0' : '#78EB54',
                color: 'white',
                fontWeight: 700,
                fontSize: 14,
                borderRadius: 16,
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(120,235,84,0.3)',
                transition: 'all 0.2s',
                opacity: disabled ? 0.6 : 1,
            }}
        >
            {children}
        </button>
    );

    const Spinner = () => (
        <div style={{
            width: 16, height: 16,
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
        }} />
    );

    // ── Render ────────────────────────────────────────────────────────────────────
    return (
        <div className="signup-page-root">
            {/* Responsive styles injected inline */}
            <style>{`
                /* ── Mobile: stack vertically ── */
                .signup-page-root {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: row;
                }
                .signup-landmark-mobile {
                    display: none;
                }
                @media (max-width: 767px) {
                    .signup-page-root {
                        flex-direction: column;
                    }
                    /* show mobile banner, hide desktop side panel */
                    .signup-landmark-mobile {
                        display: block !important;
                        height: 42vw;
                        min-height: 180px;
                        max-height: 300px;
                        width: 100%;
                        flex-shrink: 0;
                    }
                    .signup-landmark-panel {
                        display: none !important;
                    }
                    .signup-left-panel {
                        padding-left: 20px !important;
                        padding-right: 20px !important;
                        padding-top: 32px !important;
                        padding-bottom: 40px !important;
                        justify-content: flex-start !important;
                    }
                    .signup-inner {
                        max-width: 100% !important;
                    }
                }
                /* ── Tablet ── */
                @media (min-width: 768px) and (max-width: 1023px) {
                    .signup-landmark-panel {
                        width: 40% !important;
                    }
                    .signup-left-panel {
                        padding-left: 28px !important;
                        padding-right: 28px !important;
                    }
                }
            `}</style>

            {/* MOBILE-ONLY top image banner */}
            <LandmarkPanel idx={landmarkIdx} setIdx={setLandmarkIdx} mobile={true} />

            {/* LEFT PANEL (form) */}
            <div className="signup-left-panel flex-1 flex flex-col items-center justify-center px-8 py-12 bg-white relative min-w-0">

                {/* Back button */}
                {(step === 'otp' || step === 'details') && (
                    <button
                        onClick={() => { setStep(step === 'otp' ? 'email' : 'otp'); setError(''); setOtp(''); }}
                        style={{
                            position: 'absolute',
                            top: 24,
                            left: 24,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#9ca3af',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: 8,
                        }}
                    >
                        <ArrowLeft size={15} /> Back
                    </button>
                )}

                <div className="signup-inner w-full max-w-sm">

                    {/* Logo */}
                    <div className="flex justify-center mb-10">
                        <Link to="/" className="inline-flex items-center gap-3 group">
                            <div className="relative">
                                <img 
                                    src="https://res.cloudinary.com/dpuziwnvl/image/upload/v1751357541/apply_wizz_logo_hrvtmm.jpg" 
                                    alt="Apply Wizz" 
                                    className="w-10 h-10 rounded-xl object-contain shadow-lg"
                                />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-xl font-bold text-[#1E1E1E] tracking-tight leading-none">Career</span>
                                <span className="text-xl font-bold text-[#2C76FF] tracking-tight leading-none">Partner</span>
                            </div>
                        </Link>
                    </div>

                    {/* ─── EMAIL STEP ─── */}
                    {step === 'email' && (
                        <div>
                            <h1 className="text-2xl font-black text-[#1E1E1E] text-center mb-1">Let's verify your email</h1>
                            <p className="text-sm text-[#1E1E1E]/40 text-center mb-8 font-medium">
                                Enter email you use for job applications
                            </p>

                            {/* Google Sign In */}
                            <button
                                onClick={handleGoogleSignIn}
                                disabled={googleLoading || loading}
                                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-2xl
                  hover:bg-gray-50 transition-all mb-5 font-semibold text-[#1E1E1E] text-sm shadow-sm"
                            >
                                {googleLoading
                                    ? <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    : <svg viewBox="0 0 24 24" width="20" height="20">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                }
                                Continue with Google
                            </button>

                            <div className="relative mb-5">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                                <div className="relative flex justify-center text-xs text-[#1E1E1E]/40 font-medium">
                                    <span className="bg-white px-3">or continue with email</span>
                                </div>
                            </div>

                            <form onSubmit={handleSendOtp} className="space-y-4">
                                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 focus-within:border-[#2C76FF]/40 focus-within:ring-1 focus-within:ring-[#2C76FF]/20 transition-all">
                                    <Mail size={17} className="text-[#1E1E1E]/40 shrink-0" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email address"
                                        className="flex-1 bg-transparent text-sm font-medium text-[#1E1E1E] outline-none placeholder:text-[#1E1E1E]/40"
                                        autoComplete="email"
                                        required
                                    />
                                </div>

                                {error && <p className="text-red-500 text-xs font-semibold text-center">{error}</p>}

                                <PurpleBtn type="submit" disabled={loading}>
                                    {loading ? <><Spinner /> Sending...</> : 'Continue'}
                                </PurpleBtn>
                            </form>

                            <p className="text-center text-sm text-[#1E1E1E]/40 mt-8 font-medium">
                                Already have an account?{' '}
                                <Link to="/login" className="text-[#2C76FF] font-bold hover:underline">Log in</Link>
                            </p>
                        </div>
                    )}

                    {/* ─── OTP STEP ─── */}
                    {step === 'otp' && (
                        <div>
                            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', textAlign: 'center', marginBottom: 20 }}>
                                Enter your verification code
                            </h1>

                            {/* Email icon */}
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    background: '#f9fafb', border: '1px solid #f0f0f0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Mail size={20} style={{ color: '#9ca3af' }} />
                                </div>
                            </div>

                            <p style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', textAlign: 'center', marginBottom: 4 }}>
                                We've emailed <span style={{ color: '#2C76FF' }}>{email}</span>
                            </p>
                            <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginBottom: 8, fontWeight: 500 }}>
                                Check your inbox or spam folder
                            </p>

                            {/* OTP boxes */}
                            <OtpInput value={otp} onChange={setOtp} disabled={loading} />

                            {error && (
                                <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>
                                    {error}
                                </p>
                            )}

                            {loading && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                                    <div style={{
                                        width: 20, height: 20,
                                        border: '2px solid #e5e7eb',
                                        borderTopColor: '#2C76FF',
                                        borderRadius: '50%',
                                        animation: 'spin 0.7s linear infinite',
                                    }} />
                                </div>
                            )}

                            {/* Resend / wrong email links */}
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginBottom: 6 }}>
                                    Used the wrong email?{' '}
                                    <button
                                        onClick={() => { setStep('email'); setError(''); setOtp(''); }}
                                        style={{ color: '#2C76FF', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
                                    >
                                        Update email
                                    </button>
                                </p>
                                <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
                                    Didn't get a code?{' '}
                                    <button
                                        onClick={handleResend}
                                        disabled={resendCooldown > 0}
                                        style={{
                                            color: resendCooldown > 0 ? '#d1d5db' : '#2C76FF',
                                            fontWeight: 700,
                                            background: 'none',
                                            border: 'none',
                                            cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                                            fontSize: 12,
                                        }}
                                    >
                                        {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend'}
                                    </button>
                                </p>
                            </div>

                            <PurpleBtn onClick={handleVerifyOtp} disabled={otp.length < 6 || loading}>
                                {loading ? <><Spinner /> Verifying...</> : 'Continue →'}
                            </PurpleBtn>
                        </div>
                    )}

                    {/* ─── DETAILS STEP ─── */}
                    {step === 'details' && (
                        <div>
                            <h1 className="text-2xl font-black text-[#1E1E1E] text-center mb-1">Complete your profile</h1>
                            <p className="text-sm text-[#1E1E1E]/40 text-center mb-6 font-medium">A few more details to get you started</p>

                            <form onSubmit={handleCompleteProfile} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { field: 'firstName', label: 'First Name', placeholder: 'John' },
                                        { field: 'lastName', label: 'Last Name', placeholder: 'Doe' },
                                    ].map(({ field, label, placeholder }) => (
                                        <div key={field}>
                                            <label className="block text-xs font-bold text-[#1E1E1E]/60 uppercase tracking-wider mb-1.5">{label} *</label>
                                            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 focus-within:border-[#2C76FF]/40">
                                                <User size={14} className="text-[#1E1E1E]/40 shrink-0" />
                                                <input
                                                    type="text"
                                                    value={formData[field]}
                                                    onChange={(e) => {
                                                        const raw = e.target.value;
                                                        if (/\d/.test(raw)) {
                                                            setFieldErrors(prev => ({ ...prev, [field]: 'Numbers not allowed in the name field' }));
                                                        } else {
                                                            setFieldErrors(prev => ({ ...prev, [field]: '' }));
                                                        }
                                                        const val = raw.replace(/[^a-zA-Z\s]/g, '');
                                                        setFormData((p) => ({ ...p, [field]: val }));
                                                    }}
                                                    placeholder={placeholder}
                                                    className="flex-1 bg-transparent text-sm font-medium text-[#1E1E1E] outline-none placeholder:text-[#1E1E1E]/40"
                                                    required
                                                />
                                            </div>
                                            {fieldErrors[field] && (
                                                <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-pulse">{fieldErrors[field]}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1E1E1E]/60 uppercase tracking-wider mb-1.5">Mobile Number *</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={formData.countryCode}
                                            onChange={(e) => setFormData((p) => ({ ...p, countryCode: e.target.value }))}
                                            className="bg-gray-50 border border-gray-100 rounded-2xl px-3 py-3 text-sm font-medium text-[#1E1E1E] outline-none"
                                        >
                                            {COUNTRY_CODES.map((c) => (
                                                <option key={c.code} value={c.code}>{c.country} ({c.code})</option>
                                            ))}
                                        </select>
                                        <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 focus-within:border-[#2C76FF]/40">
                                            <Phone size={14} className="text-[#1E1E1E]/40 shrink-0" />
                                            <input
                                                type="tel"
                                                value={formData.mobileNumber}
                                                onChange={(e) => {
                                                    const raw = e.target.value;
                                                    if (/[a-zA-Z]/.test(raw)) {
                                                        setFieldErrors(prev => ({ ...prev, mobileNumber: 'Alphabets not allowed' }));
                                                    } else {
                                                        setFieldErrors(prev => ({ ...prev, mobileNumber: '' }));
                                                    }
                                                    const val = raw.replace(/\D/g, '').slice(0, 10);
                                                    setFormData((p) => ({ ...p, mobileNumber: val }));
                                                }}
                                                maxLength={10}
                                                placeholder="1234567890"
                                                className="flex-1 bg-transparent text-sm font-medium text-[#1E1E1E] outline-none placeholder:text-[#1E1E1E]/40"
                                                required
                                            />
                                        </div>
                                    </div>
                                    {fieldErrors.mobileNumber && (
                                        <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold animate-pulse">{fieldErrors.mobileNumber}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1E1E1E]/60 uppercase tracking-wider mb-1.5">Experience Level</label>
                                    <select
                                        value={formData.experience}
                                        onChange={(e) => setFormData((p) => ({ ...p, experience: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium text-[#1E1E1E] outline-none"
                                    >
                                        <option value="">Select experience level</option>
                                        <option value="0-1">0–1 years</option>
                                        <option value="1-3">1–3 years</option>
                                        <option value="3-5">3–5 years</option>
                                        <option value="5-10">5–10 years</option>
                                        <option value="10+">10+ years</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1E1E1E]/60 uppercase tracking-wider mb-1.5">Promo Code (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.promoCode}
                                        onChange={(e) => setFormData((p) => ({ ...p, promoCode: e.target.value }))}
                                        placeholder="Enter promo code"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium text-[#1E1E1E] outline-none placeholder:text-[#1E1E1E]/40"
                                    />
                                </div>

                                {error && <p className="text-red-500 text-xs font-semibold text-center">{error}</p>}

                                <PurpleBtn type="submit" disabled={loading}>
                                    {loading ? <><Spinner /> Creating account...</> : 'Complete Sign Up'}
                                </PurpleBtn>
                            </form>
                        </div>
                    )}

                    {/* ─── SUCCESS STEP ─── */}
                    {step === 'success' && (
                        <div className="text-center">
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-[#78EB54]/10 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-12 h-12 text-[#78EB54]" />
                                </div>
                            </div>

                            <h1 className="text-2xl font-black text-[#1E1E1E] mb-3">You're all set! 🎉</h1>
                            <p className="text-sm text-[#1E1E1E]/60 font-medium mb-6">Your account has been created successfully.</p>

                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6 text-left">
                                <p className="text-sm text-blue-800 font-bold mb-2">📧 Check your inbox</p>
                                <p className="text-xs text-blue-600 font-medium leading-relaxed">
                                    We sent your login credentials to <strong>{email}</strong>.<br />
                                    Your default password is:{' '}
                                    <code className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-black">
                                        {formData.firstName}@123
                                    </code>
                                </p>
                                <p className="text-[11px] text-blue-400 mt-2">Change your password after logging in.</p>
                            </div>

                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-3 bg-[#2C76FF] hover:bg-[#1a2a47] text-white font-bold text-sm rounded-2xl
                  transition-all shadow-lg hover:shadow-xl active:scale-95"
                            >
                                Go to Login →
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL — hidden on mobile, visible on md+ */}
            <LandmarkPanel idx={landmarkIdx} setIdx={setLandmarkIdx} />
        </div>
    );
};

export default Signup;
