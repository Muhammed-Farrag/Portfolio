'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { EXPERIENCES, Experience } from '@/data/portfolio';

// Icon components for different experience types
const ExperienceIcons = {
    automation: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    ai: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    training: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    ),
    intern: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
};

interface TimelineItemProps {
    experience: Experience;
    index: number;
    isLast: boolean;
}

function TimelineItem({ experience, index, isLast }: TimelineItemProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    const isEven = index % 2 === 0;

    return (
        <motion.div
            ref={ref}
            className="relative flex items-start gap-6 md:gap-10"
            initial={{ opacity: 0, x: isEven ? -50 : 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.2 }}
        >
            {/* Timeline Node */}
            <div className="relative flex-shrink-0">
                {/* Vertical Line */}
                {!isLast && (
                    <div
                        className="absolute left-1/2 top-10 -translate-x-1/2 w-0.5 h-full"
                        style={{
                            background: 'linear-gradient(180deg, #00ff41 0%, #bf00ff 100%)',
                        }}
                    />
                )}

                {/* Node Circle */}
                <motion.div
                    className="relative z-10 w-10 h-10 rounded-full bg-void border-2 border-neon-green flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: index * 0.2 + 0.2 }}
                    whileHover={{
                        scale: 1.2,
                        boxShadow: '0 0 20px rgba(0, 255, 65, 0.6)',
                    }}
                >
                    <span className="text-neon-green">
                        {ExperienceIcons[experience.icon]}
                    </span>
                </motion.div>

                {/* Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-neon-green/20 blur-md animate-pulse" />
            </div>

            {/* Content Card */}
            <motion.div
                className="flex-1 pb-12 last:pb-0"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
            >
                <div className="cyber-card group">
                    {/* Date Badge */}
                    <div className="absolute -top-3 left-4 z-20">
                        <span className="inline-block px-3 py-1.5 text-xs mono bg-void-dark border border-neon-green/60 text-neon-green rounded no-underline" style={{ textDecoration: 'none' }}>
                            {experience.startDate} → {experience.endDate}
                        </span>
                    </div>

                    {/* Header */}
                    <div className="mt-4 mb-4">
                        <h3 className="text-xl font-bold text-white group-hover:text-neon-green transition-colors mono">
                            {experience.role}
                        </h3>
                        <p className="text-electric-purple mono text-sm">
                            @ {experience.company}
                        </p>
                    </div>

                    {/* Description */}
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                        {experience.description}
                    </p>

                    {/* Impact */}
                    {experience.impact && (
                        <ul className="space-y-2 mb-4">
                            {experience.impact.map((item, idx) => (
                                <li
                                    key={idx}
                                    className="flex items-start gap-2 text-sm text-gray-300"
                                >
                                    <span className="text-neon-green mt-1">▸</span>
                                    <span className="font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Technologies */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-void-light">
                        {experience.technologies.map((tech, idx) => (
                            <motion.span
                                key={tech}
                                className="skill-chip text-xs"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.3, delay: index * 0.2 + 0.4 + idx * 0.05 }}
                            >
                                {tech}
                            </motion.span>
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function ExperienceSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

    return (
        <section
            id="experience"
            ref={sectionRef}
            className="relative py-24 md:py-32 px-4"
        >
            <div className="max-w-4xl mx-auto">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="section-title gradient-text">Experience</h2>
                    <p className="text-gray-400 mt-6 max-w-xl mx-auto">
                        A journey through my professional evolution in AI, automation, and software development.
                    </p>
                </motion.div>

                {/* Terminal Header */}
                <motion.div
                    className="mb-8 p-4 bg-void-dark border border-neon-green/20 rounded"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                    <code className="mono text-sm text-neon-green">
                        <span className="text-gray-500">$</span> cat experience.log
                    </code>
                </motion.div>

                {/* Timeline */}
                <div className="relative ml-4 md:ml-0">
                    {EXPERIENCES.map((experience, index) => (
                        <TimelineItem
                            key={experience.id}
                            experience={experience}
                            index={index}
                            isLast={index === EXPERIENCES.length - 1}
                        />
                    ))}
                </div>
            </div>

            {/* Background Decorations */}
            <div className="absolute top-1/4 left-0 w-64 h-64 bg-neon-green/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-electric-purple/5 rounded-full blur-3xl pointer-events-none" />
        </section>
    );
}
