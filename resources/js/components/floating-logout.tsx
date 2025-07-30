"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useMobileNavigation } from "@/hooks/use-mobile-navigation"
import type { SharedData } from "@/types"
import { Link, router, usePage } from "@inertiajs/react"
import { ChevronLeft, ChevronRight, HelpCircle, LogOut } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import AppLogo from "./app-logo"

export default function FloatingActionButtons() {
    const { customer } = usePage<SharedData>().props
    const [isExpanded, setIsExpanded] = useState(false)
    const [logoutOpen, setLogoutOpen] = useState(false)
    const [supportOpen, setSupportOpen] = useState(false)
    const [creditsOpen, setCreditsOpen] = useState(false)
    const cleanup = useMobileNavigation()

    const handleLogout = () => {
        cleanup()
        router.flushAll()
        setLogoutOpen(false)
    }

    const handleContactSupport = () => {
        router.get("/support")
        setSupportOpen(false)
    }

    const handleBuyCredits = () => {
        router.get(route("billing.index"))
        setCreditsOpen(false)
    }

    const isLowCredits = customer.credits < 10

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded)
        // Close any open popovers when collapsing
        if (isExpanded) {
            setLogoutOpen(false)
            setSupportOpen(false)
            setCreditsOpen(false)
        }
    }

    return (
        <div className="fixed right-6 bottom-6 z-50">
            <motion.div
                initial={false}
                animate={{
                    width: isExpanded ? "auto" : "53px",
                }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                }}
                className="flex items-center overflow-hidden rounded-full border border-accent bg-card opacity-90  backdrop-blur-lg"
            >
                {/* Main Toggle Button */}
                <motion.div className="flex-shrink-0" whileTap={{ scale: 0.95 }}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleExpanded}
                        className="h-13 w-13 rounded-full bg-primary-foreground opacity-40 text-primary transition-all duration-200 hover:bg-background/20"
                    >
                        <AnimatePresence mode="wait">
                            {isExpanded ? (
                                <motion.div
                                    key="chevron-right"
                                    // initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <AppLogo />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="chevron-left"
                                    // initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <AppLogo />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <span className="sr-only">{isExpanded ? "Collapse menu" : "Expand menu"}</span>
                    </Button>
                </motion.div>

                {/* Expanded Buttons Container */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{
                                stiffness: 400,
                                staggerChildren: 0.1,
                            }}
                            className="flex items-center gap-2 pl-2 pr-4"
                        >
                            {/* Credits Button */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                transition={{ delay: 0.1 }}

                                whileTap={{ scale: 0.95 }}
                            >
                                <Popover open={creditsOpen} onOpenChange={setCreditsOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={`h-10 w-10 rounded-full transition-all duration-200 ${isLowCredits
                                                ? "bg-red-200 text-white hover:bg-red-600 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-700"
                                                : "bg-accent text-primary  dark:opacity-70"
                                                }`}
                                        >
                                            <span className={`font-bold text-sm ${isLowCredits ? "text-white dark:text-red-100" : "dark:text-orange-100"}`}>
                                                {customer.credits > 999
                                                    ? (customer.credits / 1000).toFixed(1).replace(/\.0$/, "") + "k"
                                                    : customer.credits}
                                            </span>
                                            <span className="sr-only">Credits</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-54 p-4" side="top" align="end">
                                        <div className="space-y-3">
                                            <p className="text-sm">
                                                You have{" "}
                                                <Link className="underline" href={'/credits'}>
                                                    {customer.credits}
                                                </Link>{" "}
                                                credits remaining.
                                            </p>
                                            {isLowCredits && (
                                                <Button size="sm" className="w-full" onClick={handleBuyCredits}>
                                                    Buy More Credits
                                                </Button>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </motion.div>

                            {/* Support Button */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                transition={{ delay: 0.2 }}

                                whileTap={{ scale: 0.95 }}
                            >
                                <Popover open={supportOpen} onOpenChange={setSupportOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 rounded-full bg-blue-50 text-primary   hover:bg-blue-100  dark:bg-blue-900/70 dark:opacity-35 dark:hover:bg-blue-800/70"
                                        >
                                            <HelpCircle className="h-4 w-4" />
                                            <span className="sr-only">Support</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-4" side="top" align="end">
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-medium">Contact Support Team</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Need help? Our support team is here to assist you with any questions or issues.
                                            </p>
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={() => setSupportOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={handleContactSupport}
                                                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-800 dark:text-primary dark:hover:bg-blue-900"
                                                >
                                                    Contact Team
                                                </Button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </motion.div>

                            {/* Logout Button */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                transition={{ delay: 0.3 }}

                                whileTap={{ scale: 0.95 }}
                            >
                                <Popover open={logoutOpen} onOpenChange={setLogoutOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 rounded-full bg-accent  text-red-600 transition-all duration-200 hover:text-red-700"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span className="sr-only">Logout</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-4" side="top" align="end">
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-medium">Confirm Logout</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Are you sure you want to logout? You'll need to sign in again to access your account.
                                            </p>
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={() => setLogoutOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Link method="post" href={route("logout")} as="button" onClick={handleLogout}>
                                                    <Button variant="destructive" size="sm">
                                                        Logout
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}
