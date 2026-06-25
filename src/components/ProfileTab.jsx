// import React, { useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient';
// import useAuth from '../hooks/useAuth';
// import { User, Mail, MapPin, Briefcase, Phone, Linkedin, Github, Globe, Save, Loader2, CheckCircle } from 'lucide-react';

// const ProfileTab = () => {
//     const { user, role } = useAuth();
//     const [loading, setLoading] = useState(true);
//     const [saving, setSaving] = useState(false);
//     const [success, setSuccess] = useState(false);
//     const [error, setError] = useState(null);

//     // Profile form data
//     const [profileData, setProfileData] = useState({
//         first_name: '',
//         last_name: '',
//         mobile_number: '',
//         experience: '',
//         location: '',
//         job_title: '',
//         years_of_experience: '',
//         skills: '',
//         linkedin_url: '',
//         github_url: '',
//         portfolio_url: '',
//         bio: '',
//     });

//     // Fetch profile data
//     useEffect(() => {
//         if (user) {
//             fetchProfile();
//         }
//     }, [user]);

//     const fetchProfile = async () => {
//         try {
//             const { data, error } = await supabase
//                 .from('profiles')
//                 .select('*')
//                 .eq('id', user.id)
//                 .single();

//             if (error) throw error;

//             if (data) {
//                 setProfileData({
//                     first_name: data.first_name || '',
//                     last_name: data.last_name || '',
//                     mobile_number: data.mobile_number || '',
//                     experience: data.experience || '',
//                     location: data.location || '',
//                     job_title: data.job_title || '',
//                     years_of_experience: data.years_of_experience || '',
//                     skills: data.skills || '',
//                     linkedin_url: data.linkedin_url || '',
//                     github_url: data.github_url || '',
//                     portfolio_url: data.portfolio_url || '',
//                     bio: data.bio || '',
//                 });
//             }
//         } catch (err) {
//             console.error('Error fetching profile:', err);
//             setError('Failed to load profile');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setProfileData(prev => ({
//             ...prev,
//             [name]: value
//         }));
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setSaving(true);
//         setError(null);
//         setSuccess(false);

//         try {
//             const { error } = await supabase
//                 .from('profiles')
//                 .update({
//                     first_name: profileData.first_name,
//                     last_name: profileData.last_name,
//                     mobile_number: profileData.mobile_number,
//                     experience: profileData.experience,
//                     location: profileData.location,
//                     job_title: profileData.job_title,
//                     years_of_experience: profileData.years_of_experience,
//                     skills: profileData.skills,
//                     linkedin_url: profileData.linkedin_url,
//                     github_url: profileData.github_url,
//                     portfolio_url: profileData.portfolio_url,
//                     bio: profileData.bio,
//                     updated_at: new Date().toISOString(),
//                 })
//                 .eq('id', user.id);

//             if (error) throw error;

//             setSuccess(true);
//             setTimeout(() => setSuccess(false), 3000);
//             console.log('✅ Profile updated successfully');
//         } catch (err) {
//             console.error('❌ Error updating profile:', err);
//             setError(err.message || 'Failed to update profile');
//         } finally {
//             setSaving(false);
//         }
//     };

//     if (loading) {
//         return (
//             <div className="flex items-center justify-center py-20">
//                 <Loader2 className="w-8 h-8 text-[#29FE29] animate-spin" />
//             </div>
//         );
//     }

//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div>
//                 <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
//                     <User className="w-8 h-8 text-[#29FE29]" />
//                     Profile Settings
//                 </h2>
//                 <p className="text-gray-600 mt-1">
//                     Manage your personal information and job preferences
//                 </p>
//             </div>

//             {/* Success Message */}
//             {success && (
//                 <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
//                     <CheckCircle className="w-5 h-5 text-green-600" />
//                     <p className="text-green-800 font-medium">Profile updated successfully!</p>
//                 </div>
//             )}

//             {/* Error Message */}
//             {error && (
//                 <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//                     <p className="text-red-800">{error}</p>
//                 </div>
//             )}

