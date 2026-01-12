'use client';

import { useEffect, useRef, useState } from 'react';

// Particle class for the canvas animation
class Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    color: string;
    opacity: number;

    constructor(canvas: HTMLCanvasElement, isGreen: boolean) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.color = isGreen ? '#00ff41' : '#bf00ff';
        this.opacity = Math.random() * 0.5 + 0.2;
    }

    update(canvas: HTMLCanvasElement) {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around edges
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }
}

export default function HeroBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mounted, setMounted] = useState(false);
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameRef = useRef<number>(0);

    useEffect(() => {
        setMounted(true);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Create particles
        const particleCount = 150;
        particlesRef.current = [];
        for (let i = 0; i < particleCount; i++) {
            const isGreen = i < particleCount * 0.7; // 70% green, 30% purple
            particlesRef.current.push(new Particle(canvas, isGreen));
        }

        // Animation variables for the floating geometry
        let rotationAngle = 0;

        // Draw floating icosahedron wireframe
        const drawIcosahedron = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, size: number, rotation: number) => {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(rotation);

            // Draw a simplified geometric shape (hexagon with inner lines)
            const vertices = 6;
            const points: [number, number][] = [];

            for (let i = 0; i < vertices; i++) {
                const angle = (i / vertices) * Math.PI * 2 - Math.PI / 2;
                points.push([
                    Math.cos(angle) * size,
                    Math.sin(angle) * size,
                ]);
            }

            // Draw outer hexagon
            ctx.strokeStyle = '#00ff41';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ff41';

            ctx.beginPath();
            points.forEach((point, i) => {
                if (i === 0) ctx.moveTo(point[0], point[1]);
                else ctx.lineTo(point[0], point[1]);
            });
            ctx.closePath();
            ctx.stroke();

            // Draw inner connections
            ctx.globalAlpha = 0.15;
            points.forEach((point, i) => {
                const opposite = points[(i + 3) % vertices];
                ctx.beginPath();
                ctx.moveTo(point[0], point[1]);
                ctx.lineTo(opposite[0], opposite[1]);
                ctx.stroke();
            });

            // Draw inner hexagon
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            points.forEach((point, i) => {
                const x = point[0] * 0.5;
                const y = point[1] * 0.5;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        };

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            particlesRef.current.forEach((particle) => {
                particle.update(canvas);
                particle.draw(ctx);
            });

            // Draw connections between nearby particles
            ctx.strokeStyle = '#00ff41';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < particlesRef.current.length; i++) {
                for (let j = i + 1; j < particlesRef.current.length; j++) {
                    const p1 = particlesRef.current[i];
                    const p2 = particlesRef.current[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.globalAlpha = (1 - distance / 100) * 0.1;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }

            // Draw floating geometry
            rotationAngle += 0.003;
            const floatOffset = Math.sin(Date.now() / 1000) * 20;
            drawIcosahedron(ctx, canvas.width / 2, canvas.height / 2 + floatOffset, 80, rotationAngle);

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 z-0">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ background: 'transparent' }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-void/50 via-transparent to-void pointer-events-none" />

            {/* Radial Gradient for depth */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 0%, rgba(5,5,5,0.6) 70%, rgba(5,5,5,0.9) 100%)',
                }}
            />

            {/* Animated gradient orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric-purple/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
    );
}
