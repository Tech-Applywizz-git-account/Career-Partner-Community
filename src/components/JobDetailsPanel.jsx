
import React, { useState, useEffect } from "react";
import { X, Bookmark, BookmarkCheck, MapPin, Briefcase, GraduationCap } from "lucide-react";

const JobDetailsPanel = ({ job, onClose }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  // Restore saved/applied state per job
  useEffect(() => {
    if (!job) return;
    setIsSaved(localStorage.getItem(`saved-${job.id}`) === "true");
    setIsApplied(localStorage.getItem(`applied-${job.id}`) === "true");
  }, [job]);

  const handleSave = () => {
    const newState = !isSaved;
    setIsSaved(newState);
    localStorage.setItem(`saved-${job.id}`, newState);
  };

  const handleApply = () => {
    setIsApplied(true);
    localStorage.setItem(`applied-${job.id}`, true);

    // placeholder link - later replace with real URL from backend
    window.open("https://www.indeed.com", "_blank");
  };

  if (!job) return null;

  return (
    <div className="fixed md:static top-0 right-0 w-full md:w-[430px] h-full bg-white shadow-2xl border-l border-gray-200 z-50 animate-slide-in flex flex-col">

      {/* Header */}
      <div className="flex justify-between items-center px-6 py-5 border-b border-gray-50 bg-white">
        <h2 className="font-black text-[#24385E] text-lg tracking-tight">{job.title}</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
          <X className="text-gray-400 hover:text-[#24385E]" size={20} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="p-6 overflow-y-auto flex-1 space-y-8 no-scrollbar">

        {/* Company + Location */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-gray-900 text-xl">{job.company}</h4>
            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-md">
              Human Verified
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <p className="flex items-center text-gray-500 text-sm font-medium">
              <MapPin size={16} className="mr-2 text-gray-400" /> {job.location || 'Remote'}
            </p>
            <p className="flex items-center text-gray-500 text-sm font-medium">
              <Briefcase size={16} className="mr-2 text-gray-400" /> {job.type || 'Full-time'}
            </p>
          </div>
        </div>

        {/* Visa Support */}
        <div>
          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Visa Sponsorship</h5>
          <div className="flex flex-wrap gap-2">
            {(job.visas || ['H-1B', 'OPT', 'TN', 'Green Card']).map((v, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-bold"
              >
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Job Categories</h5>
          <div className="flex flex-wrap gap-2">
            {(job.categories || [job.job_role_name, 'Engineering', 'Tech']).map((cat, i) => (
              <span key={i} className="px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-100 rounded-lg text-xs font-bold">
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* About the job */}
        <div>
          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">About This Role</h5>
          <div className="text-gray-600 text-sm leading-relaxed space-y-4 font-medium">
            <p>
              Join the team at {job.company} as a {job.title}. This role offers a unique opportunity to work on cutting-edge technologies while receiving full visa support for qualified candidates.
            </p>
            <p>
              Our automated system has verified that this company has a history of sponsoring {job.visas?.join(', ') || 'relevant visas'} for this specific role. Apply today to start your journey.
            </p>
          </div>
        </div>

      </div>

      {/* Footer Buttons */}
      <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50 flex gap-3">

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${isSaved
            ? "bg-white text-[#24385E] border-gray-200 shadow-sm"
            : "bg-white border-gray-200 text-gray-500 hover:bg-white hover:border-[#24385E] hover:text-[#24385E]"
            }`}
        >
          {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          {isSaved ? "Saved" : "Save"}
        </button>

        {/* Apply Button */}
        <button
          onClick={handleApply}
          className={`flex-1 py-3 rounded-xl text-white text-xs font-black uppercase tracking-widest shadow-lg transition-all ${isApplied
            ? "bg-emerald-500 cursor-default"
            : "bg-[#24385E] hover:bg-blue-800 active:scale-95"
            }`}
        >
          {isApplied ? "Applied ✓" : "Apply Now"}
        </button>
      </div>
    </div>
  );
};

export default JobDetailsPanel;
