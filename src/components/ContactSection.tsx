'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { PROFILE, SOCIAL_LINKS } from '@/data/portfolio';

// Social icons
const socialIcons: Record<string, JSX.Element> = {
    github: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
    ),
    linkedin: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    ),
    email: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
};

export default function ContactSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
    const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormStatus('sending');

        // Simulate form submission
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setFormStatus('sent');

        // Reset after 3 seconds
        setTimeout(() => setFormStatus('idle'), 3000);
    };

    return (
        <section
            id="contact"
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
                    <h2 className="section-title gradient-text">Get In Touch</h2>
                    <p className="text-gray-400 mt-6 max-w-xl mx-auto">
                        Ready to build something amazing? Let&apos;s connect and discuss how we can work together.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="cyber-card h-full">
                            {/* Terminal Header */}
                            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-void-light">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="ml-2 mono text-xs text-neon-green/50">contact.sh</span>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-6 mono text-sm">
                                <div>
                                    <span className="text-gray-500">const</span>{' '}
                                    <span className="text-electric-purple">name</span>{' '}
                                    <span className="text-gray-500">=</span>{' '}
                                    <span className="text-neon-green">&quot;{PROFILE.name}&quot;</span>;
                                </div>
                                <div>
                                    <span className="text-gray-500">const</span>{' '}
                                    <span className="text-electric-purple">role</span>{' '}
                                    <span className="text-gray-500">=</span>{' '}
                                    <span className="text-neon-green">&quot;{PROFILE.role}&quot;</span>;
                                </div>
                                <div>
                                    <span className="text-gray-500">const</span>{' '}
                                    <span className="text-electric-purple">location</span>{' '}
                                    <span className="text-gray-500">=</span>{' '}
                                    <span className="text-neon-green">&quot;{PROFILE.location}&quot;</span>;
                                </div>
                                <div>
                                    <span className="text-gray-500">const</span>{' '}
                                    <span className="text-electric-purple">status</span>{' '}
                                    <span className="text-gray-500">=</span>{' '}
                                    <span className="text-neon-green">&quot;Open to opportunities&quot;</span>;
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="mt-8 pt-6 border-t border-void-light">
                                <p className="mono text-xs text-gray-500 mb-4">// social_links</p>
                                <div className="flex gap-4">
                                    {SOCIAL_LINKS.map((link) => (
                                        <motion.a
                                            key={link.platform}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-void-light border border-neon-green/20 text-gray-400 hover:text-neon-green hover:border-neon-green transition-all rounded"
                                            whileHover={{ scale: 1.1, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {socialIcons[link.icon]}
                                        </motion.a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <form onSubmit={handleSubmit} className="cyber-card">
                            <div className="space-y-6">
                                {/* Name Input */}
                                <div>
                                    <label className="block mono text-sm text-gray-400 mb-2">
                                        <span className="text-neon-green">{'>'}</span> name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-void-dark border border-neon-green/20 text-white mono text-sm focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green/50 transition-all rounded"
                                        placeholder=""
                                    />
                                </div>

                                {/* Email Input */}
                                <div>
                                    <label className="block mono text-sm text-gray-400 mb-2">
                                        <span className="text-neon-green">{'>'}</span> email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 bg-void-dark border border-neon-green/20 text-white mono text-sm focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green/50 transition-all rounded"
                                        placeholder=""
                                    />
                                </div>

                                {/* Message Input */}
                                <div>
                                    <label className="block mono text-sm text-gray-400 mb-2">
                                        <span className="text-neon-green">{'>'}</span> message
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        className="w-full px-4 py-3 bg-void-dark border border-neon-green/20 text-white mono text-sm focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green/50 transition-all rounded resize-none"
                                        placeholder=""
                                    />
                                </div>

                                {/* Submit Button */}
                                <motion.button
                                    type="submit"
                                    className="btn-cyber btn-cyber-filled w-full justify-center"
                                    disabled={formStatus === 'sending' || formStatus === 'sent'}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {formStatus === 'idle' && (
                                        <>
                                            <span>SEND MESSAGE</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </>
                                    )}
                                    {formStatus === 'sending' && (
                                        <span className="flex items-center gap-2">
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            TRANSMITTING...
                                        </span>
                                    )}
                                    {formStatus === 'sent' && (
                                        <span className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            MESSAGE SENT!
                                        </span>
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>

            {/* Background Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-electric-purple/10 rounded-full blur-3xl pointer-events-none" />
        </section>
    );
}
