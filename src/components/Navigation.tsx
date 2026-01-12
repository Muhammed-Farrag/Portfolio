'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_LINKS } from '@/data/portfolio';

export default function Navigation() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);

            // Determine active section
            const sections = NAV_LINKS.map((link) => link.href.replace('#', ''));
            for (const section of sections.reverse()) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 150) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <motion.nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass py-3' : 'py-6'
                    }`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
                    {/* Logo */}
                    <motion.a
                        href="#home"
                        className="mono text-lg font-bold text-neon-green hover:glow-green transition-all"
                        whileHover={{ scale: 1.05 }}
                    >
                        <span className="text-white">{'<'}</span>
                        MF
                        <span className="text-white">{' />'}</span>
                    </motion.a>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map((link, index) => (
                            <motion.a
                                key={link.name}
                                href={link.href}
                                className={`px-4 py-2 mono text-sm transition-all relative group ${activeSection === link.href.replace('#', '')
                                        ? 'text-neon-green'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <span className="relative z-10">{link.name}</span>

                                {/* Active indicator */}
                                {activeSection === link.href.replace('#', '') && (
                                    <motion.div
                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-neon-green rounded-full"
                                        layoutId="activeIndicator"
                                    />
                                )}

                                {/* Hover underline */}
                                <span className="absolute bottom-0 left-0 w-full h-px bg-neon-green scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                            </motion.a>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <motion.a
                        href="#contact"
                        className="hidden md:flex btn-cyber text-xs"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="relative z-10">LET&apos;S TALK</span>
                    </motion.a>

                    {/* Mobile Menu Button */}
                    <motion.button
                        className="md:hidden p-2 text-neon-green"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {isMobileMenuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </motion.button>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className="fixed inset-0 z-40 md:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Backdrop */}
                        <motion.div
                            className="absolute inset-0 bg-void/95 backdrop-blur-lg"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        {/* Menu Content */}
                        <motion.div
                            className="absolute top-20 left-4 right-4 glass rounded-lg p-6"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="flex flex-col gap-4">
                                {NAV_LINKS.map((link, index) => (
                                    <motion.a
                                        key={link.name}
                                        href={link.href}
                                        className={`mono text-lg py-2 transition-colors ${activeSection === link.href.replace('#', '')
                                                ? 'text-neon-green'
                                                : 'text-gray-400'
                                            }`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <span className="text-neon-green/50 mr-2">{`0${index + 1}.`}</span>
                                        {link.name}
                                    </motion.a>
                                ))}
                            </div>

                            <motion.a
                                href="#contact"
                                className="btn-cyber w-full mt-6 justify-center"
                                onClick={() => setIsMobileMenuOpen(false)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                LET&apos;S TALK
                            </motion.a>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
