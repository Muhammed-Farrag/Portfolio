// ============================================================================
// PORTFOLIO DATA STRUCTURE - INDUSTRY STANDARD
// Muhammed Farrag - AI Engineer
// ============================================================================

// Type definitions
export interface Experience {
    id: string;
    role: string;
    company: string;
    location?: string;
    startDate: string;
    endDate: string;
    technologies: string[];
    description: string;
    impact: string[];
    icon: 'automation' | 'ai' | 'training' | 'intern';
}

export interface Project {
    id: string;
    title: string;
    category: string;
    problem: string;
    approach: string;
    outcome: string;
    technicalChallenge: string;
    technologies: string[];
    features?: string[];
    demo?: string;
    github?: string;
    image?: string;
    status: 'completed' | 'in-progress' | 'research';
    featured: boolean;
}

export interface Achievement {
    id: string;
    title: string;
    event: string;
    rank: string;
    location: string;
    year: string;
    description: string;
    validation: string[];
    link?: string;
}

export interface Capability {
    category: string;
    description: string;
    skills: string[];
    level: 'core' | 'systems' | 'tooling';
}

export interface SocialLink {
    platform: string;
    url: string;
    icon: string;
}

// ============================================================================
// PROFILE DATA
// ============================================================================

export const PROFILE = {
    name: 'Muhammed Farrag',
    role: 'Applied AI Engineer',
    specializations: ['NLP & Generative AI', 'Advanced Python Developer', 'Quantum ML Track'],
    valueProposition: 'Building intelligent systems that bridge cutting-edge AI research with production-grade deployment.',
    about: `Applied AI Engineer specializing in NLP, Generative AI, and intelligent systems. Advanced Python developer with experience writing production-grade systems, including a real-world pharmacy management system. Strong foundation in software engineering principles with Java and Python. Currently entering Quantum Computing, aiming for Quantum ML & Quantum Neural Networks (QNNs).`,
    email: 'mohamed.frage19@gmail.com',
    location: 'Egypt',
    currentFocus: [
        'Advanced NLP & Generative AI systems',
        'Emotion-aware conversational AI',
        'Research-grade AI architectures',
        'Quantum Computing → Quantum ML → QNNs',
    ],
    avatar: '/avatar.png',
    resume: '/resume.pdf',
} as const;

// ============================================================================
// CAPABILITIES (HIERARCHICAL)
// ============================================================================

export const CAPABILITIES: Capability[] = [
    {
        category: 'Python & Software Engineering',
        description: 'Production-grade systems with clean architecture and reliability',
        level: 'core',
        skills: [
            'Advanced Python (clean architecture, modular design)',
            'Production-level business logic',
            'Data processing & system reliability',
            'Debugging, refactoring & maintainability',
        ],
    },
    {
        category: 'Artificial Intelligence & ML',
        description: 'Building intelligent systems from NLP to reinforcement learning',
        level: 'core',
        skills: [
            'Natural Language Processing (NLP)',
            'Transformers & Large Language Models',
            'Sentiment & emotion analysis',
            'Recommendation Systems',
            'Reinforcement Learning',
        ],
    },
    {
        category: 'Quantum Computing',
        description: 'Research track toward Quantum ML and QNNs',
        level: 'systems',
        skills: [
            'Quantum computing fundamentals',
            'Quantum circuits & gates',
            'Hybrid classical–quantum workflows',
            'Quantum Neural Networks (QNNs) — research focus',
        ],
    },
    {
        category: 'Programming & Systems',
        description: 'Multi-language proficiency with system-level thinking',
        level: 'tooling',
        skills: [
            'Python (Advanced)',
            'Java (OOP, data structures, backend)',
            'Vanilla Web (HTML, CSS, JavaScript)',
            'System integration & API design',
        ],
    },
    {
        category: 'Hardware & AIoT',
        description: 'Edge-based AI and sensor-driven systems',
        level: 'systems',
        skills: [
            'Raspberry Pi',
            'Sensor-driven systems',
            'Edge-based AI experimentation',
        ],
    },
];

// ============================================================================
// EXPERIENCE DATA (IMPACT-FOCUSED)
// ============================================================================

