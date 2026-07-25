// src/components/common/Preloader.jsx
import React, { useState, useEffect } from 'react';

export const Preloader = ({ onComplete, videoSrc }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Simulate loading progress
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 2;
            });
        }, 50);

        // Auto-complete after video duration (6 seconds)
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
        }, 6000);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [onComplete]);

    // Handle video end
    const handleVideoEnd = () => {
        setIsVisible(false);
        if (onComplete) onComplete();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#0a3d2a] to-[#1a7a4c] flex flex-col items-center justify-center">
            {/* Video Background */}
            <div className="absolute inset-0 overflow-hidden opacity-30">
                <video
                    autoPlay
                    muted
                    playsInline
                    onEnded={handleVideoEnd}
                    className="w-full h-full object-cover"
                >
                    <source src={videoSrc || '/videos/oic-intro.mp4'} type="video/mp4" />
                </video>
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
                {/* Logo */}
                <div className="mb-8 animate-bounce">
                    <img 
                        src="/3939.png" 
                        alt="OIC Logo" 
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl shadow-2xl border-4 border-white/20"
                    />
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 tracking-wider">
                    OIC
                </h1>
                <p className="text-white/70 text-sm sm:text-base tracking-widest uppercase">
                    Organization of Islamic Cooperation
                </p>

                {/* Progress Bar */}
                <div className="mt-8 w-64 sm:w-80 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-[#c9a84c] to-yellow-400 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-white/40 text-xs mt-2">
                    {progress}% Loading...
                </p>

                {/* Skip Button */}
                <button
                    onClick={handleVideoEnd}
                    className="mt-6 px-6 py-2 text-white/60 text-sm hover:text-white transition-colors duration-300 border border-white/20 rounded-lg hover:bg-white/10"
                >
                    Skip →
                </button>
            </div>

            {/* Decorative Orbs */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#c9a84c]/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
    );
};