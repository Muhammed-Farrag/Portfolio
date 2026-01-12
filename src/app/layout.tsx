import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Muhammed Farrag | Applied AI Engineer',
    description: 'Building the intersection of Generative AI and Intelligent Automation. Portfolio showcasing AI/ML projects, automation solutions, and cutting-edge technology.',
    keywords: [
        'AI Engineer',
        'Machine Learning',
        'Deep Learning',
        'NLP',
        'Automation',
        'Python',
        'PyTorch',
        'LLMs',
        'Generative AI',
    ],
    authors: [{ name: 'Muhammed Farrag' }],
    openGraph: {
        title: 'Muhammed Farrag | Applied AI Engineer',
        description: 'Building the intersection of Generative AI and Intelligent Automation.',
        type: 'website',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Muhammed Farrag | Applied AI Engineer',
        description: 'Building the intersection of Generative AI and Intelligent Automation.',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
            <body className="bg-void antialiased">
                {/* Grid Background */}
                <div className="grid-background" />

                {/* Scan Line Effect */}
                <div className="scan-line" />

                {/* Noise Overlay */}
                <div className="noise-overlay" />

                {/* Main Content */}
                <main className="relative z-10">
                    {children}
                </main>
            </body>
        </html>
    );
}
