'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PROJECTS, Project } from '@/data/portfolio';

// Status badge colors
const statusColors = {
    completed: 'bg-neon-green/20 text-neon-green border-neon-green/40',
    'in-progress': 'bg-electric-purple/20 text-electric-purple border-electric-purple/40',
    research: 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue/40',
};

// Category icons
const categoryIcons: Record<string, JSX.Element> = {
    'Cybersecurity AI': (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    ),
    'Healthcare Robotics': (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    ),
    'Reinforcement Learning': (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    '3D Visualization': (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
        </svg>
    ),
};

// GitHub icon
const GitHubIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
);

// External link icon
const ExternalLinkIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

interface ProjectCardProps {
    project: Project;
    index: number;
}

function ProjectCard({ project, index }: ProjectCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    const hasLink = project.github || project.demo;

    const CardWrapper = hasLink ? motion.a : motion.div;
    const cardProps = hasLink
        ? {
            href: project.github || project.demo,
            target: '_blank',
            rel: 'noopener noreferrer',
        }
        : {};

    return (
        <div ref={ref}>
            <CardWrapper
                className={`cyber-card h-full flex flex-col group ${hasLink ? 'cursor-pointer' : ''}`}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={hasLink ? { y: -8 } : undefined}
                {...cardProps}
            >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                    {/* Icon */}
                    <div className="p-3 bg-neon-green/10 rounded border border-neon-green/20 text-neon-green group-hover:bg-neon-green/20 transition-colors">
                        {categoryIcons[project.category] || (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        )}
                    </div>

                    {/* Status Badge & Link Icons */}
                    <div className="flex items-center gap-2">
                        {project.github && (
                            <span className="p-2 text-gray-400 hover:text-neon-green transition-colors">
                                <GitHubIcon />
                            </span>
                        )}
                        {project.demo && (
                            <span className="p-2 text-gray-400 hover:text-electric-purple transition-colors">
                                <ExternalLinkIcon />
                            </span>
                        )}
                        <span className={`px-2 py-1 text-xs mono border rounded ${statusColors[project.status]}`}>
                            {project.status.replace('-', ' ')}
                        </span>
                    </div>
                </div>

                {/* Title & Category */}
                <div className="mb-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-neon-green transition-colors mono flex items-center gap-2">
                        {project.title}
                        {hasLink && (
                            <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        )}
                    </h3>
                    <p className="text-electric-purple text-sm mono mt-1">
                        {project.category}
                    </p>
                </div>

                {/* Problem → Approach → Outcome */}
                <div className="flex-grow mb-4 space-y-3">
                    <div>
                        <h4 className="text-xs mono text-gray-500 mb-1">Problem</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">{project.problem}</p>
                    </div>
                    <div>
                        <h4 className="text-xs mono text-gray-500 mb-1">Approach</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">{project.approach}</p>
                    </div>
                    <div>
                        <h4 className="text-xs mono text-gray-500 mb-1">Outcome</h4>
                        <p className="text-sm text-neon-green/80 leading-relaxed font-medium">{project.outcome}</p>
                    </div>
                </div>

                {/* Features */}
                {project.features && project.features.length > 0 && (
                    <div className="mb-4">
                        <ul className="space-y-1">
                            {project.features.slice(0, 3).map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                                    <span className="text-neon-green">▸</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Technologies */}
                <div className="pt-4 border-t border-void-light">
                    <div className="flex flex-wrap gap-2">
                        {project.technologies.slice(0, 5).map((tech) => (
                            <span
                                key={tech}
                                className="px-2 py-1 text-xs mono bg-void-light text-gray-400 rounded"
                            >
                                {tech}
                            </span>
                        ))}
                        {project.technologies.length > 5 && (
                            <span className="px-2 py-1 text-xs mono text-neon-green">
                                +{project.technologies.length - 5}
                            </span>
                        )}
                    </div>
                </div>

                {/* Click hint for projects with links */}
                {hasLink && (
                    <div className="mt-4 pt-3 border-t border-neon-green/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs mono text-neon-green flex items-center gap-2">
                            <span className="animate-pulse">●</span>
                            Click to view on GitHub
                        </span>
                    </div>
                )}

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg">
                    <div className="absolute inset-0 bg-gradient-to-t from-neon-green/5 to-transparent" />
                </div>
            </CardWrapper>
        </div>
    );
}

export default function ProjectsSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

    const featuredProjects = PROJECTS.filter((p) => p.featured);

    return (
        <section
            id="projects"
            ref={sectionRef}
            className="relative py-24 md:py-32 px-4 bg-void-dark/50"
        >
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="section-title gradient-text">Featured Projects</h2>
                    <p className="text-gray-400 mt-6 max-w-xl mx-auto">
                        Showcasing innovative solutions at the intersection of AI, automation, and creative technology.
                    </p>
                </motion.div>

                {/* Terminal Header */}
                <motion.div
                    className="mb-12 p-4 bg-void-dark border border-electric-purple/20 rounded max-w-2xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <code className="mono text-sm text-electric-purple">
                        <span className="text-gray-500">$</span> ls -la ./projects --featured
                    </code>
                </motion.div>

                {/* Projects Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredProjects.map((project, index) => (
                        <ProjectCard key={project.id} project={project} index={index} />
                    ))}
                </div>

                {/* View More Link */}
                <motion.div
                    className="mt-12 text-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                >
                    <a
                        href="https://github.com/Muhammed-Farrag"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-cyber group inline-flex"
                    >
                        <span>VIEW ALL ON GITHUB</span>
                        <svg
                            className="w-4 h-4 transition-transform group-hover:translate-x-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </a>
                </motion.div>
            </div>

            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-green/30 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-electric-purple/30 to-transparent" />
        </section>
    );
}
