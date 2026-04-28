import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CreditCard, Calendar, CheckCircle2, AlertCircle, Loader2, DollarSign, ExternalLink } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const PaymentDetailsTab = () => {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) return;

        const fetchPayments = async () => {
            setLoading(true);
            try {
                const { data, error: fetchError } = await supabase
                    .from('payment_details')
                    .select('*')
                    .eq('email', user.email)
                    .order('time_of_payment', { ascending: false });

                if (fetchError) throw fetchError;
                setPayments(data || []);
            } catch (err) {
                console.error('Error fetching payments:', err);
                setError('Failed to load payment history.');
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [user]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-[#24385E] animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading payment history...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
            <div className="mb-8">
                <h2 className="text-2xl font-black text-[#24385E] mb-2 flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-[#FDB913]" />
                    Billing & Plan
                </h2>
                <p className="text-gray-500 font-medium">View your subscription history and manage payment details.</p>
            </div>

            {/* Current Plan Summary */}
            <div className="bg-[#24385E] rounded-3xl p-8 mb-10 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <span className="inline-block px-3 py-1 bg-[#FDB913] text-[#24385E] text-[10px] font-black uppercase tracking-widest rounded-full mb-3">Active Subscription</span>
                        <h3 className="text-3xl font-black mb-1">Premium Plan</h3>
                        <p className="text-white/70 font-bold">$39.99 / 6 Months</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                        <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-1">Upcoming Renewal</p>
                        <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-[#FDB913]" />
                            <span className="text-lg font-bold">
                                {payments.length > 0 ? (
                                    (() => {
                                        const d = new Date(payments[0].time_of_payment);
                                        d.setMonth(d.getMonth() + 6);
                                        return d.toLocaleDateString();
                                    })()
                                ) : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
                    <h4 className="text-sm font-black text-[#24385E] uppercase tracking-widest">Payment History</h4>
                </div>

                {error ? (
                    <div className="p-10 text-center">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-red-600 font-bold">{error}</p>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="p-20 text-center">
                        <CreditCard className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold">No payment records found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">ID</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                    <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p, i) => (
                                    <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-bold text-[#24385E]">{formatDate(p.time_of_payment)}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-xs font-medium text-gray-400 font-mono tracking-tight">{p.transaction_id || 'N/A'}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-1">
                                                <DollarSign size={14} className="text-[#24385E]" />
                                                <span className="text-sm font-black text-[#24385E]">{p.amount?.toFixed(2)}</span>
                                                <span className="text-[10px] font-black text-gray-400 ml-1">{p.currency}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                                                <CheckCircle2 size={14} />
                                                <span className="text-xs font-black uppercase tracking-wider">{p.status}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="mt-8 text-center p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-500 font-medium">
                    Questions about your billing? <a href="mailto:manasa@wagetrail.com" className="text-[#24385E] border-b border-[#24385E] hover:text-[#FDB913] hover:border-[#FDB913] transition-colors font-bold">Contact Support</a>
                </p>
            </div>
        </div>
    );
};

export default PaymentDetailsTab;
