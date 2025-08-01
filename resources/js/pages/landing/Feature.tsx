"use client";

import { motion } from "framer-motion";
import { Clock, Calendar, MessageSquare, Inbox } from "lucide-react";

export default function Feature( props: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16" {...props}>
            <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl   font-medium text-center mb-6 sm:mb-8 text-gray-900 dark:text-gray-50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                Inbox chaos steals your time.
            </motion.h1> 

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                <motion.div
                    className="flex items-center gap-1.5 sm:gap-2 bg-accent rounded-full px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm border border-primary-foreground "
                    initial={{ opacity: 0, y: 20, rotate: -1 }}
                    animate={{ opacity: 1, y: 0, rotate: -1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    {/* <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 dark:text-red-400" /> */}
                    <span className="text-sm sm:text-base text-primary">
                        Slow Response Times
                    </span>
                </motion.div>

                <motion.div
                    className="flex items-center gap-1.5 sm:gap-2 bg-accent rounded-full px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm border border-primary-foreground "
                    initial={{ opacity: 0, y: 20, rotate: 1 }}
                    animate={{ opacity: 1, y: 0, rotate: 1 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                >
                    {/* <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 dark:text-green-400" /> */}
                    <span className="text-sm sm:text-base text-primary">
                        Endless Back & Forth Booking Meetings
                    </span>
                </motion.div>

                <motion.div
                    className="flex items-center gap-1.5 sm:gap-2 bg-accent rounded-full px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm border border-primary-foreground "
                    initial={{ opacity: 0, y: 20, rotate: -0.5 }}
                    animate={{ opacity: 1, y: 0, rotate: -0.5 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                >
                    {/* <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400" /> */}
                    <span className="text-sm sm:text-base text-primary">
                        Hours Wasted Managing Email
                    </span>
                </motion.div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-3 sm:mt-4">
                <motion.div
                    className="flex items-center gap-1.5 sm:gap-2 bg-accent rounded-full px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm border border-primary-foreground "
                    initial={{ opacity: 0, y: 20, rotate: 1.5 }}
                    animate={{ opacity: 1, y: 0, rotate: 1.5 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                >
                    {/* <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 dark:text-purple-400" /> */}
                    <span className="text-sm sm:text-base text-primary">
                        Slow Replies Leading to Ghosted Leads
                    </span>
                </motion.div>

                <motion.div
                    className="flex items-center gap-1.5 sm:gap-2 bg-accent rounded-full px-3 sm:px-4 py-1.5 sm:py-2 shadow-sm border border-primary-foreground "
                    initial={{ opacity: 0, y: 20, rotate: -1.2 }}
                    animate={{ opacity: 1, y: 0, rotate: -1.2 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                >
                    {/* <Inbox className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 dark:text-orange-400" /> */}
                    <span className="text-sm sm:text-base text-primary">
                        Leads Lost in the Noise
                    </span>
                </motion.div>
            </div>
        </div>
    );
}
