import React, { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, Linkedin, Sparkles, Copy, Check, Loader2, AlertCircle, User } from 'lucide-react';
import { supabase } from '../supabaseClient';
import useAuth from '../hooks/useAuth';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const RecruiterMessageModal = ({ isOpen, onClose, job }) => {
    const { user } = useAuth();
    const [resumeFile, setResumeFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const resultRef = useRef(null);

    const extractNameFromLinkedInUrl = (url) => {
        if (!url) return 'Recruiter';
        try {
            const match = url.match(/\/in\/([^\/?#]+)/);
            if (match && match[1]) {
                let namePart = match[1];
                namePart = namePart.replace(/-[a-zA-Z0-9]{8,}$/, '');
                return namePart.split('-')
                    .filter(part => part.length > 0)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            }
        } catch (e) {}
        return 'Recruiter';
    };
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedMessage, setGeneratedMessage] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(null);
    const [fullJobDescription, setFullJobDescription] = useState(job?.description || '');
    const [isFetchingDesc, setIsFetchingDesc] = useState(false);

    useEffect(() => {
        if (isOpen && job && !job.description && !fullJobDescription) {
            fetchFullDescription();
        }
    }, [isOpen, job]);

    useEffect(() => {
        if (generatedMessage && resultRef.current) {
            resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [generatedMessage]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setResumeFile(e.dataTransfer.files[0]);
            setError(null);
        }
    };

    const fetchFullDescription = async () => {
        setIsFetchingDesc(true);
        try {
            const jobId = job.job_id || job.id;
            const { data, error } = await supabase
                .from('jobs_all_roles')
                .select('description')
                .eq('id', jobId)
                .single();
            
            if (data && data.description) {
                setFullJobDescription(data.description);
            }
        } catch (err) {
            console.error("Error fetching description:", err);
        } finally {
            setIsFetchingDesc(false);
        }
    };

    const extractTextFromPDF = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async function (event) {
                try {
                    const typedarray = new Uint8Array(event.target.result);
                    const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
                    let text = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        const strings = content.items.map(item => item.str);
                        text += strings.join(' ') + '\n';
                    }
                    resolve(text);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsArrayBuffer(file);
        });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0]);
            setError(null);
        }
    };

    const generateMessage = async () => {
        if (!resumeFile) {
            setError("Please upload a resume first.");
            return;
        }

        setError(null);
        setIsGenerating(true);
        setGeneratedMessage('');

        try {
            // 1. Upload to Supabase Resumes bucket
            setIsUploading(true);
            const fileName = `${user?.id || 'guest'}_${Date.now()}_${resumeFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('Resumes')
                .upload(fileName, resumeFile, { upsert: true });
            
            if (uploadError) {
                console.error("Upload error:", uploadError);
                // We don't fail hard on upload errors, we still generate the message
            }
            setIsUploading(false);

            // 2. Extract text from PDF
            let resumeText = '';
            if (resumeFile.type === 'application/pdf') {
                resumeText = await extractTextFromPDF(resumeFile);
            } else {
                resumeText = await resumeFile.text(); // Fallback for txt/docx (docx will look garbled but might extract some text)
            }

            // 3. Call OpenAI API directly
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert recruiter and career coach."
                        },
                        {
                            role: "user",
                            content: `Generate a personalized recruiter outreach message based on:

1. The candidate's uploaded resume.
2. The job details provided below.

Job Details:
* Job Title: ${job.title || 'Not specified'}
* Company: ${job.company || 'Not specified'}
* Location: ${job.location || 'Not specified'}
* Job Description: ${fullJobDescription || 'Not specified'}
* Recruiter Name: ${job.poster_full_name || 'Recruiter'}
* Recruiter LinkedIn: ${job.posted_by_profile || 'Not specified'}

Instructions:
* Thoroughly analyze the resume and identify the candidate's strongest skills, technologies, projects, certifications, achievements, and experience.
* Compare the candidate's profile with the job requirements.
* Mention the specific job title and company naturally.
* Highlight why the candidate is a strong match for this role.
* Personalize the message using the recruiter's name when available.
* Keep the message professional, confident, and concise.
* Avoid generic job-seeking language.
* Do not invent experience or skills that are not present in the resume.
* Write as if the candidate is directly reaching out to the recruiter regarding this specific opportunity.
* End with a professional call to action.

Output Requirements:
* 80 to 120 words.
* Plain text only.
* No headings.
* No bullet points.
* No placeholders.
* Return only the final recruiter message.

Candidate's Resume Text:
${resumeText}`
                        }
                    ],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error("Failed to generate message from AI.");
            }

            const data = await response.json();
            if (data.choices && data.choices.length > 0) {
                setGeneratedMessage(data.choices[0].message.content.trim());
            } else {
                throw new Error("Invalid response from AI.");
            }

        } catch (err) {
            console.error("Generation error:", err);
            setError(err.message || "An error occurred while generating the message.");
        } finally {
            setIsGenerating(false);
            setIsUploading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
            <div className="min-h-full flex items-center justify-center p-4">
                <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-4 md:my-8">
                
                {/* Header */}
                <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                            <Linkedin className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 leading-tight">Message Recruiter</h2>
                            <p className="text-sm font-semibold text-gray-500">Generate an impactful introduction</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 md:p-6">
                    
                    {/* Recruiter Link */}
                    <div className="mb-6 p-4 bg-white border border-gray-100 shadow-sm rounded-xl flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-[12px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Recruiter</p>
                            <a 
                                href={job.posted_by_profile} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[16px] font-black text-blue-600 hover:text-blue-600/80 flex items-center gap-2 transition-colors"
                            >
                                <User size={18} className="text-blue-600/60 fill-current" />
                                {extractNameFromLinkedInUrl(job.posted_by_profile)}
                            </a>
                        </div>
                    </div>

                    {/* Resume Upload */}
                    <div className="mb-6">
                        <h3 className="text-[13px] font-bold text-gray-900 mb-3 uppercase tracking-wider">1. Upload your Resume</h3>
                        <div 
                            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 group ${isDragging ? 'border-blue-600 bg-blue-600/5 scale-[1.02]' : resumeFile ? 'border-blue-600 bg-blue-600/5 shadow-inner' : 'border-gray-200 bg-gray-50 hover:bg-blue-600/5 hover:border-blue-600/40'}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => {
                                if (!resumeFile) document.getElementById('resume-upload-input').click();
                            }}
                        >
                            {resumeFile ? (
                                <div className="flex flex-col items-center justify-center pt-4 pb-5 text-center px-4 animate-fadeIn">
                                    <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center mb-2">
                                        <Check className="w-5 h-5 text-blue-600" strokeWidth={3} />
                                    </div>
                                    <p className="mb-2 text-[15px] font-black text-gray-900 line-clamp-1 break-all">{resumeFile.name}</p>
                                    <div className="flex items-center gap-4 mt-1 z-10 relative">
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const url = URL.createObjectURL(resumeFile);
                                                window.open(url, '_blank');
                                            }}
                                            className="text-[13px] font-bold text-blue-600 hover:text-blue-800 underline px-2 py-1"
                                        >
                                            View Resume
                                        </button>
                                        <div className="w-px h-4 bg-gray-300"></div>
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                document.getElementById('resume-upload-input').click();
                                            }}
                                            className="text-[13px] font-bold text-blue-600 hover:text-blue-800 underline px-2 py-1 cursor-pointer"
                                        >
                                            Replace Resume
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${isDragging ? 'bg-blue-600/10' : 'bg-white shadow-sm group-hover:bg-blue-600/5'}`}>
                                        <UploadCloud className={`w-6 h-6 transition-colors ${isDragging ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                                    </div>
                                    <p className="mb-1 text-sm font-bold text-gray-900">
                                        <span className="text-blue-600">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs font-semibold text-gray-400">PDF format recommended</p>
                                </div>
                            )}
                            <input id="resume-upload-input" type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileChange} disabled={isGenerating} />
                        </div>
                    </div>

                    {/* Generate Action */}
                    <div className="mb-6">
                        <h3 className="text-[13px] font-bold text-gray-900 mb-3 uppercase tracking-wider">2. Generate Message</h3>
                        <button
                            onClick={generateMessage}
                            disabled={!resumeFile || isGenerating || isFetchingDesc}
                            className="w-full h-14 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 font-black text-[15px] hover:bg-blue-600/90 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none shadow-md shadow-blue-600/30"
                        >
                            {isFetchingDesc ? (
                                <><Loader2 className="animate-spin" size={20} /> Fetching Job Details...</>
                            ) : isGenerating ? (
                                <><Loader2 className="animate-spin" size={20} /> {isUploading ? 'Uploading...' : 'Crafting message...'}</>
                            ) : (
                                <><Sparkles size={20} /> Craft Recruiter-Friendly Message</>
                            )}
                        </button>
                        {error && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-start gap-2 text-[13px] font-semibold">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Result */}
                    {generatedMessage && (
                        <div ref={resultRef} className="animate-fadeIn pb-4">
                            <h3 className="text-[13px] font-bold text-gray-900 mb-3 uppercase tracking-wider">3. Your Message</h3>
                            <div className="relative group bg-white border-2 border-gray-100 rounded-2xl shadow-sm transition-all overflow-hidden">
                                <div
                                    className="w-full min-h-[12rem] p-4 md:p-5 text-[14px] font-medium text-gray-900 leading-relaxed whitespace-pre-wrap select-text"
                                    style={{ paddingTop: '56px', paddingBottom: '16px' }}
                                >
                                    {generatedMessage}
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    style={{ position: 'absolute', top: '12px', right: '12px' }}
                                    className={`p-2 rounded-xl shadow-sm transition-all flex items-center gap-2 font-bold text-[12px] ${copied ? 'bg-green-500 text-white' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-600 hover:bg-white'}`}
                                >
                                    {copied ? <><Check size={14} strokeWidth={3} /> Copied!</> : <><Copy size={14} /> Copy</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
};

export default RecruiterMessageModal;
