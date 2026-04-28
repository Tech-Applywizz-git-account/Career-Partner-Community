import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import JobCard from './JobCard';
import useAuth from '../hooks/useAuth';
import { Heart, Loader2, AlertCircle, Trash2 } from 'lucide-react';

const SavedJobsTab = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [savedJobs, setSavedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingAll, setDeletingAll] = useState(false);

    // Fetch saved jobs
    const fetchSavedJobs = async () => {
        if (!user) {
            setSavedJobs([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('📡 Fetching saved jobs for user:', user.id);

            const { data, error: fetchError } = await supabase
                .from('saved_jobs')
                .select('*')
                .eq('user_id', user.id)
                .order('saved_at', { ascending: false });

            if (fetchError) throw fetchError;

            // Fetch filing counts for these companies to show on cards
            const companyNames = [...new Set(data.map(item => item.job_data?.company))].filter(Boolean);
            if (companyNames.length > 0) {
                const { data: filingsData } = await supabase
                    .from('h1b_sponsor_finder')
                    .select('Company, "LCA Filings"')
                    .or(companyNames.map(n => `Company.ilike.%${n}%`).join(','));

                if (filingsData) {
                    const normalize = (name) => {
                        if (!name) return '';
                        let n = name.toLowerCase()
                            .replace(/[\.,]/g, ' ')
                            .replace(/\b(inc|llc|corp|ltd|co|services|com|systems|technologies|group|holdings|usa|us|intl|international|solutions|aws|related|web|tech|software|management|financial|insurance|banking|health|healthcare|travel|company)\b/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();
                        // Support broad matching for major entities to ensure filings are found
                        if (n.includes('amazon')) return 'amazon';
                        if (n.includes('google') || n.includes('alphabet')) return 'google';
                        if (n.includes('meta') || n.includes('facebook')) return 'meta';
                        if (n.includes('microsoft')) return 'microsoft';
                        if (n.includes('apple')) return 'apple';
                        return n;
                    };
                    const filingMap = {};
                    filingsData.forEach(f => {
                        const norm = normalize(f.Company);
                        filingMap[f.Company.toLowerCase()] = parseCount(f["LCA Filings"]);
                        if (norm && (!filingMap[norm] || filingMap[norm] < parseCount(f["LCA Filings"]))) {
                            filingMap[norm] = parseCount(f["LCA Filings"]);
                        }
                    });
                    const filingKeys = Object.keys(filingMap);

                    const parseCount = (val) => {
                        if (typeof val === 'number') return val;
                        if (!val) return 0;
                        return parseInt(String(val).replace(/,/g, '')) || 0;
                    };

                    data.forEach(item => {
                        const job = item.job_data;
                        if (!job) return;
                        const jLower = job.company?.toLowerCase() || '';
                        const jNorm = normalize(job.company);
                        let count = filingMap[jLower] || filingMap[jNorm] || 0;
                        if (count === 0 && jNorm) {
                            const bestKey = filingKeys.find(k => k.includes(jNorm) || jNorm.includes(k));
                            if (bestKey) count = filingMap[bestKey];
                        }
                        job.lca_filings = parseCount(count);
                    });
                }
            }

            console.log('✅ Saved jobs fetched:', data?.length || 0);
            setSavedJobs(data || []);
        } catch (err) {
            console.error('❌ Error fetching saved jobs:', err);
            setError(err.message || 'Failed to load saved jobs');
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount and when user changes
    useEffect(() => {
        fetchSavedJobs();
    }, [user]);

    // Handle unsave (remove from saved jobs)
    const handleUnsave = (jobId, isSaved) => {
        if (!isSaved) {
            // Job was unsaved, remove it from the list
            setSavedJobs(prev => prev.filter(job => job.job_id !== jobId));
        }
    };

    // Delete all saved jobs
    const handleDeleteAll = async () => {
        if (!user) return;

        const confirmed = window.confirm(
            `Are you sure you want to remove all ${savedJobs.length} saved jobs?`
        );

        if (!confirmed) return;

        setDeletingAll(true);

        try {
            const { error } = await supabase
                .from('saved_jobs')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;

            setSavedJobs([]);
            console.log('✅ All saved jobs deleted');
        } catch (err) {
            console.error('❌ Error deleting all saved jobs:', err);
            alert('Failed to delete saved jobs. Please try again.');
        } finally {
            setDeletingAll(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-gray-900 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading saved jobs...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-red-800 font-semibold mb-1">Error Loading Saved Jobs</h3>
                    <p className="text-red-600 text-sm">{error}</p>
                    <button
                        onClick={fetchSavedJobs}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Empty state
    if (savedJobs.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Heart className="w-8 h-8 text-red-500" />
                        Saved Jobs
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Jobs you've saved will appear here
                    </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-12 text-center border border-gray-200">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No saved jobs yet</h3>
                    <p className="text-gray-500 mb-4">
                        Start browsing jobs and click the heart icon to save them for later!
                    </p>
                    <button
                        onClick={() => navigate('/jobs')}
                        className="inline-block px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        Browse Jobs
                    </button>
                </div>
            </div>
        );
    }

    // Jobs list
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Heart className="w-8 h-8 text-red-500 fill-current" />
                        Saved Jobs
                    </h2>
                    <p className="text-gray-600 mt-1">
                        You have {savedJobs.length} saved job{savedJobs.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Delete All Button */}
                {savedJobs.length > 0 && (
                    <button
                        onClick={handleDeleteAll}
                        disabled={deletingAll}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {deletingAll ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Removing...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                Remove All
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Saved Jobs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {savedJobs.map((savedJob) => (
                    <JobCard
                        key={savedJob.id}
                        job={savedJob.job_data}
                        isSaved={true}
                        onSaveToggle={handleUnsave}
                    />
                ))}
            </div>

            {/* Stats */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                        Total saved jobs: <strong className="text-gray-900">{savedJobs.length}</strong>
                    </span>
                    <span>
                        Latest save: {new Date(savedJobs[0]?.saved_at).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SavedJobsTab;
