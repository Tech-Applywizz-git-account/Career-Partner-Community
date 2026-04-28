import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const steps = [
    {
        number: 1,
        title: 'Sign up and filter by your visa needs',
        content: 'Create your account in seconds and set your visa preferences to see only relevant opportunities.',
    },
    {
        number: 2,
        title: 'Browse 500K+ verified jobs',
        content: 'Explore our massive database of verified job opportunities from top companies across the US.',
    },
    {
        number: 3,
        title: 'View detailed job information',
        content: 'Get comprehensive details including job descriptions, salary ranges, and visa sponsorship information.',
    },
    {
        number: 4,
        title: 'Access company contact information',
        content: 'Reach out directly to recruiters and hiring managers with verified contact information.',
    },
    {
        number: 5,
        title: 'Apply directly or reach out',
        content: 'Submit your application through our platform or contact companies directly.',
    },
    {
        number: 6,
        title: 'Track your applications',
        content: 'Manage all your job applications in one place and never miss a follow-up.',
    },
];

const HowItWorks = () => {
    const [expandedStep, setExpandedStep] = useState(null);

    return (
        <section id="how-it-works" className="py-20 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-primary-dark mb-4">
                        How It Works
                    </h2>
                    <p className="text-xl text-gray-600">
                        Get started in minutes and land your dream job
                    </p>
                </div>

                {/* Steps Accordion */}
                <div className="space-y-4">
                    {steps.map((step) => (
                        <div key={step.number} className="card cursor-pointer" onClick={() => setExpandedStep(expandedStep === step.number ? null : step.number)}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4 flex-1">
                                    <div className="flex-shrink-0 w-10 h-10 bg-primary-yellow rounded-full flex items-center justify-center font-bold text-primary-dark">
                                        {step.number}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-primary-dark mb-1">
                                            {step.title}
                                        </h3>
                                        {expandedStep === step.number && (
                                            <p className="text-gray-600 mt-2">{step.content}</p>
                                        )}
                                    </div>
                                </div>
                                <button className="text-gray-400 hover:text-primary-dark">
                                    {expandedStep === step.number ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Video Demo Placeholder */}
                <div className="mt-12 card">
                    <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary-yellow rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-primary-dark" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                            </div>
                            <p className="text-gray-600 font-medium">Watch 2-Minute Demo</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
