import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

import useAuth from '../hooks/useAuth';

const RenewalPayment = ({ user, profile, onSuccess }) => {
    const { refresh } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [paypalLoading, setPaypalLoading] = useState(true);
    const [paypalReady, setPaypalReady] = useState(false);

    useEffect(() => {
        const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

        if (!clientId) {
            setError('PayPal Client ID is not configured.');
            setPaypalLoading(false);
            return;
        }

        if (window.paypal) {
            setPaypalReady(true);
            setPaypalLoading(false);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
        script.async = true;
        script.onload = () => {
            setPaypalReady(true);
            setPaypalLoading(false);
        };
        script.onerror = () => {
            setPaypalLoading(false);
            setError('Failed to load PayPal.');
        };
        document.body.appendChild(script);
    }, []);

    useEffect(() => {
        if (paypalReady) {
            renderButtons();
        }
    }, [paypalReady]);

    const renderButtons = () => {
        if (window.paypal && document.getElementById('paypal-renewal-button')) {
            window.paypal.Buttons({
                createOrder: async () => {
                    try {
                        const response = await fetch(
                            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-paypal-order`,
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                                },
                                body: JSON.stringify({
                                    amount: '30.00',
                                    currency: 'USD'
                                })
                            }
                        );
                        const data = await response.json();
                        return data.id;
                    } catch (err) {
                        setError('Failed to create order.');
                        throw err;
                    }
                },
                onApprove: async (data) => {
                    setLoading(true);
                    const now = new Date();
                    let paymentStatus = 'PENDING';

                    try {
                        console.log("💳 PayPal payment approved:", data.orderID);

                        // 1. Record payment attempt FIRST (with PENDING status)
                        const { data: paymentRecord, error: insertError } = await supabase
                            .from('payment_details')
                            .insert([{
                                email: profile.email,
                                transaction_id: data.orderID + '-RENEWAL',
                                order_id: data.orderID,
                                time_of_payment: now.toISOString(),
                                amount: 30.00,
                                currency: 'USD',
                                status: 'PENDING',
                                metadata: {
                                    isRenewal: true,
                                    payer_name: `${profile.firstName} ${profile.lastName}`,
                                    mobile: profile.phone
                                }
                            }])
                            .select()
                            .single();

                        if (insertError) {
                            console.error("❌ Failed to record payment:", insertError);
                        }

                        // 2. Calculate new expiry date (1 month from now)
                        const nextMonth = new Date(now);
                        nextMonth.setMonth(nextMonth.getMonth() + 1);
                        const expiryStr = nextMonth.toISOString();

                        // 3. Update Subscription End Date in Database
                        const { error: updateError } = await supabase
                            .from('profiles')
                            .update({ subscription_end_date: expiryStr })
                            .eq('id', user.id);

                        if (updateError) {
                            console.error("❌ Error updating subscription:", updateError);
                            paymentStatus = 'FAILED';
                            throw updateError;
                        }

                        console.log("✅ Subscription updated to:", expiryStr);
                        paymentStatus = 'COMPLETED';

                        // 4. Update payment status to COMPLETED
                        if (paymentRecord) {
                            await supabase
                                .from('payment_details')
                                .update({
                                    status: 'COMPLETED',
                                    metadata: {
                                        isRenewal: true,
                                        payer_name: `${profile.firstName} ${profile.lastName}`,
                                        mobile: profile.phone,
                                        calculated_expiry: expiryStr
                                    }
                                })
                                .eq('order_id', data.orderID);
                        }

                        // 5. Trigger Success Email via Edge Function
                        try {
                            await supabase.functions.invoke('payment-success-email', {
                                body: {
                                    to: profile.email,
                                    firstName: profile.firstName,
                                    transactionId: data.orderID,
                                    amount: '30.00',
                                    currency: 'USD',
                                    subscriptionStart: now.toISOString(),
                                    subscriptionEnd: expiryStr,
                                    timeOfPayment: now.toISOString()
                                }
                            });
                        } catch (emailError) {
                            console.error('⚠️ Email sending failed:', emailError);
                            // Don't throw - subscription is already updated
                        }

                        // 6. Refresh Auth State (clears cache)
                        await refresh();

                        console.log("🎉 Renewal completed successfully!");
                        onSuccess();
                    } catch (err) {
                        console.error("❌ Renewal error:", err);

                        // Update payment status to FAILED
                        if (paymentStatus === 'PENDING') {
                            await supabase
                                .from('payment_details')
                                .update({
                                    status: 'FAILED',
                                    metadata: {
                                        isRenewal: true,
                                        payer_name: `${profile.firstName} ${profile.lastName}`,
                                        mobile: profile.phone,
                                        error: err.message || 'Unknown error'
                                    }
                                })
                                .eq('order_id', data.orderID);
                        }

                        setError('Payment processing failed. Please contact support.');
                    } finally {
                        setLoading(false);
                    }
                }
            }).render('#paypal-renewal-button');
        }
    };

    return (
        <div className="w-full">
            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
            {paypalLoading && <div className="animate-pulse text-gray-400">Loading PayPal...</div>}
            <div id="paypal-renewal-button"></div>
            {loading && <div className="mt-4 text-sm text-blue-600 font-medium">Processing renewal...</div>}
        </div>
    );
};

export default RenewalPayment;
