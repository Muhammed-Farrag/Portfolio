'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { PROFILE } from '@/data/portfolio';

// Dynamically import 3D background to avoid SSR issues
const HeroBackground = dynamic(() => import('./HeroBackground'), {
    ssr: false,
    loading: () => (
        <div className="absolute inset-0 bg-void" />
    ),
});

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.3,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    },
};

const glitchVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.5,
            ease: 'easeOut',
        },
    },
};

export default function HeroSection() {
    const [mounted, setMounted] = useState(false);
    const [glitchText, setGlitchText] = useState(PROFILE.name);

    useEffect(() => {
        setMounted(true);

        // Glitch effect on name
        const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        let iterations = 0;
        const maxIterations = PROFILE.name.length;

        const glitchInterval = setInterval(() => {
            setGlitchText(
                PROFILE.name
                    .split('')
                    .map((char, index) => {
                        if (index < iterations) {
                            return PROFILE.name[index];
                        }
                        return glitchChars[Math.floor(Math.random() * glitchChars.length)];
                    })
                    .join('')
            );

            iterations += 1 / 3;

            if (iterations >= maxIterations) {
                clearInterval(glitchInterval);
                setGlitchText(PROFILE.name);
            }
        }, 30);

        return () => clearInterval(glitchInterval);
    }, []);

    if (!mounted) return null;

    return (
        <section
            id="home"
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
        >
            {/* 3D Background */}
            <HeroBackground />

            {/* Content */}
            <motion.div
                className="relative z-10 text-center px-4 max-w-5xl mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Terminal Prefix */}
                <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-center gap-2 mb-6"
                >
                    <span className="mono text-sm text-neon-green/60">
                        {'>'} system.identify()
                    </span>
                    <span className="w-2 h-4 bg-neon-green animate-pulse" />
                </motion.div>

                {/* Name with Glitch Effect */}
                <motion.h1
                    variants={glitchVariants}
                    className="mono text-5xl md:text-7xl lg:text-8xl font-bold mb-4 relative"
                >
                    <span className="relative inline-block">
                        {/* Main text */}
                        <span className="relative z-10 gradient-text">
                            {glitchText}
                        </span>

                        {/* Glitch layers */}
                        <span
                            className="absolute inset-0 text-neon-green opacity-50"
                            style={{
                                clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
                                transform: 'translate(-2px, 0)',
                            }}
                            aria-hidden="true"
                        >
                            {PROFILE.name}
                        </span>
                        <span
                            className="absolute inset-0 text-electric-purple opacity-50"
                            style={{
                                clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)',
                                transform: 'translate(2px, 0)',
                            }}
                            aria-hidden="true"
                        >
                            {PROFILE.name}
                        </span>
                    </span>
                </motion.h1>

                {/* Role */}
                <motion.h2
                    variants={itemVariants}
                    className="text-xl md:text-2xl lg:text-3xl text-electric-purple mb-6 mono"
                >
                    <span className="text-neon-green/40">{'<'}</span>
                    {PROFILE.role}
                    <span className="text-neon-green/40">{' />'}</span>
                </motion.h2>

                {/* Tagline */}
                <motion.p
                    variants={itemVariants}
                    className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    {PROFILE.tagline}
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row items-center justify-center gap-8"
                >
                    <motion.a
                        href="#projects"
                        className="btn-cyber btn-cyber-filled group"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="relative z-10">VIEW PROJECTS</span>
                        <svg
                            className="w-4 h-4 transition-transform group-hover:translate-x-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                        </svg>
                    </motion.a>

                    <motion.a
                        href="#contact"
                        className="btn-cyber group"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="relative z-10">CONNECT</span>
                        <svg
                            className="w-4 h-4 transition-transform group-hover:translate-y-[-2px]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                    </motion.a>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
                    style={{ marginLeft: '9px' }}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2, duration: 0.8 }}
                >
                    <motion.div
                        className="flex flex-col items-center text-neon-green/50"
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <span className="mono text-xs mb-2">SCROLL</span>
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                        </svg>
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute top-20 left-10 hidden lg:block">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                    className="mono text-xs text-neon-green/30 space-y-1"
                >
                    <div>{'// neural_interface v2.0'}</div>
                    <div>{'// status: ONLINE'}</div>
                    <div>{'// latency: 0.042ms'}</div>
                </motion.div>
            </div>

            <div className="absolute top-20 right-10 hidden lg:block">
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                    className="mono text-xs text-electric-purple/30 text-right space-y-1"
                >
                    <div>{'system.cores: 8'}</div>
                    <div>{'memory.allocated: 16GB'}</div>
                    <div>{'gpu.status: ACTIVE'}</div>
                </motion.div>
            </div>

            {/* Corner Brackets */}
            <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-neon-green/20" />
            <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-electric-purple/20" />
            <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-electric-purple/20" />
            <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-neon-green/20" />
        </section>
    );
}
