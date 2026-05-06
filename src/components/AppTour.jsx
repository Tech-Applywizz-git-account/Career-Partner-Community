import React, { useEffect, useCallback, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_COMPLETED_KEY = 'cp_tour_completed_v1';

// Premium custom CSS injected once
const injectTourStyles = () => {
  if (document.getElementById('cp-tour-styles')) return;
  const style = document.createElement('style');
  style.id = 'cp-tour-styles';
  style.textContent = `
    /* ── Driver.js Premium Override ─────────────────────────── */
    .driver-popover {
      background: #ffffff !important;
      border: none !important;
      border-radius: 20px !important;
      box-shadow: 0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(44,118,255,0.08) !important;
      padding: 0 !important;
      max-width: 380px !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
      overflow: hidden !important;
    }

    .driver-popover-title {
      font-size: 18px !important;
      font-weight: 800 !important;
      color: #1E1E1E !important;
      padding: 24px 24px 4px !important;
      letter-spacing: -0.02em !important;
      line-height: 1.3 !important;
    }

    .driver-popover-description {
      font-size: 14px !important;
      font-weight: 500 !important;
      color: #666 !important;
      line-height: 1.7 !important;
      padding: 8px 24px 20px !important;
    }

    .driver-popover-footer {
      padding: 0 24px 20px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 12px !important;
    }

    .driver-popover-progress-text {
      font-size: 12px !important;
      font-weight: 700 !important;
      color: #999 !important;
      letter-spacing: 0.02em !important;
    }

    .driver-popover-prev-btn,
    .driver-popover-next-btn {
      border: none !important;
      border-radius: 12px !important;
      padding: 10px 22px !important;
      font-size: 13px !important;
      font-weight: 700 !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      text-shadow: none !important;
      box-shadow: none !important;
    }

    .driver-popover-prev-btn {
      background: #f5f5f5 !important;
      color: #555 !important;
    }

    .driver-popover-prev-btn:hover {
      background: #eee !important;
    }

    .driver-popover-next-btn {
      background: linear-gradient(135deg, #2C76FF 0%, #1a5fd4 100%) !important;
      color: #fff !important;
      box-shadow: 0 4px 14px rgba(44,118,255,0.3) !important;
    }

    .driver-popover-next-btn:hover {
      box-shadow: 0 6px 20px rgba(44,118,255,0.4) !important;
      transform: translateY(-1px) !important;
    }

    .driver-popover-close-btn {
      color: #aaa !important;
      width: 32px !important;
      height: 32px !important;
      top: 16px !important;
      right: 16px !important;
      font-size: 18px !important;
    }

    .driver-popover-close-btn:hover {
      color: #555 !important;
    }

    .driver-popover-arrow {
      border: none !important;
    }

    .driver-popover-arrow-side-left,
    .driver-popover-arrow-side-right,
    .driver-popover-arrow-side-top,
    .driver-popover-arrow-side-bottom {
      border-color: transparent !important;
    }

    .driver-overlay {
      background: rgba(0,0,0,0.4) !important;
    }

    /* Floating replay button */
    .cp-tour-replay-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9990;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2C76FF 0%, #1a5fd4 100%);
      border: none;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 24px rgba(44,118,255,0.35);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      animation: cp-tour-btn-entrance 0.5s ease-out;
    }

    .cp-tour-replay-btn:hover {
      transform: scale(1.1) translateY(-2px);
      box-shadow: 0 10px 30px rgba(44,118,255,0.45);
    }

    .cp-tour-replay-btn svg {
      width: 22px;
      height: 22px;
    }

    @keyframes cp-tour-btn-entrance {
      from { opacity: 0; transform: scale(0.5) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* Tooltip for replay button */
    .cp-tour-replay-btn::before {
      content: 'Replay Tour';
      position: absolute;
      right: 62px;
      top: 50%;
      transform: translateY(-50%);
      background: #1E1E1E;
      color: #fff;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }

    .cp-tour-replay-btn:hover::before {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
};

const getTourSteps = () => [
  {
    popover: {
      title: '👋 Welcome to Career Partner!',
      description: 'Let us give you a quick tour of the platform. We\'ll walk you through every module so you can start finding your dream job right away.',
      side: 'center',
      align: 'center',
    },
  },
  {
    element: 'button[key="all_jobs"], nav button:nth-child(1)',
    popover: {
      title: '💼 All Jobs',
      description: 'Browse thousands of job listings from top companies worldwide. Filter by country, date, role, and more to find the perfect match.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: 'button[key="all_companies_list"], nav button:nth-child(2)',
    popover: {
      title: '🏢 All Companies',
      description: 'Explore 68,000+ companies that sponsor work visas. See job counts, click any company to see all their openings instantly.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: 'button[key="domains"], nav button:nth-child(3)',
    popover: {
      title: '🌐 Domains',
      description: 'Filter jobs by domain — Software Engineering, Data Science, Cloud, DevOps, and many more. Find roles that match your expertise.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: 'button[key="admin_stats"], nav button:nth-child(4)',
    popover: {
      title: '📊 Admin Stats',
      description: 'View platform-wide statistics including total jobs, companies, daily ingestion rates, and geographic distribution.',
      side: 'right',
      align: 'start',
    },
  },
  {
    popover: {
      title: '🚀 You\'re All Set!',
      description: 'Start exploring jobs right now. Use the sidebar to navigate between modules. Happy job hunting!',
      side: 'center',
      align: 'center',
    },
  },
];

/**
 * AppTour — Guided onboarding tour for Career Partner.
 *
 * Props:
 *   isDemoUser  — If true, the tour can be replayed unlimited times via a floating button.
 *   activeView  — Current active view ID (used to determine when the dashboard is ready).
 */
const AppTour = ({ activeView }) => {
  const [showReplayBtn, setShowReplayBtn] = useState(false);
  const [tourInstance, setTourInstance] = useState(null);

  const startTour = useCallback(() => {
    // Wait a tick for DOM elements to be rendered
    setTimeout(() => {
      // Find sidebar nav buttons by their text content
      const navButtons = document.querySelectorAll('nav button');
      
      const steps = [
        {
          popover: {
            title: '👋 Welcome to Career Partner!',
            description: 'Let us give you a quick tour of the platform. We\'ll walk you through every module so you can start finding your dream job right away.',
          },
        },
      ];

      // Map nav buttons to tour steps
      const buttonConfigs = [
        { text: 'All Jobs', title: '💼 All Jobs', desc: 'Browse thousands of job listings from top companies worldwide. Filter by country, date, role, and more to find the perfect match.' },
        { text: 'All Companies', title: '🏢 All Companies', desc: 'Explore 68,000+ companies that sponsor work visas. See job counts, click any company to see all their openings instantly.' },
        { text: 'Domains', title: '🌐 Domains', desc: 'Filter jobs by domain — Software Engineering, Data Science, Cloud, DevOps, and many more. Find roles that match your expertise.' },
        { text: 'Admin Stats', title: '📊 Admin Stats', desc: 'View platform-wide statistics including total jobs, companies, daily ingestion rates, and geographic distribution.' },
      ];

      buttonConfigs.forEach(config => {
        const btn = Array.from(navButtons).find(b => b.textContent.trim().includes(config.text));
        if (btn) {
          steps.push({
            element: btn,
            popover: {
              title: config.title,
              description: config.desc,
              side: 'right',
              align: 'start',
            },
          });
        }
      });

      // Add the global search header if visible
      const searchHeader = document.querySelector('[class*="GlobalSearchHeader"], [class*="global-search"]');
      if (searchHeader) {
        steps.push({
          element: searchHeader,
          popover: {
            title: '🔍 Global Filters',
            description: 'Use country and date filters to narrow down your job search across the entire platform. These filters apply to all modules.',
            side: 'bottom',
            align: 'center',
          },
        });
      }

      // Final step
      steps.push({
        popover: {
          title: '🚀 You\'re All Set!',
          description: 'Start exploring jobs right now. Use the sidebar to navigate between modules. Happy job hunting!',
        },
      });

      const driverInstance = driver({
        showProgress: true,
        animate: true,
        smoothScroll: true,
        stagePadding: 10,
        stageRadius: 12,
        allowClose: true,
        overlayClickBehavior: 'nextStep',
        popoverClass: 'cp-tour-popover',
        nextBtnText: 'Next →',
        prevBtnText: '← Back',
        doneBtnText: 'Let\'s Go! 🎉',
        progressText: '{{current}} of {{total}}',
        steps: steps,
        onDestroyed: () => {
          localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
          setShowReplayBtn(true);
        },
      });

      setTourInstance(driverInstance);
      driverInstance.drive();
    }, 800); // Small delay to ensure sidebar is rendered
  }, []);

  useEffect(() => {
    injectTourStyles();

    // Check if tour should auto-start
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);

    if (!tourCompleted) {
      startTour();
    } else {
      setShowReplayBtn(true);
    }
  }, []); // Run once on mount

  const handleReplay = () => {
    setShowReplayBtn(false);
    startTour();
  };

  // Show replay button if tour was completed
  if (!showReplayBtn) return null;

  return (
    <button
      className="cp-tour-replay-btn"
      onClick={handleReplay}
      aria-label="Replay Tour"
      title="Replay Tour"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
      </svg>
    </button>
  );
};

export default AppTour;