//             {/* Profile Form */}
//             <form onSubmit={handleSubmit} className="space-y-6">
//                 {/* Account Information */}
//                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//                     <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                         <Mail className="w-5 h-5 text-gray-600" />
//                         Account Information
//                     </h3>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         {/* Email (Read-only) */}
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Email Address
//                             </label>
//                             <input
//                                 type="email"
//                                 value={user?.email || ''}
//                                 readOnly
//                                 className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
//                             />
//                         </div>

//                         {/* Account Role (Read-only) */}
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Account Role
//                             </label>
//                             <input
//                                 type="text"
//                                 value={role === 'admin' ? 'Administrator' : 'Standard User'}
//                                 readOnly
//                                 className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
//                             />
//                         </div>
//                     </div>
//                 </div>

//                 {/* Personal Information */}
//                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//                     <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                         <User className="w-5 h-5 text-gray-600" />
//                         Personal Information
//                     </h3>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         {/* First Name */}
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 First Name *
//                             </label>
//                             <input
//                                 type="text"
//                                 name="first_name"
//                                 value={profileData.first_name}
//                                 onChange={handleChange}
//                                 placeholder="John"
//                                 className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                                 required
//                             />
//                         </div>

//                         {/* Last Name */}
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Last Name *
//                             </label>
//                             <input
//                                 type="text"
//                                 name="last_name"
//                                 value={profileData.last_name}
//                                 onChange={handleChange}
//                                 placeholder="Doe"
//                                 className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                                 required
//                             />
//                         </div>

//                         {/* Mobile Number */}
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Mobile Number
//                             </label>
//                             <input
//                                 type="tel"
//                                 name="mobile_number"
//                                 value={profileData.mobile_number}
//                                 onChange={handleChange}
//                                 placeholder="+1 (555) 123-4567"
//                                 className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                             />
//                         </div>

//                         {/* Experience */}
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Experience Level
//                             </label>
//                             <select
//                                 name="experience"
//                                 value={profileData.experience}
//                                 onChange={handleChange}
//                                 className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                             >
//                                 <option value="">Select experience...</option>
//                                 <option value="0-4 years">0-4 years</option>
//                                 <option value="5-7 years">5-7 years</option>
//                                 <option value="8-11 years">8-11 years</option>
//                                 <option value="11+ years">11+ years</option>
//                             </select>
//                         </div>

//                         {/* Location */}
//                         <div className="md:col-span-2">
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Location
//                             </label>
//                             <div className="relative">
//                                 <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                                 <input
//                                     type="text"
//                                     name="location"
//                                     value={profileData.location}
//                                     onChange={handleChange}
//                                     placeholder="San Francisco, CA"
//                                     className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                                 />
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Professional Information */}
//                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//                     <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                         <Briefcase className="w-5 h-5 text-gray-600" />
//                         Professional Information
//                     </h3>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         {/* Current Job Title */}
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Current Job Title
//                             </label>
//                             <input
//                                 type="text"
//                                 name="job_title"
//                                 value={profileData.job_title}
//                                 onChange={handleChange}
//                                 placeholder="Senior Software Engineer"
//                                 className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                             />
//                         </div>

//                         {/* Years of Experience */}
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Years of Experience
//                             </label>
//                             <select
//                                 name="years_of_experience"
//                                 value={profileData.years_of_experience}
//                                 onChange={handleChange}
//                                 className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                             >
//                                 <option value="">Select...</option>
//                                 <option value="0-1">0-1 years</option>
//                                 <option value="1-3">1-3 years</option>
//                                 <option value="3-5">3-5 years</option>
//                                 <option value="5-7">5-7 years</option>
//                                 <option value="7-10">7-10 years</option>
//                                 <option value="10+">10+ years</option>
//                             </select>
//                         </div>

//                         {/* Skills */}
//                         <div className="md:col-span-2">
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Skills (comma separated)
//                             </label>
//                             <input
//                                 type="text"
//                                 name="skills"
//                                 value={profileData.skills}
//                                 onChange={handleChange}
//                                 placeholder="React, Node.js, Python, AWS, Docker"
//                                 className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                             />
//                             <p className="text-xs text-gray-500 mt-1">Enter your skills separated by commas</p>
//                         </div>

