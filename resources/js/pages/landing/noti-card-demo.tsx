"use client";

import { useState } from "react"; 
import { motion, AnimatePresence } from "framer-motion";

interface NotificationCardProps {
    title?: string;
    description?: string;
    className?: string;
}

export default function NotificationCard({
    title = "Stay in the loop!",
    description = "We notify you for things that matter! No more reading through chat threads, catch up with a glance with AI powered summarisation.",
    className = "",
}: NotificationCardProps) {
    const [notifications, setNotifications] = useState([
        {
            id: "1",
            icon: "🐾",
            title: "Pet is hetching!",
            message: "Pete added Waffle and it's hatching",
            read: false,
        },
    ]); 

    return (
        <div
            className={`transition-colors duration-300 rounded-3xl bg-[#e1f7eb] dark:bg-emerald-950 p-6 shadow-sm ${className}`}
        >
            <div>
                <h2 className="text-3xl font-black text-[#0a2e14] dark:text-emerald-300">
                    {title}
                </h2>
                <p className="mt-2 text-[#0a2e14] dark:text-emerald-200 text-base leading-relaxed">
                    {description}
                </p>
            </div>

            <div className="mt-4 space-y-2">
                <AnimatePresence>
                    {notifications.map((notification) => (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="relative"
                        >
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-[0_4px_8px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_8px_rgba(0,0,0,0.2)]">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center text-white text-lg">
                                        {notification.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                                            {notification.title}
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                                            {notification.message}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Shadow effect at the bottom */}
                            <div className="absolute -bottom-1 left-1 right-1 h-2 bg-white/80 dark:bg-gray-800/80 rounded-b-2xl"></div>
                            <div className="absolute -bottom-2 left-2 right-2 h-2 bg-white/60 dark:bg-gray-800/60 rounded-b-2xl"></div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
