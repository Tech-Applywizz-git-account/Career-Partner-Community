
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import useAuth from '../hooks/useAuth';
import {
    CreditCard,
    Download,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    AlertCircle,
    Calendar,
    DollarSign,
    Receipt
} from 'lucide-react';

const BillingTab = () => {
    const { user, role } = useAuth(); // Get role from hook
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is admin
    const isAdmin = role === 'admin';

    const [stats, setStats] = useState({
        totalSpent: 0,
        totalTransactions: 0,
        successfulPayments: 0,
        lastPaymentDate: null
    });

    useEffect(() => {
        if (user) {
            fetchPayments();
        }
    }, [user, role]); // Re-fetch if role changes

    const fetchPayments = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('📡 Fetching payments for:', user.email);

            let query = supabase
                .from('payment_details')
                .select('*', { count: 'exact' })
                .order('time_of_payment', { ascending: false });

            // If NOT admin, filter by own email
            if (!isAdmin) {
                query = query.ilike('email', user.email);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                console.error('❌ Supabase Error:', fetchError);
                throw fetchError;
            }

            console.log('✅ Payments Data Received:', data);

            if (!data || data.length === 0) {
                console.warn('⚠️ No payment records found for this email.');
            }

            setPayments(data || []);

            // Calculate statistics
            if (data && data.length > 0) {
                const totalAmount = data
                    .filter(p => p.status === 'COMPLETED' || p.status === 'completed')
                    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

                console.log('💰 Total Spent Calculated:', totalAmount);

                const successfulWithFilter = data.filter(
                    p => p.status === 'COMPLETED' || p.status === 'completed'
                ).length;

                setStats({
                    totalSpent: totalAmount.toFixed(2),
                    totalTransactions: data.length,
                    successfulPayments: successfulWithFilter,
                    lastPaymentDate: data[0].time_of_payment
                });
            } else {
                setStats({
                    totalSpent: "0.00",
                    totalTransactions: 0,
                    successfulPayments: 0,
                    lastPaymentDate: null
                });
            }
        } catch (err) {
            console.error('❌ Error fetching payments:', err);
            setError(err.message || 'Failed to load payment history');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusUpper = status?.toUpperCase();

        if (statusUpper === 'COMPLETED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Completed
                </span>
            );
        } else if (statusUpper === 'PENDING') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                    Pending
                </span>
            );
        } else if (statusUpper === 'FAILED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    <XCircle className="w-3.5 h-3.5" />
                    Failed
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                    {status}
                </span>
            );
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount, currency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-gray-900 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading billing information...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-red-800 font-semibold mb-1">Error Loading Billing Information</h3>
                    <p className="text-red-600 text-sm">{error}</p>
                    <button
                        onClick={fetchPayments}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-gray-900" />
                    {isAdmin ? 'Platform Revenue & Billing' : 'Billing & Payments'}
                </h2>
                <p className="text-gray-600 mt-1">
                    {isAdmin
                        ? 'Monitor all user payments and subscription revenue'
                        : 'View your payment history and subscription details'}
                </p>
            </div>

            {/* Statistics Cards */}
            {isAdmin ? (
                // Admin View - Show all 4 stats cards
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Revenue */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-700 font-medium mb-1">Total Revenue</p>
                                <p className="text-2xl font-bold text-green-900">
                                    ${stats.totalSpent}
                                </p>
                            </div>
                            <DollarSign className="w-10 h-10 text-green-600 opacity-50" />
                        </div>
                    </div>

                    {/* Total Transactions */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-700 font-medium mb-1">Total Transactions</p>
                                <p className="text-2xl font-bold text-blue-900">
                                    {stats.totalTransactions}
                                </p>
                            </div>
                            <Receipt className="w-10 h-10 text-blue-600 opacity-50" />
                        </div>
                    </div>

                    {/* Successful Payments */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-700 font-medium mb-1">Successful</p>
                                <p className="text-2xl font-bold text-purple-900">
                                    {stats.successfulPayments}
                                </p>
                            </div>
                            <CheckCircle className="w-10 h-10 text-purple-600 opacity-50" />
                        </div>
                    </div>

                    {/* Last Payment */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-700 font-medium mb-1">Last Payment</p>
                                <p className="text-sm font-bold text-gray-900">
                                    {stats.lastPaymentDate
                                        ? new Date(stats.lastPaymentDate).toLocaleDateString()
                                        : 'N/A'}
                                </p>
                            </div>
                            <Calendar className="w-10 h-10 text-gray-600 opacity-50" />
                        </div>
                    </div>
                </div>
            ) : (
                // User View - Show only Paid Date and End Date
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Paid Date */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-700 font-medium mb-1">Paid Date</p>
                                <p className="text-2xl font-bold text-green-900">
                                    {stats.lastPaymentDate
                                        ? new Date(stats.lastPaymentDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })
                                        : 'N/A'}
                                </p>
                            </div>
                            <Calendar className="w-10 h-10 text-green-600 opacity-50" />
                        </div>
                    </div>

                    {/* End Date */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-700 font-medium mb-1">End Date</p>
                                <p className="text-2xl font-bold text-blue-900">
                                    {stats.lastPaymentDate
                                        ? (() => {
                                            const paidDate = new Date(stats.lastPaymentDate);
                                            const endDate = new Date(paidDate);
                                            endDate.setMonth(endDate.getMonth() + 1); // Add 1 month
                                            return endDate.toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            });
                                        })()
                                        : 'N/A'}
                                </p>
                            </div>
                            <Calendar className="w-10 h-10 text-blue-600 opacity-50" />
                        </div>
                    </div>
                </div>
            )}

            {/* Payment History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-900">
                            {isAdmin ? 'All User Transactions' : 'Payment History'}
                        </h3>
                        {/* {payments.length > 0 && (
                            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        )} */}
                    </div>
                </div>

                {/* Transactions Table */}
                {payments.length === 0 ? (
                    <div className="p-12 text-center">
                        <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No payments found</h3>
                        <p className="text-gray-500">
                            {isAdmin ? 'No user payments recorded yet.' : 'Your payment transactions will appear here.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    {isAdmin && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User Email
                                        </th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Transaction / Order
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(payment.time_of_payment)}
                                            </div>
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-800">
                                                    {payment.email}
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-mono text-gray-600">
                                                {payment.transaction_id}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {payment.order_id}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {formatCurrency(payment.amount, payment.currency)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(payment.status)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Subscription Information */}
            {!isAdmin && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Plan
                            </label>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-lg font-semibold text-gray-900">Premium Access</p>
                                <p className="text-sm text-gray-600 mt-1">Full access to all job listings</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Billing Email
                            </label>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm font-mono text-gray-900">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-blue-900 font-semibold mb-1">Need Help?</h4>
                        <p className="text-blue-700 text-sm">
                            If you have any questions about your billing or need a refund, please contact our support team at{' '}
                            <a href="mailto:manasa@wagetrail.com" className="underline font-medium">
                                manasa@wagetrail.com
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingTab;
