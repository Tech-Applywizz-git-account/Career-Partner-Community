import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            question: 'Is Career Partner right for me?',
            answer: 'If you\'re looking to land a job in the US as a non-US citizen, Career Partner is right for you. Whether you\'re a recent graduate, a professional with years of experience, or someone with niche skills, Career Partner can help you identify companies that have a proven history of sponsoring visas. It\'s designed for job seekers from any country and any industry who want to streamline their job search and focus on opportunities that are most likely to lead to employment and visa sponsorship in the US. All jobs listed are actively hiring.'
        },
        {
            question: 'What visa types are supported?',
            answer: 'We support all major US work visas including H-1B, F-1 (OPT/CPT), Green Card, TN, E-3, J-1, and H-1B1. You can filter jobs by your specific visa requirements to find opportunities that match your situation.'
        },
        {
            question: 'How often are jobs updated?',
            answer: 'Our database is constantly updated with new jobs. You\'ll always have access to the latest opportunities from companies actively hiring and sponsoring visas.'
        },
        {
            question: 'What is the verified email contact feature?',
            answer: 'For every job listing, we provide the verified email address of a real person at the company who handles visa sponsorship and immigration matters. This allows you to reach out directly and bypass the traditional application process, giving you a significant advantage.'
        },
        {
            question: 'Can I cancel my subscription anytime?',
            answer: 'Yes! You can cancel your subscription at any time. When you cancel, you will not be charged for the next billing period. Your access continues until the end of the current billing period.'
        },
        {
            question: 'Is Career Partner legit?',
            answer: 'Absolutely. Career Partner is a legitimate platform built by immigrants for immigrants. Our job data is verified against U.S. Government records including USCIS H-1B disclosure data, and we constantly update our database to ensure accuracy. We have thousands of satisfied users who have successfully found visa-sponsored employment through our platform.'
        },
    ];

    return (
        <section id="faq" className="py-20 bg-black">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10 md:mb-12">
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-sm md:text-base text-gray-400">
                        Everything you need to know about Career Partner
                    </p>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="border border-white/5 rounded-2xl overflow-hidden bg-[#111]"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex justify-between items-center text-left px-6 py-5 hover:bg-gray-50 transition-colors"
                            >
                                <h3 className="text-sm md:text-base font-semibold text-white pr-4 md:pr-8">
                                    {faq.question}
                                </h3>
                                <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                    {openIndex === index ? (
                                        <ChevronUp className="text-gray-500" size={14} />
                                    ) : (
                                        <ChevronDown className="text-gray-500" size={14} />
                                    )}
                                </div>
                            </button>
                            {openIndex === index && (
                                <div className="px-6 pb-5">
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;