//                         {/* Bio */}
//                         <div className="md:col-span-2">
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Professional Bio
//                             </label>
//                             <textarea
//                                 name="bio"
//                                 value={profileData.bio}
//                                 onChange={handleChange}
//                                 rows="4"
//                                 placeholder="Tell us about your experience, achievements, and career goals..."
//                                 className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
//                             />
//                             <p className="text-xs text-gray-500 mt-1">Maximum 500 characters</p>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Social Links */}
//                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//                     <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                         <Globe className="w-5 h-5 text-gray-600" />
//                         Social & Portfolio Links
//                     </h3>

//                     <div className="space-y-4">
//                         {/* LinkedIn */}
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 LinkedIn Profile
//                             </label>
//                             <div className="relative">
//                                 <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                                 <input
//                                     type="url"
//                                     name="linkedin_url"
//                                     value={profileData.linkedin_url}
//                                     onChange={handleChange}
//                                     placeholder="https://linkedin.com/in/yourprofile"
//                                     className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                                 />
//                             </div>
//                         </div>

//                         {/* GitHub */}
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 GitHub Profile
//                             </label>
//                             <div className="relative">
//                                 <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                                 <input
//                                     type="url"
//                                     name="github_url"
//                                     value={profileData.github_url}
//                                     onChange={handleChange}
//                                     placeholder="https://github.com/yourusername"
//                                     className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                                 />
//                             </div>
//                         </div>

//                         {/* Portfolio */}
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Portfolio Website
//                             </label>
//                             <div className="relative">
//                                 <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                                 <input
//                                     type="url"
//                                     name="portfolio_url"
//                                     value={profileData.portfolio_url}
//                                     onChange={handleChange}
//                                     placeholder="https://yourportfolio.com"
//                                     className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//                                 />
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Save Button */}
//                 <div className="flex items-center justify-end gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//                     <button
//                         type="button"
//                         onClick={fetchProfile}
//                         className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
//                     >
//                         Reset
//                     </button>
//                     <button
//                         type="submit"
//                         disabled={saving}
//                         className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                         {saving ? (
//                             <>
//                                 <Loader2 className="w-5 h-5 animate-spin" />
//                                 Saving...
//                             </>
//                         ) : (
//                             <>
//                                 <Save className="w-5 h-5" />
//                                 Save Changes
//                             </>
//                         )}
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );
// };

// export default ProfileTab;



import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import useAuth from '../hooks/useAuth';
import { User, Mail, MapPin, Save, Loader2, CheckCircle, UploadCloud, FileText, X, AlertCircle } from 'lucide-react';