export const EXPERIENCES: Experience[] = [
    {
        id: 'montura',
        role: 'Co-Founder & AI Engineer',
        company: 'Montura',
        startDate: 'Jun 2025',
        endDate: 'Present',
        technologies: ['Python', 'BERT', 'CNN', 'AdaBoost', 'MTD'],
        description: 'Developed hybrid anomaly detection system for wireless network security. Want to discuss more? Let\'s connect!',
        impact: [
            'Achieved 94.2% detection accuracy with 40% fewer false positives',
            'Designed novel hybrid architecture combining AdaBoost, CNN, and BERT',
            'Implemented Moving Target Defense for adaptive threat protection',
        ],
        icon: 'ai',
    },
    {
        id: 'tjm-labs',
        role: 'Software Developer (Automation)',
        company: 'TJM Labs',
        startDate: 'Oct 2025',
        endDate: 'Dec 2025',
        technologies: ['Python', 'BotCity', 'Playwright', 'Docker'],
        description: 'Engineered high-speed RPA bots to automate AI E-Scriptions under strict performance constraints.',
        impact: [
            'Reduced manual processing time by 85% through intelligent automation',
            'Integrated computer-vision UI automation for complex workflows',
            'Containerized solutions achieving 99.5% uptime in production',
        ],
        icon: 'automation',
    },
    {
        id: 'depi',
        role: 'AI Engineer Trainee',
        company: 'DEPI (Digital Egypt Pioneers Initiative)',
        startDate: 'Jul 2025',
        endDate: 'Dec 2025',
        technologies: ['Python', 'NLP', 'Chatbot Development', 'Transformers', 'Deep Learning', 'LLMs'],
        description: 'Built production-ready NLP systems and transformer-based architectures.',
        impact: [
            'Implemented end-to-end NLP pipelines for real-world applications',
            'Built NHA-290 chatbot for healthcare assistance',
            'Fine-tuned Large Language Models for domain-specific tasks',
            'Developed transformer architectures from research papers',
        ],
        icon: 'training',
    },
    {
        id: 'stc',
        role: 'AI Engineer Intern',
        company: 'STC (Saudi Telecom)',
        startDate: 'Jul 2024',
        endDate: 'Aug 2024',
        technologies: ['Recommendation Systems', 'Collaborative Filtering', 'Python', 'Streaming Platform'],
        description: 'Developed scalable recommendation algorithms for telecom customer targeting and built STC streaming platform.',
        impact: [
            'Built recommendation engine processing 10M+ customer records',
            'Created STC-TV streaming platform with real-time video delivery',
            'Improved customer targeting accuracy by 32%',
            'Optimized algorithms for real-time inference under 100ms',
        ],
        icon: 'intern',
    },
    {
        id: 'iti',
        role: 'AI & Software Development Trainee',
        company: 'ITI (Information Technology Institute)',
        startDate: 'Summer 2024',
        endDate: 'Summer 2024',
        technologies: ['Python', 'Client-Server Architecture', 'GUI Development', 'Database Management'],
        description: 'Developed software projects including museum management systems and client-server applications.',
        impact: [
            'Developed Grand Egyptian Museum client-server application',
            'Implemented database management and GUI interfaces',
            'Built scalable client-server architecture',
        ],
        icon: 'training',
    },
];

// ============================================================================
// ACHIEVEMENTS (EXTERNAL VALIDATION)
// ============================================================================

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'roborave-china',
        title: 'Rank 1 - International Robotics Competition',
        event: 'RoboRave',
        rank: '1st Place',
        location: 'China',
        year: '2023',
        description: 'Competed against international teams in robotics and intelligent systems under strict time and performance constraints.',
        validation: [
            'Rapid problem decomposition under pressure',
            'Algorithmic optimization for real-time performance',
            'Reliable system integration in competition environment',
            'Cross-disciplinary collaboration and execution',
        ],
        link: 'https://www.linkedin.com/posts/muhammed-farrag-0102b427b_montura-roborave-entrepreneurship-activity-7368204159084380160-eIfD',
    },
    {
        id: 'ieee-member',
        title: 'AI Member @ IEEE',
        event: 'IEEE Membership',
        rank: 'Active Member',
        location: 'International',
        year: '2024',
        description: 'Active member contributing to AI research and development initiatives.',
        validation: [
            'Engagement with cutting-edge AI research',
            'Professional network in AI community',
            'Access to latest industry standards',
        ],
        link: 'https://www.linkedin.com/company/ieee-aiu-student-branch/posts/?feedView=all',
    },
];

