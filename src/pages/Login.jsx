//src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Zap, User, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';
import useAuth from '../hooks/useAuth';

// ─── Dummy Users (for demo / dev use only) ───────────────────────────────────
const DUMMY_USERS = [
    {
        label: 'Demo User',
        icon: 'user',
        email: 'demo@wagetrail.com',
        password: 'demo1234',
        role: 'user',
        firstName: 'Demo',
        lastName: 'User',
        redirectTo: '/app',
    },
    {
        label: 'Demo Admin',
        icon: 'admin',
        email: 'admin@wagetrail.com',
        password: 'admin1234',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        redirectTo: '/admin',
    },
];

const Login = () => {
    const { user, loading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [dummyLoading, setDummyLoading] = useState(null); // label of dummy being loaded

    useEffect(() => {
        if (!authLoading && user) {
            navigate('/app', { replace: true });
        }
    }, [user, authLoading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        console.log("🔄 Login attempt started for email:", email);

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) throw authError;
            if (!authData?.user) throw new Error("Authentication failed.");

            console.log("✅ Login successful! User:", authData.user.email);
            navigate("/app", { replace: true });

        } catch (err) {
            const isNetworkError = err.message?.includes('fetch') || !window.navigator.onLine;
            if (!isNetworkError) {
                console.error("💥 Login error:", err);
            }
            setError(err.message || "Login failed. Try again.");
            // Only sign out if we genuinely had an auth error, and do it quietly
            if (!isNetworkError) {
                supabase.auth.signOut().catch(() => { });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDummyLogin = (dummy) => {
        setDummyLoading(dummy.label);
        // Store fake session so useAuth picks it up immediately
        const fakeUser = {
            id: `dummy-${dummy.role}`,
            email: dummy.email,
            user_metadata: { full_name: `${dummy.firstName} ${dummy.lastName}` },
        };
        localStorage.setItem('dummy_session', JSON.stringify(fakeUser));
        localStorage.setItem('userRole', dummy.role);
        localStorage.setItem('userFirstName', dummy.firstName);
        localStorage.setItem('userLastName', dummy.lastName);
        // Full page reload so AuthProvider re-mounts and reads dummy_session fresh
        setTimeout(() => {
            setDummyLoading(null);
            window.location.href = dummy.redirectTo;
        }, 600);
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError('');
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

    return (
        <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#29FE29]/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#2C76FF]/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl"></div>

            <div className="relative bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 max-w-md w-full p-8 md:p-10">
                {/* Logo */}
                <div className="text-center mb-8">
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

                <h1 className="text-2xl font-black text-[#1E1E1E] mb-2 text-center">
                    Welcome Back
                </h1>
                <p className="text-gray-500 text-sm font-medium text-center mb-8">
                    Login to access your dashboard
                </p>

                {/* Google Sign In */}
                <button
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading || loading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all mb-5 font-bold text-[#1E1E1E] text-sm shadow-sm"
                >
                    {googleLoading ? (
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    )}
                    Continue with Google
                </button>

                <div className="relative mb-5">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-100" />
                    </div>
                    <div className="relative flex justify-center text-xs text-gray-400 font-bold">
                        <span className="bg-white px-3">or sign in with email</span>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                        <p className="text-red-600 font-bold text-sm text-center">
                            {error}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-xs font-black text-[#1E1E1E] uppercase tracking-wider mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                placeholder="email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2C76FF] focus:border-transparent text-[#1E1E1E] font-bold placeholder:text-gray-300 bg-gray-50/50"
                                aria-label="Email address"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-xs font-black text-[#1E1E1E] uppercase tracking-wider mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2C76FF] focus:border-transparent text-[#1E1E1E] font-bold placeholder:text-gray-300 bg-gray-50/50"
                                aria-label="Password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center focus:outline-none"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-[#1E1E1E] transition-colors" />
                                ) : (
                                    <Eye className="h-5 w-5 text-gray-400 hover:text-[#1E1E1E] transition-colors" />
                                )}
                            </button>
                        </div>
                        <div className="mt-2.5 text-right">
                            <Link to="/forgot-password" style={{ color: '#2C76FF' }} className="text-sm font-bold hover:underline transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || googleLoading}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '16px 0',
                            backgroundColor: '#78EB54',
                            color: '#FFFFFF',
                            fontWeight: 900,
                            fontSize: '16px',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: (loading || googleLoading) ? 'not-allowed' : 'pointer',
                            boxShadow: '0 10px 20px rgba(120,235,84,0.3)',
                            marginTop: '24px',
                            transition: 'all 0.2s',
                            opacity: (loading || googleLoading) ? 0.7 : 1,
                            zIndex: 10,
                            position: 'relative'
                        }}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Logging in...</span>
                            </>
                        ) : (
                            <span>Login</span>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="text-center">
                        <p className="text-[#1E1E1E] font-bold">
                            Don't have an account?{' '}
                            <Link to="/signup" style={{ color: '#2C76FF' }} className="font-black hover:underline transition-colors">
                                Sign up now
                            </Link>
                        </p>
                    </div>
                </div>

                {/* ── Demo / Dummy Logins ── */}
                <div className="mt-6 rounded-2xl bg-[#78EB54]/5 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap size={14} style={{ color: '#1E1E1E' }} />
                        <span className="text-xs font-black text-[#1E1E1E] uppercase tracking-wider">Quick Demo Login</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {DUMMY_USERS.map((dummy) => (
                            <button
                                key={dummy.label}
                                onClick={() => handleDummyLogin(dummy)}
                                disabled={!!dummyLoading || loading || googleLoading}
                                className={`relative flex flex-col items-center gap-2 py-3 px-2 rounded-xl border border-gray-200 transition-all font-bold text-sm bg-white text-[#1E1E1E] hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                                {dummyLoading === dummy.label ? (
                                    <div className="w-5 h-5 border-2 border-[#1E1E1E] border-t-transparent rounded-full animate-spin" />
                                ) : dummy.role === 'admin' ? (
                                    <ShieldCheck size={20} />
                                ) : (
                                    <User size={20} />
                                )}
                                <span>{dummy.label}</span>
                                <span className="text-[10px] opacity-60 font-normal">{dummy.email}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
