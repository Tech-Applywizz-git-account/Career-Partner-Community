import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
    {
        content: "Definitely worth subscribing. I was a bit hesitant at first to subscribe but realised that I really had no other options out there to find currently open jobs that sponsor visas so I thought I'd give Career Partner a try. I'm so happy I did because I've heard back from multiple Job Openings. This is by far the best job platform I've used.",
        rating: 5,
        initials: 'A',
        color: 'from-orange-400 to-red-500',
    },
    {
        content: "Perfect for international students. I'm an international student and have been looking for graduate jobs for a while at companies that'll sponsor me on an H-1B after my OPT ends. It's been really difficult to find this information so when I saw an ad on Instagram for Career Partner I thought this could be perfect for me and it really was.",
        rating: 5,
        initials: 'B',
        color: 'from-blue-400 to-indigo-500',
    },
    {
        content: "Have had a brilliant experience with Career Partner, the team are very easy to get in touch with if need be, the website is very easy to direct and navigate through every step of the way. Not to mention it is very cheap to use their services. Things have genuinely changed and I am in a much better space to get sponsored.",
        rating: 5,
        initials: 'C',
        color: 'from-green-400 to-teal-500',
    },
    {
        content: "This service is changing my life. It's sooo easy to find top jobs in the US & for a very decent price. Can't recommend enough!",
        rating: 5,
        initials: 'D',
        color: 'from-[#29FE29] to-blue-800',
    },
    {
        content: "The platform was incredibly affordable and made finding a high quality job in the US incredibly seamless. Affordable and stress free.",
        rating: 5,
        initials: 'E',
        color: 'from-yellow-400 to-orange-500',
    },
    {
        content: "As an Aussie Digital Nomad currently based in Bali I'm interested in working in the US. I find the service well thought out and affordable. A lot of thought has been put in to ensure the user feels comfortable and at ease. Deciding on a seachange is a daunting task and I'm glad this service exists.",
        rating: 5,
        initials: 'F',
        color: 'from-cyan-400 to-blue-500',
    },
];

const Testimonials = () => {
    return (
        <section className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-black rounded-[48px] py-16 md:py-24 px-6 md:px-12 shadow-2xl">
                    {/* Section Header */}
                    <div className="text-center mb-10 md:mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                            Reviews
                        </h2>
                        <div className="flex items-center justify-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-5 h-5 text-[#29FE29] fill-current" />
                            ))}
                        </div>
                    </div>

                    {/* Testimonials Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-[#111111] rounded-2xl p-6 border border-white/5 shadow-sm hover:shadow-md transition-shadow">
                                {/* Stars */}
                                <div className="flex mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 text-[#29FE29] fill-current" />
                                    ))}
                                </div>

                                {/* Content */}
                                <p className="text-gray-300 text-sm leading-relaxed mb-5">
                                    "{testimonial.content}"
                                </p>

                                {/* Author */}
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 bg-gradient-to-br ${testimonial.color} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                                        {testimonial.initials}
                                    </div>
                                    <div className="text-xs text-gray-400 font-medium">Verified User</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
