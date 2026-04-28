// import React, { useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient';
// import useAuth from '../hooks/useAuth';
// import JobCard from './JobCard';
// import { Loader2, Briefcase } from 'lucide-react';

// const AppliedJobsTab = () => {
//     const { user } = useAuth();
//     const [appliedJobs, setAppliedJobs] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [appliedJobIds, setAppliedJobIds] = useState(new Set());
//     const [savedJobIds, setSavedJobIds] = useState(new Set());

//     useEffect(() => {
//         if (user) {
//             fetchAppliedJobs();
//             fetchSavedJobIds();
//         }
//     }, [user]);

//     const fetchAppliedJobs = async () => {
//         setLoading(true);
//         try {
//             const { data, error } = await supabase
//                 .from('applied_jobs')
//                 .select('*')
//                 .eq('user_id', user.id)
//                 .order('applied_at', { ascending: false });

//             if (error) throw error;

//             // Extract job data and job IDs
//             const jobs = data.map(item => item.job_data);
//             const ids = new Set(data.map(item => item.job_id));

//             setAppliedJobs(jobs);
//             setAppliedJobIds(ids);
//         } catch (error) {
//             console.error('Error fetching applied jobs:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchSavedJobIds = async () => {
//         try {
//             const { data, error } = await supabase
//                 .from('saved_jobs')
//                 .select('job_id')
//                 .eq('user_id', user.id);

//             if (error) throw error;

//             const ids = new Set(data.map(item => item.job_id));
//             setSavedJobIds(ids);
//         } catch (error) {
//             console.error('Error fetching saved jobs:', error);
//         }
//     };

//     const handleSaveToggle = (jobId, isSaved) => {
//         setSavedJobIds(prev => {
//             const newSet = new Set(prev);
//             if (isSaved) {
//                 newSet.add(jobId);
//             } else {
//                 newSet.delete(jobId);
//             }
//             return newSet;
//         });
//     };

//     const handleApplyToggle = async (jobId, isApplied) => {
//         // When unmarking as applied, remove from the list
//         if (!isApplied) {
//             setAppliedJobs(prev => prev.filter(job => (job.job_id || job.id) !== jobId));
//             setAppliedJobIds(prev => {
//                 const newSet = new Set(prev);
//                 newSet.delete(jobId);
//                 return newSet;
//             });
//         }
//     };

//     if (loading) {
//         return (
//             <div className="flex justify-center py-20">
//                 <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
//             </div>
//         );
//     }

//     return (
//         <div>
//             <h2 className="text-2xl font-bold text-gray-900 mb-6">
//                 Applied Jobs ({appliedJobs.length})
//             </h2>

//             {appliedJobs.length === 0 ? (
//                 <div className="bg-white p-10 rounded-lg shadow-md border text-center">
//                     <Briefcase size={45} className="mx-auto text-gray-300 mb-4" />
//                     <p className="text-gray-600 mb-2">No applications yet.</p>
//                     <p className="text-sm text-gray-500">
//                         Jobs you mark as "Applied" will appear here
//                     </p>
//                 </div>
//             ) : (
//                 <div className="space-y-4">
//                     {appliedJobs.map((job) => (
//                         <JobCard
//                             key={job.job_id || job.id}
//                             job={job}
//                             isSaved={savedJobIds.has(job.job_id || job.id)}
//                             isApplied={appliedJobIds.has(job.job_id || job.id)}
//                             onSaveToggle={handleSaveToggle}
//                             onApplyToggle={handleApplyToggle}
//                         />
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default AppliedJobsTab;




import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import useAuth from '../hooks/useAuth';
import JobCard from './JobCard';
import { Loader2, Briefcase, CheckCircle } from 'lucide-react';

const AppliedJobsTab = () => {
    const { user } = useAuth();
    const [appliedJobs, setAppliedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [appliedJobIds, setAppliedJobIds] = useState(new Set());
    const [savedJobIds, setSavedJobIds] = useState(new Set());

    useEffect(() => {
        if (user) {
            fetchAppliedJobs();
            fetchSavedJobIds();
        }
    }, [user]);

    const fetchAppliedJobs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('applied_jobs')
                .select('*')
                .eq('user_id', user.id)
                .order('applied_at', { ascending: false });

            if (error) throw error;

            // Transform data - add applied_at and other metadata from applied_jobs table
            const jobs = data.map(item => ({
                ...item.job_data,
                // Preserve job_id from the applied_jobs record
                job_id: item.job_id,
                // Add applied job metadata
                applied_at: item.applied_at,
                application_status: item.application_status,
                application_id: item.id
            }));

            // Fetch filing counts for these companies to show on cards
            const companyNames = [...new Set(jobs.map(j => j.company))].filter(Boolean);
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

                    jobs.forEach(job => {
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

            const ids = new Set(data.map(item => item.job_id));

            setAppliedJobs(jobs);
            setAppliedJobIds(ids);
        } catch (error) {
            console.error('Error fetching applied jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSavedJobIds = async () => {
        try {
            const { data, error } = await supabase
                .from('saved_jobs')
                .select('job_id')
                .eq('user_id', user.id);

            if (error) throw error;

            const ids = new Set(data.map(item => item.job_id));
            setSavedJobIds(ids);
        } catch (error) {
            console.error('Error fetching saved jobs:', error);
        }
    };

    const handleSaveToggle = (jobId, isSaved) => {
        setSavedJobIds(prev => {
            const newSet = new Set(prev);
            if (isSaved) {
                newSet.add(jobId);
            } else {
                newSet.delete(jobId);
            }
            return newSet;
        });
    };

    const handleApplyToggle = async (jobId, isApplied) => {
        console.log('🔄 AppliedJobsTab: handleApplyToggle called', { jobId, isApplied });

        // When unmarking as applied, remove from the list
        if (!isApplied) {
            setAppliedJobs(prev => prev.filter(job => {
                const jobIdToCompare = job.job_id || job.id;
                return jobIdToCompare !== jobId;
            }));

            setAppliedJobIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(jobId);
                return newSet;
            });
        } else {
            // If somehow a job gets marked as applied while in this tab,
            // refresh the list to ensure consistency
            await fetchAppliedJobs();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 text-gray-900 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Applied Jobs</h2>
                        <p className="text-gray-600">
                            Track and manage all your job applications
                        </p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        <span className="font-semibold text-blue-600">{appliedJobs.length}</span> job{appliedJobs.length !== 1 ? 's' : ''} applied
                    </p>
                </div>
            </div>

            {/* Jobs List */}
            {appliedJobs.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <Briefcase size={60} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No applications yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        When you mark jobs as "Applied" on the All Jobs page, they will appear here for tracking.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {appliedJobs.map((job) => {
                        // Get the actual job ID - prioritize job_id from applied_jobs table
                        const jobId = job.job_id || job.id;

                        return (
                            <JobCard
                                key={jobId}
                                job={job}
                                isSaved={savedJobIds.has(jobId)}
                                isApplied={true} // CRITICAL FIX: Always pass true here!
                                onSaveToggle={handleSaveToggle}
                                onApplyToggle={handleApplyToggle}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AppliedJobsTab;