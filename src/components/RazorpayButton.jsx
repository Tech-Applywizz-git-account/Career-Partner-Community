import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const RazorpayButton = ({ amount = "39.99", onSuccess }) => {
    const { user, firstName, lastName, refresh } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Dynamically load razorpay script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const handlePayment = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("🚀 Opening Razorpay modal...");

            // 1. Create Order on Backend
            const { data: orderData, error: invokeError } = await supabase.functions.invoke('create-razorpay-order', {
                body: { amount, currency: 'USD' }
            });

            if (invokeError || orderData?.error) {
                throw new Error(invokeError?.message || orderData?.error || "Payment system unavailable.");
            }

            // 2. Open Razorpay Checkout Modal
            const options = {
                key: import.meta.env.VITE_RA_KEY_ID || 'rzp_live_SCjkNy569aq6F2',
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Career Partner",
                description: "Premium Subscription",
                order_id: orderData.id,
                prefill: {
                    name: `${firstName || ''} ${lastName || ''}`.trim() || 'User',
                    email: user?.email || '',
                    contact: user?.user_metadata?.mobile_number || ''
                },
                theme: { color: "#29FE29" },
                handler: async function (response) {
                    setLoading(true);
                    try {
                        const meta = user?.user_metadata || {};
                        const { data: captureData, error: captureError } = await supabase.functions.invoke('capture-razorpay-order', {
                            body: {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                amount,
                                currency: orderData.currency,
                                email: user?.email,
                                firstName: firstName || meta.first_name || meta.firstName || 'User',
                                lastName: lastName || meta.last_name || meta.lastName || '',
                                mobileNumber: meta.mobile_number || meta.mobileNumber || '',
                                countryCode: meta.country_code || meta.countryCode || '+1'
                            }
                        });

                        if (captureData?.success) {
                            setSuccess(true);
                            if (refresh) await refresh();
                            if (onSuccess) onSuccess(captureData);
                        } else {
                            throw new Error(captureData?.error || "Payment verification failed.");
                        }
                    } catch (err) {
                        setError(err.message);
                    } finally {
                        setLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (res) => {
                console.error("Payment failed inside browser:", res.error);
                // Note: The Webhook will catch this failure server-side and save the ID.
                setError(res.error.description);
            });
            rzp.open();

        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    // Auto-redirect to dashboard after 3 seconds on success
    useEffect(() => {
        let redirectTimeout;
        if (success) {
            redirectTimeout = setTimeout(() => {
                window.location.href = '/app';
            }, 3000);
        }
        return () => clearTimeout(redirectTimeout);
    }, [success]);

    if (success) {
        return (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                </div>
                <h3 className="text-2xl font-black text-emerald-900 mb-2">Payment Successful!</h3>
                <p className="text-emerald-700 font-bold mb-6">Your account has been upgraded. Redirecting you to the dashboard...</p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => window.location.href = '/app'}
                        className="px-8 py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all transform hover:scale-105"
                    >
                        Enter Dashboard Now →
                    </button>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest animate-pulse">
                        Redirecting in 3 seconds...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-start gap-3 animate-in slide-in-from-top-2 shadow-sm">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-1">Payment System Error</p>
                        <p className="text-sm text-red-600 font-bold">{error}</p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <Loader2 className="w-12 h-12 text-[#29FE29] animate-spin mb-4" />
                    <p className="text-[#29FE29] font-black text-lg">Processing Payment...</p>
                    <p className="text-gray-400 text-sm mt-1 font-bold">Please do not close this window</p>
                </div>
            ) : (
                <button
                    onClick={handlePayment}
                    className="w-full flex items-center justify-center py-4 bg-[#29FE29] hover:bg-[#e5a811] text-[#29FE29] text-lg font-black rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    Pay Now
                </button>
            )}
        </div>
    );
};

export default RazorpayButton;
