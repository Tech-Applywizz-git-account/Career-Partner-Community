import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import MigrateNavbar from '../components/MigrateNavbar';
import MigrateHero from '../components/MigrateHero';
import MigrateMiddleSections from '../components/MigrateMiddleSections';
import BuiltByImmigrants from '../components/BuiltByImmigrants';
import MigrateFooterSections from '../components/MigrateFooterSections';

const LandingPage = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    // Scroll to top on load and redirect if logged in
    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "Career Partner | Land your dream job in the US";

        if (!loading && user) {
            navigate('/app', { replace: true });
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#24385E] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="mm-landing bg-slate-50 min-h-screen font-sans selection:bg-[#24385E]/20">
            {/* 1) TOP NAVBAR (Sticky) */}
            <MigrateNavbar />

            <main className="max-w-[1600px] mx-auto space-y-24 md:space-y-40 pb-32">
                {/* 2 & 3) HERO & SEARCH CARD */}
                <div className="pt-8">
                    <MigrateHero />
                </div>

                {/* 4, 5, 6, 7) MIDDLE SECTIONS */}
                <div>
                    <MigrateMiddleSections />
                </div>

                {/* BUILT BY IMMIGRANTS - New Section */}
                <div>
                    <BuiltByImmigrants />
                </div>

                {/* 8, 9, 10) FOOTER SECTIONS */}
                <div>
                    <MigrateFooterSections />
                </div>
            </main>
        </div>
    );
};

export default LandingPage;
