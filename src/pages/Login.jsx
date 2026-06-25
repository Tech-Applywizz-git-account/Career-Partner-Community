//src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabaseClient';
import useAuth from '../hooks/useAuth';

const Login = () => {
    const { user, loading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

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
                        <label htmlFor="email" className="block text-sm font-medium text-[#1E1E1E] mb-2">
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
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2C76FF] focus:border-transparent text-[#1E1E1E] font-normal placeholder:text-gray-400 bg-gray-50/50"
                                aria-label="Email address"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-[#1E1E1E] mb-2">
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
                                className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2C76FF] focus:border-transparent text-[#1E1E1E] font-normal placeholder:text-gray-400 bg-gray-50/50"
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
                            <Link to="/forgot-password" style={{ color: '#2C76FF' }} className="text-sm font-medium hover:underline transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
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
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 10px 20px rgba(120,235,84,0.3)',
                            marginTop: '24px',
                            transition: 'all 0.2s',
                            opacity: loading ? 0.7 : 1,
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
                {/* 
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="text-center">
                        <p className="text-[#1E1E1E] font-bold">
                            Don't have an account?{' '}
                            <Link to="/signup" style={{ color: '#2C76FF' }} className="font-black hover:underline transition-colors">
                                Sign up now
                            </Link>
                        </p>
                    </div>
                </div> */}
            </div>
        </div>
    );
};

export default Login;
