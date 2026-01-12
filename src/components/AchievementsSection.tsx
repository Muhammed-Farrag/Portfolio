'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ACHIEVEMENTS } from '@/data/portfolio';

// Trophy icon
const TrophyIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
    </svg>
);

export default function AchievementsSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

    return (
        <section
            id="achievements"
            ref={sectionRef}
            className="relative py-24 md:py-32 px-4 bg-void-dark/50"
        >
            <div className="max-w-5xl mx-auto">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="section-title gradient-text">Achievements</h2>
                    <p className="text-gray-400 mt-6 max-w-2xl mx-auto">
                        Competitive achievements that validate applied expertise and execution capability under real-world constraints.
                    </p>
                </motion.div>

                {/* Achievements Grid */}
                <div className="space-y-8">
                    {ACHIEVEMENTS.map((achievement, index) => {
                        const CardWrapper = achievement.link ? motion.a : motion.div;
                        const cardProps = achievement.link
                            ? {
                                href: achievement.link,
                                target: '_blank',
                                rel: 'noopener noreferrer',
                                whileHover: { y: -4 },
                            }
                            : {};

                        return (
                            <CardWrapper
                                key={achievement.id}
                                className={`relative block ${achievement.link ? 'cursor-pointer group' : ''}`}
                                initial={{ opacity: 0, y: 40 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                {...cardProps}
                            >
                                {/* Achievement Card */}
                                <div className="cyber-card overflow-hidden">
                                    {/* Top gradient bar */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-green via-electric-purple to-cyber-blue" />

                                    <div className="flex flex-col md:flex-row gap-6 p-6">
                                        {/* Trophy & Rank */}
                                        <div className="flex-shrink-0 flex flex-col items-center justify-center">
                                            <motion.div
                                                className="relative"
                                                animate={{
                                                    rotate: [0, 5, -5, 0],
                                                    scale: [1, 1.05, 1],
                                                }}
                                                transition={{
                                                    duration: 3,
                                                    repeat: Infinity,
                                                    ease: 'easeInOut',
                                                }}
                                            >
                                                {/* Glow effect */}
                                                <div className="absolute inset-0 bg-yellow-400/30 blur-xl rounded-full" />

                                                {/* Trophy container */}
                                                <div className="relative w-20 h-20 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                                                    <span className="text-void-dark">
                                                        <TrophyIcon />
                                                    </span>
                                                </div>
                                            </motion.div>

                                            {/* Rank badge */}
                                            <motion.div
                                                className="mt-3 px-4 py-2 bg-gradient-to-r from-neon-green to-electric-purple rounded-full"
                                                initial={{ scale: 0 }}
                                                animate={isInView ? { scale: 1 } : {}}
                                                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                                            >
                                                <span className="mono text-sm font-bold text-void-dark">
                                                    {achievement.rank}
                                                </span>
                                            </motion.div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1">
                                            {/* Header */}
                                            <div className="mb-4">
                                                <h3 className="text-2xl font-bold text-white mono mb-1 flex items-center gap-2">
                                                    {achievement.title}
                                                    {achievement.link && (
                                                        <svg className="w-5 h-5 text-neon-green opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    )}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                                    <span className="text-electric-purple mono">
                                                        {achievement.event}
                                                    </span>
                                                    <span className="text-gray-500">•</span>
                                                    <span className="text-gray-400">
                                                        📍 {achievement.location}
                                                    </span>
                                                    <span className="text-gray-500">•</span>
                                                    <span className="text-neon-green mono">
                                                        {achievement.year}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <p className="text-gray-300 mb-4 leading-relaxed">
                                                {achievement.description}
                                            </p>

                                            {/* Validation */}
                                            <div className="grid sm:grid-cols-2 gap-2">
                                                {achievement.validation.map((item, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        className="flex items-start gap-2 text-sm"
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                                                        transition={{ delay: 0.5 + idx * 0.1 }}
                                                    >
                                                        <span className="text-neon-green mt-0.5">✓</span>
                                                        <span className="text-gray-400">{item}</span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Decorative corner */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-neon-green/10 to-transparent pointer-events-none" />
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-electric-purple/10 to-transparent pointer-events-none" />
                                </div>
                            </CardWrapper>
                        );
                    })}
                </div>

                {/* Terminal Footer */}
                <motion.div
                    className="mt-12 text-center"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.8 }}
                >
                    <p className="mono text-sm text-gray-500">
                        <span className="text-neon-green">{'>'}</span> Competition results demonstrate applied expertise and execution capability
                    </p>
                </motion.div>
            </div>

            {/* Background decorations */}
            <div className="absolute top-1/3 left-0 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-electric-purple/5 rounded-full blur-3xl pointer-events-none" />
        </section>
    );
}
