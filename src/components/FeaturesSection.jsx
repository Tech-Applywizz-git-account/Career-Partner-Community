import React from 'react';
import { CheckCircle, Globe, DollarSign, Mail, Shield, Clock } from 'lucide-react';

const features = [
    {
        icon: <Globe className="w-8 h-8 text-accent-blue" />,
        title: 'Verified Open Roles',
        description: 'Access a massive database of job opportunities updated daily',
    },
    {
        icon: <Shield className="w-8 h-8 text-accent-green" />,
        title: 'H-1B, OPT/CPT, TN, E-3, J-1 & Green Cards',
        description: 'Filter jobs by your specific visa needs and requirements',
    },
    {
        icon: <Clock className="w-8 h-8 text-accent-orange" />,
        title: 'Constantly Updated with New Jobs',
        description: 'Fresh job listings added every single day from top companies',
    },
    {
        icon: <DollarSign className="w-8 h-8 text-visa-greencard" />,
        title: 'Salary & Company Info for Every Role',
        description: 'Make informed decisions with transparent compensation data',
    },
    {
        icon: <Mail className="w-8 h-8 text-visa-h1b" />,
        title: 'Verified Email of Real Company Contact',
        description: 'Direct access to recruiters and hiring managers',
    },
    {
        icon: <CheckCircle className="w-8 h-8 text-visa-opt" />,
        title: 'Cancel Anytime',
        description: 'No long-term commitments, flexibility you can count on',
    },
];

const FeaturesSection = () => {
    return (
        <section className="py-20 bg-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                        Everything You Need to Succeed
                    </h2>
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
                        Get access to premium features designed to accelerate your job search
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-[#111] border border-white/5 rounded-2xl p-8 hover:shadow-[0_0_40px_rgba(253,185,19,0.05)] transition-all duration-200">
                            <div className="mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-gray-400">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
