'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { CAPABILITIES, Capability } from '@/data/portfolio';

const levelColors = {
    core: {
        border: 'border-neon-green',
        text: 'text-neon-green',
        bg: 'bg-neon-green/10',
        glow: 'shadow-neon-green',
    },
    systems: {
        border: 'border-electric-purple',
        text: 'text-electric-purple',
        bg: 'bg-electric-purple/10',
        glow: 'shadow-neon-purple',
    },
    tooling: {
        border: 'border-cyber-blue',
        text: 'text-cyber-blue',
        bg: 'bg-cyber-blue/10',
        glow: 'shadow-neon-blue',
    },
};

const levelLabels = {
    core: 'Core Capabilities',
    systems: 'Systems & Architecture',
    tooling: 'Tools & Technologies',
};

interface CapabilityCardProps {
    capability: Capability;
    index: number;
}

function CapabilityCard({ capability, index }: CapabilityCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const colors = levelColors[capability.level];

    return (
        <motion.div
            className={`cyber-card cursor-pointer ${colors.border} border-opacity-30 hover:border-opacity-100 transition-all`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {/* Level Badge */}
            <div className="absolute -top-3 right-4">
                <span className={`px-3 py-1 text-xs mono ${colors.bg} ${colors.text} border ${colors.border} rounded-full`}>
                    {levelLabels[capability.level]}
                </span>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className={`text-lg font-bold ${colors.text} mono mb-2`}>
                        {capability.category}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        {capability.description}
                    </p>
                </div>

                {/* Expand Icon */}
                <motion.div
                    className={`ml-4 ${colors.text}`}
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </motion.div>
            </div>

            {/* Skills List */}
            <motion.div
                initial={false}
                animate={{
                    height: isExpanded ? 'auto' : 0,
                    opacity: isExpanded ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
            >
                <div className="pt-4 mt-4 border-t border-void-light space-y-2">
                    {capability.skills.map((skill, idx) => (
                        <motion.div
                            key={idx}
                            className="flex items-center gap-2 text-sm text-gray-300"
                            initial={{ opacity: 0, x: -10 }}
                            animate={isExpanded ? { opacity: 1, x: 0 } : {}}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <span className={colors.text}>✓</span>
                            <span>{skill}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Click Hint */}
            {!isExpanded && (
                <div className="mt-3 pt-3 border-t border-void-light/50">
                    <span className="text-xs mono text-gray-500 flex items-center gap-2">
                        <span className="animate-pulse">●</span>
                        Click to expand
                    </span>
                </div>
            )}
        </motion.div>
    );
}

export default function CapabilitiesSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

    // Group capabilities by level
    const coreCapabilities = CAPABILITIES.filter((c) => c.level === 'core');
    const systemsCapabilities = CAPABILITIES.filter((c) => c.level === 'systems');
    const toolingCapabilities = CAPABILITIES.filter((c) => c.level === 'tooling');

    return (
        <section
            id="capabilities"
            ref={sectionRef}
            className="relative py-24 md:py-32 px-4 bg-void-dark/30"
        >
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="section-title gradient-text">Capabilities</h2>
                    <p className="text-gray-400 mt-6 max-w-2xl mx-auto">
                        Hierarchical skill structure: from core competencies to systems thinking and tooling expertise.
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
                        <span className="text-gray-500">$</span> tree ./capabilities --depth=3
                    </code>
                </motion.div>

                {/* Core Capabilities */}
                <div className="mb-12">
                    <motion.h3
                        className="text-xl mono font-bold text-neon-green mb-6 flex items-center gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.4 }}
                    >
                        <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                        Core Capabilities
                    </motion.h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        {coreCapabilities.map((capability, index) => (
                            <CapabilityCard key={capability.category} capability={capability} index={index} />
                        ))}
                    </div>
                </div>

                {/* Systems & Architecture */}
                <div className="mb-12">
                    <motion.h3
                        className="text-xl mono font-bold text-electric-purple mb-6 flex items-center gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.5 }}
                    >
                        <span className="w-2 h-2 bg-electric-purple rounded-full animate-pulse" />
                        Systems & Architecture
                    </motion.h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        {systemsCapabilities.map((capability, index) => (
                            <CapabilityCard key={capability.category} capability={capability} index={index + coreCapabilities.length} />
                        ))}
                    </div>
                </div>

                {/* Tools & Technologies */}
                <div>
                    <motion.h3
                        className="text-xl mono font-bold text-cyber-blue mb-6 flex items-center gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.6 }}
                    >
                        <span className="w-2 h-2 bg-cyber-blue rounded-full animate-pulse" />
                        Tools & Technologies
                    </motion.h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        {toolingCapabilities.map((capability, index) => (
                            <CapabilityCard key={capability.category} capability={capability} index={index + coreCapabilities.length + systemsCapabilities.length} />
                        ))}
                    </div>
                </div>

                {/* Capability Philosophy */}
                <motion.div
                    className="mt-16 text-center"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.8 }}
                >
                    <p className="mono text-sm text-gray-500 max-w-2xl mx-auto">
                        <span className="text-neon-green">{'>'}</span> Capabilities over buzzwords. Outcomes over descriptions. System thinking over resume styling.
                    </p>
                </motion.div>
            </div>

            {/* Background decorations */}
            <div className="absolute top-1/4 left-0 w-64 h-64 bg-neon-green/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-electric-purple/5 rounded-full blur-3xl pointer-events-none" />
        </section>
    );
}
