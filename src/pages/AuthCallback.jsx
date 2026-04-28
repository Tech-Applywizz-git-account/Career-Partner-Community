// src/pages/AuthCallback.jsx
// Handles Google OAuth redirect and redirects to the correct page
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get the session after OAuth redirect
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Auth callback error:', error);
                    navigate('/login?error=auth_failed');
                    return;
                }

                if (session?.user) {
                    const user = session.user;
                    console.log('✅ OAuth callback successful for:', user.email);

                    // Check if profile exists for this user
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id, first_name')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (!profile) {
                        // New Google user — upsert basic profile from Google data
                        const fullName = user.user_metadata?.full_name || '';
                        const nameParts = fullName.split(' ');
                        const firstName = user.user_metadata?.given_name || nameParts[0] || '';
                        const lastName = user.user_metadata?.family_name || nameParts.slice(1).join(' ') || '';

                        await supabase.from('profiles').upsert({
                            id: user.id,
                            email: user.email,
                            first_name: firstName,
                            last_name: lastName,
                            mobile_number: '',
                            country_code: '+1',
                            role: 'user',
                            payment_status: 'pending',
                        }, { onConflict: 'id' });
                    }

                    // Redirect to dashboard
                    navigate('/app', { replace: true });
                } else {
                    navigate('/login');
                }
            } catch (err) {
                console.error('Callback exception:', err);
                navigate('/login');
            }
        };

        handleCallback();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-[#24385E] flex items-center justify-center">
            <div className="text-center text-white">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-[#FDB913]" />
                <p className="font-semibold">Completing sign in...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
