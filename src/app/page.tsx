'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import dynamic from 'next/dynamic';

// Static imports
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

// Dynamic imports to avoid SSR issues and improve initial load
const TerminalBootSequence = dynamic(
    () => import('@/components/TerminalBootSequence'),
    { ssr: false }
);

const HeroSection = dynamic(
    () => import('@/components/HeroSection'),
    {
        ssr: false,
        loading: () => <div className="min-h-screen bg-void" />,
    }
);

const AboutSection = dynamic(
    () => import('@/components/AboutSection'),
    {
        ssr: false,
        loading: () => <div className="min-h-[50vh] bg-void" />,
    }
);

const CapabilitiesSection = dynamic(
    () => import('@/components/CapabilitiesSection'),
    {
        ssr: false,
        loading: () => <div className="min-h-[50vh] bg-void" />,
    }
);

const ProjectsSection = dynamic(
    () => import('@/components/ProjectsSection'),
    {
        ssr: false,
        loading: () => <div className="min-h-[50vh] bg-void" />,
    }
);

const ExperienceSection = dynamic(
    () => import('@/components/ExperienceSection'),
    {
        ssr: false,
        loading: () => <div className="min-h-[50vh] bg-void" />,
    }
);

const AchievementsSection = dynamic(
    () => import('@/components/AchievementsSection'),
    {
        ssr: false,
        loading: () => <div className="min-h-[50vh] bg-void" />,
    }
);

const ContactSection = dynamic(
    () => import('@/components/ContactSection'),
    {
        ssr: false,
        loading: () => <div className="min-h-[50vh] bg-void" />,
    }
);

// Scroll Progress Indicator
function ScrollProgress() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-green via-electric-purple to-cyber-blue origin-left z-50"
            style={{ scaleX }}
        />
    );
}

export default function Home() {
    const [bootComplete, setBootComplete] = useState(false);
    const [showContent, setShowContent] = useState(false);

    // Skip boot sequence in development for faster iteration
    useEffect(() => {
        // Check if we should skip the boot sequence (for dev purposes)
        const skipBoot = sessionStorage.getItem('skipBoot');
        if (skipBoot === 'true') {
            setBootComplete(true);
            setShowContent(true);
        }
    }, []);

    const handleBootComplete = () => {
        setBootComplete(true);
        // Slight delay before showing content for smooth transition
        setTimeout(() => {
            setShowContent(true);
            // Save to session storage to skip on reload during development
            sessionStorage.setItem('skipBoot', 'true');
        }, 500);
    };

    return (
        <>
            {/* Terminal Boot Sequence */}
            {!bootComplete && (
                <TerminalBootSequence onComplete={handleBootComplete} />
            )}

            {/* Main Content */}
            {showContent && (
                <>
                    <ScrollProgress />
                    <Navigation />

                    {/* Industry Standard Order */}
                    <HeroSection />
                    <AboutSection />
                    <CapabilitiesSection />
                    <ProjectsSection />
                    <ExperienceSection />
                    <AchievementsSection />
                    <ContactSection />

                    <Footer />
                </>
            )}
        </>
    );
}
