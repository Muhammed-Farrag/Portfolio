'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { SKILLS, Skill } from '@/data/portfolio';

// Category icons and colors
const categoryConfig: Record<string, { color: string; label: string }> = {
    language: { color: 'neon-green', label: 'Languages' },
    ai: { color: 'electric-purple', label: 'AI / ML' },
    framework: { color: 'cyber-blue', label: 'Frameworks' },
    tool: { color: 'neon-green', label: 'Tools' },
    cloud: { color: 'electric-purple', label: 'Cloud' },
    database: { color: 'cyber-blue', label: 'Databases' },
};

interface SkillChipProps {
    skill: Skill;
    index: number;
}

function SkillChip({ skill, index }: SkillChipProps) {
    const isAI = skill.category === 'ai' || skill.category === 'cloud';

    return (
        <motion.div
            className={`skill-chip ${isAI ? 'ai' : ''} group cursor-pointer`}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
        >
            <span className="relative z-10">{skill.name}</span>

            {/* Proficiency indicator */}
            <div className="ml-2 w-12 h-1 bg-void-light rounded-full overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${isAI ? 'bg-electric-purple' : 'bg-neon-green'}`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${skill.proficiency}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.05 + 0.3 }}
                />
            </div>
        </motion.div>
    );
}

export default function SkillsSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

    // Group skills by category
    const groupedSkills = SKILLS.reduce((acc, skill) => {
        if (!acc[skill.category]) {
            acc[skill.category] = [];
        }
        acc[skill.category].push(skill);
        return acc;
    }, {} as Record<string, Skill[]>);

    return (
        <section
            id="skills"
            ref={sectionRef}
            className="relative py-24 md:py-32 px-4"
        >
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="section-title gradient-text">Skills & Technologies</h2>
                    <p className="text-gray-400 mt-6 max-w-xl mx-auto">
                        A comprehensive toolkit for building intelligent systems and scalable applications.
                    </p>
                </motion.div>

                {/* Terminal Header */}
                <motion.div
                    className="mb-12 p-4 bg-void-dark border border-neon-green/20 rounded max-w-2xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <code className="mono text-sm text-neon-green">
                        <span className="text-gray-500">$</span> npm list --depth=0 @skills
                    </code>
                </motion.div>

                {/* Skills Grid by Category */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Object.entries(groupedSkills).map(([category, skills], categoryIndex) => (
                        <motion.div
                            key={category}
                            className="cyber-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                        >
                            {/* Category Header */}
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-void-light">
                                <div
                                    className={`w-3 h-3 rounded-full ${categoryConfig[category]?.color === 'electric-purple'
                                            ? 'bg-electric-purple'
                                            : categoryConfig[category]?.color === 'cyber-blue'
                                                ? 'bg-cyber-blue'
                                                : 'bg-neon-green'
                                        }`}
                                />
                                <h3 className="mono text-sm text-white uppercase tracking-wider">
                                    {categoryConfig[category]?.label || category}
                                </h3>
                            </div>

                            {/* Skills */}
                            <div className="flex flex-wrap gap-2">
                                {skills.map((skill, index) => (
                                    <SkillChip
                                        key={skill.name}
                                        skill={skill}
                                        index={categoryIndex * 10 + index}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Decorative Grid */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-purple/5 rounded-full blur-3xl" />
                </div>
            </div>
        </section>
    );
}
