"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
    Brain,
    Gamepad2, 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion"; 
import NotificationCard from "./noti-card-demo";

export default function InteractiveMagnets() {
    const [activeCard, setActiveCard] = useState<string | null>(null); 
    const [mounted, setMounted] = useState(false); 

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleCardClick = (id: string) => {
        setActiveCard(activeCard === id ? null : id);
    };

    const games = [
        {
            id: "trivia",
            icon: <Brain className="w-5 h-5 text-white" />,
            iconBg: "bg-blue-500 dark:bg-blue-600",
            gradientFrom: "from-blue-500 dark:from-blue-600",
            gradientTo: "to-blue-400 dark:to-blue-500",
            title: "Trivia",
            description: "Challenge your friends on any topic.",
            preview:
                "Test your knowledge with categories like Science, History, Pop Culture, and more!",
        }, 
    ];

    if (!mounted) {
        return null;
    }

    return (
        <div className="mx-auto grid w-5xl grid-cols-1 gap-4 rounded-3xl bg-draw p-6 shadow-lg transition-colors duration-300 sm:mt-8 sm:grid-cols-2 sm:gap-5 sm:p-8 dark:bg-gray-900">
            <div className="flex items-start justify-between sm:mb-8">
                <motion.h1
                    className="text-4xl leading-tight font-extrabold text-[#6B4D00] sm:text-5xl dark:text-amber-300"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    Three
                    <br />
                    Simple
                    <br />
                    Steps
                </motion.h1>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:mt-8 sm:gap-5">
                {games.map((game, index) => (
                    <GameCard
                        key={game.id}
                        id={game.id}
                        icon={game.icon}
                        iconBg={game.iconBg}
                        gradientFrom={game.gradientFrom}
                        gradientTo={game.gradientTo}
                        title={game.title}
                        description={game.description}
                        isActive={activeCard === game.id}
                        onClick={() => handleCardClick(game.id)}
                        delay={index * 0.1}
                    />
                ))}
            </div>
        </div>
    );
}

interface GameCardProps {
    id: string;
    icon: React.ReactNode;
    iconBg: string;
    gradientFrom: string;
    gradientTo: string;
    title: string;
    description: string;
    isActive: boolean;
    onClick: () => void;
    delay: number;
}

function GameCard({
    id,
    icon,
    iconBg,
    title,
    description,
    isActive,
    onClick,
    delay,
}: GameCardProps) {
    return (
        <motion.div
            className="flex flex-col sm:flex-row gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
        >
            <NotificationCard/>
            {/* <Card
                className={`flex-1 p-4 rounded-2xl overflow-hidden relative cursor-pointer transition-all duration-300 ${
                    isActive
                        ? "bg-white dark:bg-gray-800 shadow-md"
                        : "bg-white/90 dark:bg-gray-800/90"
                }`}
                onClick={onClick}
            > 
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-6 h-6 ${iconBg} rounded-md flex items-center justify-center`}
                        >
                            {icon}
                        </div>
                        <h2 className="text-xl font-bold text-[#1E293B] dark:text-white">
                            {title}
                        </h2>
                    </div>
                </div>
                <div className="relative  grid grid-cols-1 overflow-hidden">
                    <div
                        className={`whitespace-nowrap ${
                            id === "trivia" || id === "teams"
                                ? "marquee-animation"
                                : "marquee-animation-reverse"
                        }`}
                    >
                        <span className="inline-block pr-8 text-gray-700 dark:text-gray-300">
                            {description}
                        </span>
                    </div>
                </div>
            </Card> */}
        </motion.div>
    );
}