const ProfileTab = () => {
    const { user, role } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Profile form data — mapped to actual 'profiles' table columns
    const [profileData, setProfileData] = useState({
        full_name: '',   // DB column: full_name
        country: '',     // DB column: country
    });

    // Resume state
    const [resumeUrl, setResumeUrl] = useState(null);       // stored URL from DB
    const [resumeFileName, setResumeFileName] = useState(''); // display name
    const [isUploadingResume, setIsUploadingResume] = useState(false);
    const [resumeUploadSuccess, setResumeUploadSuccess] = useState(false);
    const [resumeError, setResumeError] = useState(null);   // error shown near upload zone

    // Fetch profile data
    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id);

            if (error) throw error;

            // If profile exists, populate form
            if (data && data.length > 0) {
                const profile = data[0];
                // Map actual DB columns → form state
                setProfileData({
                    full_name: profile.full_name || '',
                    country:   profile.country   || '',
                });
                // Load saved resume
                if (profile.resume_url) {
                    setResumeUrl(profile.resume_url);
                    const parts = profile.resume_url.split('/');
                    const raw = parts[parts.length - 1] || 'resume.pdf';
                    const nameMatch = raw.match(/^[^_]+_\d+_(.+)$/);
                    setResumeFileName(nameMatch ? nameMatch[1] : raw);
                }
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResumeUpload = async (file) => {
        if (!file) return;
        setIsUploadingResume(true);
        setResumeUploadSuccess(false);
        setResumeError(null);
        try {
            // Step 1: Upload file to Supabase Storage
            const fileName = `${user?.id || 'guest'}_${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('Resumes')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw new Error('Storage upload failed: ' + uploadError.message);

            // Step 2: Get public URL
            const { data: urlData } = supabase.storage
                .from('Resumes')
                .getPublicUrl(fileName);

            const publicUrl = urlData?.publicUrl;

            // Step 3: Show success immediately — file is uploaded
            setResumeUrl(publicUrl);
            setResumeFileName(file.name);
            setResumeUploadSuccess(true);
            setTimeout(() => setResumeUploadSuccess(false), 3000);

            // Step 4: Persist URL to DB (non-fatal — shows a local error if it fails)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({ id: user.id, resume_url: publicUrl }, { onConflict: 'id' });

            if (profileError) {
                // File is uploaded but DB link failed — show near the zone
                console.error('Resume DB save error:', profileError);
                setResumeError('Resume uploaded to storage but could not be saved to your profile. Please ensure the resume_url column exists in the profiles table.');
            }
        } catch (err) {
            console.error('Resume upload error:', err);
            setResumeError(err.message || 'Failed to upload resume. Please try again.');
        } finally {
            setIsUploadingResume(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            // Only save columns that actually exist in the profiles table
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id:         user.id,
                    full_name:  profileData.full_name,
                    country:    profileData.country,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('❌ Error updating profile:', err);
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <User className="w-8 h-8 text-gray-900" />
                    Profile Settings
                </h2>
                <p className="text-gray-600 mt-1">
                    Manage your personal information and preferences
                </p>
            </div>

            {/* Success Message */}
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 font-medium">Profile updated successfully!</p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Account Information */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-gray-600" />
                        Account Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Email (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                readOnly
                                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                            />
                        </div>

                        {/* Account Role */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Account Role
                            </label>
                            <input
                                type="text"
                                value={role === 'admin' ? 'Administrator' : 'Standard User'}
                                readOnly
                                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-600" />
                        Personal Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Full Name — maps to profiles.full_name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="full_name"
                                value={profileData.full_name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                            />
                        </div>

                        {/* Country — maps to profiles.country */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Country
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="country"
                                    value={profileData.country}
                                    onChange={handleChange}
                                    placeholder="United States of America"
                                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resume Upload */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        Resume
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Upload your resume once here — it will be used automatically when crafting recruiter messages.</p>

                    {/* Current resume indicator */}
                    {resumeUrl && (
                        <div className="mb-3 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                            <a
                                href={resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-blue-600 hover:underline truncate flex-1"
                            >
                                {resumeFileName || 'View current resume'}
                            </a>
                            <span className="text-[11px] text-blue-500 font-bold shrink-0">Saved</span>
                        </div>
                    )}

                    {/* Drop zone */}
                    <label
                        htmlFor="profile-resume-input"
                        className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                            isUploadingResume
                                ? 'border-blue-400 bg-blue-50'
                                : resumeUploadSuccess
                                ? 'border-green-400 bg-green-50'
                                : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                    >
                        <input
                            id="profile-resume-input"
                            type="file"
                            accept=".pdf,.txt"
                            className="hidden"
                            disabled={isUploadingResume}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleResumeUpload(e.target.files[0]);
                                }
                            }}
                        />
                        {isUploadingResume ? (
                            <>
                                <Loader2 className="w-7 h-7 text-blue-500 animate-spin mb-1" />
                                <span className="text-sm font-semibold text-blue-600">Uploading...</span>
                            </>
                        ) : resumeUploadSuccess ? (
                            <>
                                <CheckCircle className="w-7 h-7 text-green-500 mb-1" />
                                <span className="text-sm font-semibold text-green-600">Resume saved!</span>
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-7 h-7 text-gray-400 mb-1" />
                                <span className="text-sm font-semibold text-gray-700">
                                    {resumeUrl ? 'Replace resume' : 'Click to upload resume'}
                                </span>
                                <span className="text-xs text-gray-400 mt-0.5">PDF recommended</span>
                            </>
                        )}
                    </label>

                    {/* Resume-specific error shown right here — visible without scrolling */}
                    {resumeError && (
                        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                            <p>{resumeError}</p>
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-end gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <button
                        type="button"
                        onClick={fetchProfile}
                        className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Reset
                    </button>

                    <button
                        type="submit"
                        disabled={saving || success}
                        className={`inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-80 ${
                            success 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'bg-gray-900 hover:bg-gray-800 text-white'
                        }`}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Saving...
                            </>
                        ) : success ? (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Changes Saved!
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileTab;
