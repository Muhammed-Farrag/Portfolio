'use client';

import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { PROFILE, RESEARCH } from '@/data/portfolio';

export default function AboutSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start end', 'end start'],
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

    return (
        <section
            id="about"
            ref={sectionRef}
            className="relative py-24 md:py-32 px-4 overflow-hidden"
        >
            {/* Floating geometric shapes */}
            <motion.div
                className="absolute top-20 right-10 w-64 h-64 border border-neon-green/20 rotate-45"
                style={{ y }}
            />
            <motion.div
                className="absolute bottom-20 left-10 w-48 h-48 border border-electric-purple/20 rotate-12"
                style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]) }}
            />

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="section-title gradient-text">About</h2>
                    <p className="text-gray-400 mt-6 max-w-xl mx-auto mono text-sm">
                        <span className="text-neon-green">{'>'}</span> system.getProfile()
                    </p>
                </motion.div>

                {/* Main Content */}
                <motion.div
                    className="cyber-card"
                    style={{ opacity }}
                >
                    {/* Value Proposition */}
                    <motion.div
                        className="mb-8 pb-8 border-b border-neon-green/20"
                        initial={{ opacity: 0, x: -30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.2 }}
                    >
                        <h3 className="text-2xl font-bold text-white mb-4 mono">
                            <span className="text-neon-green/50">{'// '}</span>
                            Value Proposition
                        </h3>
                        <p className="text-xl text-gray-300 leading-relaxed">
                            {PROFILE.valueProposition}
                        </p>
                    </motion.div>

                    {/* About Narrative */}
                    <motion.div
                        className="mb-8 pb-8 border-b border-electric-purple/20"
                        initial={{ opacity: 0, x: 30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.3 }}
                    >
                        <h3 className="text-xl font-bold text-white mb-4 mono">
                            <span className="text-electric-purple/50">{'// '}</span>
                            Background
                        </h3>
                        <p className="text-gray-300 leading-relaxed">
                            {PROFILE.about}
                        </p>
                    </motion.div>

                    {/* Current Focus */}
                    <motion.div
                        className="mb-8 pb-8 border-b border-cyber-blue/20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.4 }}
                    >
                        <h3 className="text-xl font-bold text-white mb-4 mono">
                            <span className="text-cyber-blue/50">{'// '}</span>
                            Current Focus
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {PROFILE.currentFocus.map((focus, index) => (
                                <motion.div
                                    key={index}
                                    className="flex items-start gap-2 text-gray-300"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ delay: 0.5 + index * 0.1 }}
                                >
                                    <span className="text-neon-green mt-1">▹</span>
                                    <span className="text-sm">{focus}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Research Track */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="bg-gradient-to-r from-electric-purple/10 to-neon-green/10 p-6 rounded border border-electric-purple/30">
                            <div className="flex items-center gap-3 mb-3">
                                <svg className="w-6 h-6 text-electric-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <h3 className="text-lg font-bold text-white mono">
                                    Research Track: {RESEARCH.currentTrack}
                                </h3>
                            </div>
                            <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                                {RESEARCH.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {RESEARCH.areas.map((area, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 text-xs mono bg-electric-purple/20 text-electric-purple border border-electric-purple/40 rounded"
                                    >
                                        {area}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Specializations */}
                <motion.div
                    className="mt-12 flex flex-wrap justify-center gap-4"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.8 }}
                >
                    {PROFILE.specializations.map((spec, index) => (
                        <motion.div
                            key={index}
                            className="px-6 py-3 bg-void-dark border border-neon-green/40 rounded-full"
                            whileHover={{ scale: 1.05, borderColor: 'rgba(0, 255, 65, 0.8)' }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ delay: 0.9 + index * 0.1 }}
                        >
                            <span className="mono text-sm text-neon-green">{spec}</span>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-electric-purple/5 rounded-full blur-3xl pointer-events-none" />
        </section>
    );
}
