import React, { useEffect, useCallback, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import useAuth from '../hooks/useAuth';
import { supabase } from '../supabaseClient';

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
  `;
  document.head.appendChild(style);
};

/**
 * AppTour — Guided onboarding tour for Career Partner.
 * Shows only ONCE per user (stored in user metadata).
 * No floating replay button is shown.
 */
const AppTour = ({ activeView }) => {
  const { user } = useAuth();
  const [tourStarted, setTourStarted] = useState(false);

  const startTour = useCallback(() => {
    if (tourStarted || !user) return;
    setTourStarted(true);

    // Wait a tick for DOM elements to be rendered
    setTimeout(() => {
      const navButtons = document.querySelectorAll('nav button');

      const steps = [
        {
          popover: {
            title: '👋 Welcome to Career Partner!',
            description: 'Let us give you a quick tour of the platform. We\'ll walk you through every module so you can start finding your dream job right away.',
          },
        },
      ];

      const buttonConfigs = [
        { text: 'All Jobs',      title: '💼 All Jobs',      desc: 'Browse thousands of job listings from top companies worldwide. Filter by country, date, role, and more to find the perfect match.' },
        { text: 'All Companies', title: '🏢 All Companies', desc: 'Explore 68,000+ companies that sponsor work visas. See job counts, click any company to see all their openings instantly.' },
        { text: 'Domains',       title: '🌐 Domains',       desc: 'Filter jobs by domain — Software Engineering, Data Science, Cloud, DevOps, and many more. Find roles that match your expertise.' },
        { text: 'Admin Stats',   title: '📊 Admin Stats',   desc: 'View platform-wide statistics including total jobs, companies, daily ingestion rates, and geographic distribution.' },
      ];

      buttonConfigs.forEach(config => {
        const btn = Array.from(navButtons).find(b => b.textContent.trim().includes(config.text));
        if (btn) {
          steps.push({
            element: btn,
            popover: { title: config.title, description: config.desc, side: 'right', align: 'start' },
          });
        }
      });

      const searchHeader = document.querySelector('[class*="GlobalSearchHeader"], [class*="global-search"]');
      if (searchHeader) {
        steps.push({
          element: searchHeader,
          popover: {
            title: '🔍 Global Filters',
            description: 'Use country and date filters to narrow down your job search across the entire platform.',
            side: 'bottom',
            align: 'center',
          },
        });
      }

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
        steps,
        onDestroyed: async () => {
          // Mark as completed in backend so it never auto-starts again for this user anywhere
          if (user) {
            try {
              await supabase.auth.updateUser({
                data: { tour_completed_v1: true }
              });
            } catch (err) {
              console.error("Error updating tour status:", err);
            }
          }
        },
      });

      driverInstance.drive();
    }, 800);
  }, [user, tourStarted]);

  useEffect(() => {
    injectTourStyles();
    // Only show if user has never seen it before
    if (user && user.user_metadata) {
      const tourCompleted = user.user_metadata.tour_completed_v1;
      if (!tourCompleted && !tourStarted) {
        startTour();
      }
    }
  }, [startTour, user, tourStarted]);

  // No UI rendered — no floating button
  return null;
};

export default AppTour;
