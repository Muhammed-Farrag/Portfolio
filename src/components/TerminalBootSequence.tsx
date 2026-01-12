'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TERMINAL_BOOT_SEQUENCE, PROFILE } from '@/data/portfolio';

interface TerminalLine {
    text: string;
    delay: number;
    highlight?: boolean;
    accent?: boolean;
}

export default function TerminalBootSequence({
    onComplete,
}: {
    onComplete: () => void;
}) {
    const [visibleLines, setVisibleLines] = useState<number>(0);
    const [currentText, setCurrentText] = useState<string>('');
    const [isTyping, setIsTyping] = useState<boolean>(true);
    const [bootComplete, setBootComplete] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Typewriter effect for each line
    useEffect(() => {
        if (visibleLines >= TERMINAL_BOOT_SEQUENCE.length) {
            setTimeout(() => {
                setBootComplete(true);
                setTimeout(onComplete, 1500);
            }, 500);
            return;
        }

        const currentLine = TERMINAL_BOOT_SEQUENCE[visibleLines];
        let charIndex = 0;

        const typeInterval = setInterval(() => {
            if (charIndex <= currentLine.text.length) {
                setCurrentText(currentLine.text.slice(0, charIndex));
                charIndex++;
            } else {
                clearInterval(typeInterval);
                setIsTyping(false);

                setTimeout(() => {
                    setVisibleLines((prev) => prev + 1);
                    setCurrentText('');
                    setIsTyping(true);
                }, 200);
            }
        }, 30);

        const initialDelay = setTimeout(() => {
            // Start typing
        }, currentLine.delay);

        return () => {
            clearInterval(typeInterval);
            clearTimeout(initialDelay);
        };
    }, [visibleLines, onComplete]);

    const getLineStyle = (line: TerminalLine) => {
        if (line.highlight) {
            return 'text-neon-green glow-green text-2xl md:text-4xl font-bold';
        }
        if (line.accent) {
            return 'text-electric-purple glow-purple text-lg md:text-xl';
        }
        return 'text-neon-green/80';
    };

    return (
        <motion.div
            ref={containerRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-void"
            initial={{ opacity: 1 }}
            animate={{ opacity: bootComplete ? 0 : 1 }}
            transition={{ duration: 1 }}
        >
            {/* CRT Screen Effect */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,255,65,0.02)] to-transparent animate-scan-line" />
            </div>

            {/* Terminal Container */}
            <div className="w-full max-w-4xl mx-4 p-6 md:p-10">
                {/* Terminal Header */}
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neon-green/20">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-4 text-xs mono text-neon-green/50">
                        neural_core.exe — zsh
                    </span>
                </div>

                {/* Terminal Lines */}
                <div className="space-y-2 mono text-sm md:text-base">
                    <AnimatePresence>
                        {TERMINAL_BOOT_SEQUENCE.slice(0, visibleLines).map((line, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                className={getLineStyle(line)}
                            >
                                {line.text}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Current typing line */}
                    {visibleLines < TERMINAL_BOOT_SEQUENCE.length && (
                        <div className={getLineStyle(TERMINAL_BOOT_SEQUENCE[visibleLines])}>
                            {currentText}
                            {isTyping && <span className="terminal-cursor" />}
                        </div>
                    )}
                </div>

                {/* Loading Bar */}
                <motion.div
                    className="mt-10 h-1 bg-void-light overflow-hidden rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <motion.div
                        className="h-full bg-gradient-to-r from-neon-green via-electric-purple to-cyber-blue"
                        initial={{ width: '0%' }}
                        animate={{ width: bootComplete ? '100%' : `${(visibleLines / TERMINAL_BOOT_SEQUENCE.length) * 100}%` }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                </motion.div>
            </div>

            {/* Corner Decorations */}
            <div className="absolute top-4 left-4 w-20 h-20 border-l-2 border-t-2 border-neon-green/30" />
            <div className="absolute top-4 right-4 w-20 h-20 border-r-2 border-t-2 border-neon-green/30" />
            <div className="absolute bottom-4 left-4 w-20 h-20 border-l-2 border-b-2 border-neon-green/30" />
            <div className="absolute bottom-4 right-4 w-20 h-20 border-r-2 border-b-2 border-neon-green/30" />
        </motion.div>
    );
}
