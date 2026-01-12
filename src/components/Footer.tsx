'use client';

import { motion } from 'framer-motion';
import { PROFILE, NAV_LINKS, SOCIAL_LINKS } from '@/data/portfolio';

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
    twitter: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
    ),
};

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative py-12 px-4 border-t border-neon-green/10">
            <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                    {/* Brand */}
                    <div>
                        <motion.a
                            href="#home"
                            className="mono text-2xl font-bold text-neon-green inline-block"
                            whileHover={{ scale: 1.05 }}
                        >
                            <span className="text-white">{'<'}</span>
                            MF
                            <span className="text-white">{' />'}</span>
                        </motion.a>
                        <p className="text-gray-400 text-sm mt-4 max-w-xs">
                            {PROFILE.tagline}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="mono text-sm text-white mb-4">
                            <span className="text-neon-green/50">{'// '}</span>
                            Quick Links
                        </h4>
                        <ul className="space-y-2">
                            {NAV_LINKS.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        className="text-gray-400 text-sm hover:text-neon-green transition-colors"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Connect */}
                    <div>
                        <h4 className="mono text-sm text-white mb-4">
                            <span className="text-electric-purple/50">{'// '}</span>
                            Connect
                        </h4>
                        <div className="flex gap-3">
                            {SOCIAL_LINKS.map((link) => (
                                <motion.a
                                    key={link.platform}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-void-light border border-neon-green/20 text-gray-400 hover:text-neon-green hover:border-neon-green transition-all rounded"
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {socialIcons[link.icon]}
                                </motion.a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-neon-green/20 to-transparent mb-8" />

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm mono">
                        {/* ASCII Art Logo */}
                        <span className="text-neon-green/30">▲</span> {currentYear} © Muhammed Farrag
                    </p>
                    <p className="text-gray-500 text-xs mono">
                        <span className="text-electric-purple/50">{'<'}</span>
                        Built with Next.js + Three.js
                        <span className="text-electric-purple/50">{' />'}</span>
                    </p>
                </div>

                {/* Easter Egg - Matrix-style decoration */}
                <motion.div
                    className="absolute bottom-4 right-4 mono text-[10px] text-neon-green/20 hidden lg:block"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    <div>01001101 01000110</div>
                    <div>{'// EOF'}</div>
                </motion.div>
            </div>
        </footer>
    );
}
