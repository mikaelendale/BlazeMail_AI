"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Mail, Zap, Target, TrendingUp, Users, NotebookIcon, UserMinus, MailWarning, Timer, TrendingDown, Diamond, DiamondIcon, Archive, UserPlus2, HandPlatterIcon, ScanIcon } from "lucide-react"
import { Button } from "./ui/button"

const problems = [
  {
    icon: UserMinus,
    text: "Generic templates that scream 'mass email'",
  },
  {
    icon: NotebookIcon,
    text: "Zero personalization beyond {{firstName}}",
  },
  {
    icon: MailWarning,
    text: "Terrible deliverability and spam folder doom",
  },
  {
    icon: Timer,
    text: "No real research on your prospects",
  },
  {
    icon: TrendingDown,
    text: "Abysmal response rates under 2%",
  },
]

const solutions = [
  {
    icon: Archive,
    text: "AI writes unique emails for each prospect",
  },
  {
    icon: UserPlus2,
    text: "Deep personalization using LinkedIn & company data",
  },
  {
    icon: HandPlatterIcon,
    text: "Optimized sending patterns for inbox placement",
  },
  {
    icon: ScanIcon,
    text: "Automatic prospect research (pain point detection)",
  },
  {
    icon: TrendingUp,
    text: "Consistently achieve 15%+ response rates",
  },
]

export default function ProblemSolutionSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  }

  return (
      <section className="bg-background px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-8 md:px-16 lg:px-32 xl:px-60">
              <motion.div
                  ref={ref}
                  initial="hidden"
                  animate={isInView ? 'visible' : 'hidden'}
                  variants={containerVariants}
                  className="mb-8 text-center"
              >
                  <motion.h2
                      variants={itemVariants}
                      className="mb-4 text-xl font-bold tracking-tight text-primary sm:mb-6 sm:text-2xl md:text-3xl lg:text-4xl"
                  >
                      Why Cold Emails <span className="text-primary">Suck</span> Right Now
                  </motion.h2>
                  <motion.p variants={itemVariants} className="mx-auto max-w-3xl text-sm leading-relaxed text-secondary-foreground sm:text-base">
                      Most AI tools send robotic, generic emails that ruin your chances before you hit send.
                  </motion.p>
              </motion.div>

              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-8">
                  {/* Problems Side */}
                  <motion.div initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={containerVariants} className="space-y-3">
                      <div className="mb-6">
                          <h3 className="mb-2 flex flex-col items-center gap-3 text-lg font-bold text-primary sm:text-xl lg:text-2xl">The Problem</h3>
                          <div className="h-1 w-0 rounded-full bg-red-400 leading-3 leading-4 leading-7"></div>
                      </div>

                      {problems.map((problem, index) => (
                          <motion.div
                              key={index}
                              variants={itemVariants}
                              className="group flex items-start gap-3 rounded-2xl border border-primary-foreground bg-accent p-2 transition-all duration-300 hover:border-red-400/30 sm:gap-4 sm:p-3"
                          >
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/10 transition-colors group-hover:bg-red-500/20">
                                  {/* Use unique icon */}
                                  <problem.icon className="h-4 w-4 text-red-400" aria-label="Problem icon" />
                              </div>
                              <div className="flex-1">
                                  <p className="text-xs leading-relaxed text-primary sm:text-sm">{problem.text}</p>
                              </div>
                          </motion.div>
                      ))}
                  </motion.div>

                  {/* Solutions Side */}
                  <motion.div initial="hidden" animate={isInView ? 'visible' : 'hidden'} variants={containerVariants} className="space-y-3">
                      <div className="mb-6">
                          <h3 className="mb-2 flex flex-col items-center gap-3 text-lg font-bold text-primary sm:text-xl lg:text-2xl">
                              BlazeMail Solution
                          </h3>
                          <div className="h-1 w-0 rounded-full bg-emerald-400"></div>
                      </div>

                      {solutions.map((solution, index) => (
                          <motion.div
                              key={index}
                              variants={itemVariants}
                              className="group flex items-start gap-3 rounded-2xl border border-primary-foreground bg-accent p-2 transition-all duration-300 hover:border-emerald-400/30 sm:gap-4 sm:p-3"
                          >
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary-foreground transition-colors group-hover:bg-emerald-500/20">
                                  {/* Use unique icon */}
                                  <solution.icon className="h-4 w-4 text-green-600" aria-label="Solution icon" />
                              </div>
                              <div className="flex-1">
                                  <p className="text-xs leading-relaxed text-primary sm:text-sm">{solution.text}</p>
                              </div>
                          </motion.div>
                      ))}
                  </motion.div>
              </div> 
          </div>
      </section>
  );
}