// ============================================================================
// PROJECTS (PROBLEM → APPROACH → OUTCOME)
// ============================================================================

export const PROJECTS: Project[] = [
    {
        id: 'montura-cybersecurity',
        title: 'Montura',
        category: 'Cybersecurity AI',
        problem: 'Wireless networks face sophisticated attacks that traditional single-model systems fail to detect with acceptable false-positive rates.',
        approach: 'Designed hybrid ensemble combining AdaBoost for feature selection, CNN for spatial patterns, and BERT for sequential analysis. Integrated Moving Target Defense for adaptive protection.',
        outcome: '94.2% detection accuracy with 40% reduction in false positives. System deployed in test environment handling 10K+ connections/sec.',
        technicalChallenge: 'Balancing model complexity with real-time inference requirements while maintaining interpretability for security analysts.',
        technologies: ['Python', 'PyTorch', 'BERT', 'CNN', 'AdaBoost', 'Scikit-learn'],
        status: 'in-progress',
        featured: true,
    },
    {
        id: 'rl-catch-game',
        title: 'Catch AI Gym',
        category: 'Reinforcement Learning',
        problem: 'Understanding performance tradeoffs between value-based (Q-Learning) and policy-gradient (REINFORCE) methods in continuous control.',
        approach: 'Implemented custom OpenAI Gym environment with comprehensive logging. Built both algorithms from scratch with epsilon-greedy exploration and baseline variance reduction.',
        outcome: 'Q-Learning converged 3x faster but REINFORCE achieved 15% higher final performance. Published detailed comparative analysis with visualizations.',
        technicalChallenge: 'Debugging credit assignment in sparse reward environment and stabilizing policy gradient training.',
        technologies: ['Python', 'PyTorch', 'OpenAI Gym', 'NumPy', 'Matplotlib'],
        github: 'https://github.com/Muhammed-Farrag/catch-ai-gy',
        status: 'completed',
        featured: true,
    },
];

// ============================================================================
// RESEARCH / ADVANCED WORK
// ============================================================================

export const RESEARCH = {
    currentTrack: 'Quantum Machine Learning',
    focus: 'Quantum Neural Networks (QNNs)',
    description: 'Exploring hybrid classical-quantum architectures for machine learning. Studying quantum circuit design, variational quantum algorithms, and their application to neural network optimization.',
    areas: [
        'Quantum circuit design and optimization',
        'Variational Quantum Eigensolvers (VQE)',
        'Quantum-enhanced feature spaces',
        'Hybrid classical-quantum training pipelines',
    ],
};

// ============================================================================
// TERMINAL BOOT SEQUENCE
// ============================================================================

export const TERMINAL_BOOT_SEQUENCE = [
    { text: '> INITIALIZING QUANTUM NEURAL CORE...', delay: 0 },
    { text: '> Loading AI modules... [████████████████] 100%', delay: 400 },
    { text: '> Establishing quantum entanglement... OK', delay: 800 },
    { text: '> Authenticating consciousness... VERIFIED', delay: 1200 },
    { text: '> ', delay: 1600 },
    { text: '> SYSTEM READY', delay: 1800 },
    { text: '> ', delay: 2000 },
    { text: '> Welcome to the portfolio of', delay: 2200 },
    { text: '> MUHAMMED FARRAG', delay: 2500, highlight: true },
    { text: '> Applied AI Engineer', delay: 2900, accent: true },
];

// ============================================================================
// NAVIGATION
// ============================================================================

export const NAV_LINKS = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Capabilities', href: '#capabilities' },
    { name: 'Projects', href: '#projects' },
    { name: 'Experience', href: '#experience' },
    { name: 'Achievements', href: '#achievements' },
    { name: 'Contact', href: '#contact' },
];

// ============================================================================
// SOCIAL LINKS
// ============================================================================

export const SOCIAL_LINKS: SocialLink[] = [
    { platform: 'GitHub', url: 'https://github.com/Muhammed-Farrag', icon: 'github' },
    { platform: 'LinkedIn', url: 'https://linkedin.com/in/muhammed-farrag-0102b427b', icon: 'linkedin' },
    { platform: 'Email', url: 'mailto:mohamed.frage19@gmail.com', icon: 'email' },
];
