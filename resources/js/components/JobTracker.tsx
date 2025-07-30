"use client"
import { useState, useEffect } from "react"
import { X, Zap, Eye, Send, ExternalLink, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { router } from "@inertiajs/react"
import { motion, AnimatePresence } from "framer-motion"

interface JobProgress {
  id: number
  job_id: string
  batch_id: string
  job_type: string
  status: "started" | "processing" | "completed" | "failed"
  progress_percentage: number
  processed_items: number
  successful_items: number
  failed_items: number
  total_items: number
  current_item: {
    contact_name?: string
    contact_email?: string
    status?: string
    step?: string
    personalization_score?: number
    model_used?: string
    error?: string
  } | null
  metadata: {
    email_template_subject?: string
    email_template_id?: number
    email_account_id?: number
  }
  started_at: string
  updated_at: string
  completed_at?: string
  error_message?: string
}

interface Props {
  initialBatchId?: string
}

// 🔥 PERSISTENT STORAGE KEYS
const STORAGE_KEYS = {
  isVisible: "jobTracker_isVisible",
  isMinimized: "jobTracker_isMinimized",
  jobs: "jobTracker_jobs",
  lastUpdate: "jobTracker_lastUpdate",
}

export default function JobTracker({ initialBatchId }: Props) {
  const [jobs, setJobs] = useState<JobProgress[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [isPolling, setIsPolling] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // 🔥 LOAD PERSISTENT STATE ON MOUNT
  useEffect(() => {
    try {
      // Load visibility state
      const savedIsVisible = localStorage.getItem(STORAGE_KEYS.isVisible)
      if (savedIsVisible !== null) {
        setIsVisible(JSON.parse(savedIsVisible))
      }
      // Load minimized state
      const savedIsMinimized = localStorage.getItem(STORAGE_KEYS.isMinimized)
      if (savedIsMinimized !== null) {
        setIsMinimized(JSON.parse(savedIsMinimized))
      }
      // Load cached jobs (if recent)
      const savedJobs = localStorage.getItem(STORAGE_KEYS.jobs)
      const lastUpdate = localStorage.getItem(STORAGE_KEYS.lastUpdate)
      if (savedJobs && lastUpdate) {
        const timeSinceUpdate = Date.now() - Number.parseInt(lastUpdate)
        // Use cached jobs if less than 30 seconds old
        if (timeSinceUpdate < 30000) {
          setJobs(JSON.parse(savedJobs))
        }
      }
      setIsInitialized(true)
    } catch (error) {
      console.error("Failed to load persistent state:", error)
      setIsInitialized(true)
    }
  }, [])

  // 🔥 SAVE STATE TO LOCALSTORAGE WHEN CHANGED
  useEffect(() => {
    if (!isInitialized) return
    localStorage.setItem(STORAGE_KEYS.isVisible, JSON.stringify(isVisible))
  }, [isVisible, isInitialized])

  useEffect(() => {
    if (!isInitialized) return
    localStorage.setItem(STORAGE_KEYS.isMinimized, JSON.stringify(isMinimized))
  }, [isMinimized, isInitialized])

  useEffect(() => {
    if (!isInitialized) return
    if (jobs.length > 0) {
      localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(jobs))
      localStorage.setItem(STORAGE_KEYS.lastUpdate, Date.now().toString())
    }
  }, [jobs, isInitialized])

  // Filter jobs to only show those from last 5 minutes
  const filterRecentJobs = (jobs: JobProgress[]) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return jobs.filter((job) => {
      const jobTime = new Date(job.updated_at)
      return jobTime > fiveMinutesAgo
    })
  }

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs/recent")
      if (response.ok) {
        const allJobs = await response.json()
        const recentJobs = filterRecentJobs(allJobs).slice(0, 5)
        setJobs(recentJobs)
        // 🔥 SHOW TRACKER IF THERE ARE JOBS AND NOT MANUALLY HIDDEN
        if (recentJobs.length > 0) {
          // Only auto-show if user hasn't manually hidden it
          const wasManuallyHidden = localStorage.getItem(STORAGE_KEYS.isVisible) === "false"
          if (!wasManuallyHidden) {
            setIsVisible(true)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error)
    }
  }

  // Setup Pusher real-time listening
  useEffect(() => {
    if (!isInitialized) return
    const userId = document.querySelector('meta[name="user-id"]')?.getAttribute("content")
    if (userId && window.Echo) {
      console.log("Setting up Pusher listener for user:", userId)
      const channel = window.Echo.private(`job-progress.${userId}`)
      channel.listen(".job.progress.updated", (data: { job: JobProgress }) => {
        console.log("Real-time job update received:", data.job)
        setJobs((prevJobs) => {
          const updatedJobs = [...prevJobs]
          const existingIndex = updatedJobs.findIndex((job) => job.job_id === data.job.job_id)
          if (existingIndex >= 0) {
            updatedJobs[existingIndex] = data.job
          } else {
            updatedJobs.unshift(data.job)
          }
          // Filter to recent jobs and keep only last 5
          return filterRecentJobs(updatedJobs).slice(0, 5)
        })
        // 🔥 AUTO-SHOW ON NEW JOB (but respect manual hide)
        const wasManuallyHidden = localStorage.getItem(STORAGE_KEYS.isVisible) === "false"
        if (!wasManuallyHidden) {
          setIsVisible(true)
        }
        setIsPolling(false)
      })
      return () => {
        channel.stopListening(".job.progress.updated")
        window.Echo.leaveChannel(`job-progress.${userId}`)
      }
    }
  }, [isInitialized])

  // Pusher connection status
  useEffect(() => {
    const handleConnected = () => {
      console.log("Pusher connected - stopping polling")
      setConnectionStatus("connected")
      setIsPolling(false)
    }
    const handleDisconnected = () => {
      console.log("Pusher disconnected - starting polling")
      setConnectionStatus("disconnected")
      setIsPolling(true)
    }
    const handleError = () => {
      console.log("Pusher error - starting polling")
      setConnectionStatus("disconnected")
      setIsPolling(true)
    }

    window.addEventListener("pusher-connected", handleConnected)
    window.addEventListener("pusher-disconnected", handleDisconnected)
    window.addEventListener("pusher-error", handleError)

    return () => {
      window.removeEventListener("pusher-connected", handleConnected)
      window.removeEventListener("pusher-disconnected", handleDisconnected)
      window.removeEventListener("pusher-error", handleError)
    }
  }, [])

  // Fallback polling
  useEffect(() => {
    if (!isPolling || !isInitialized) return
    console.log("Starting fallback polling...")
    fetchJobs() // Initial fetch
    const interval = setInterval(fetchJobs, 3000)
    return () => {
      console.log("Stopping fallback polling...")
      clearInterval(interval)
    }
  }, [isPolling, isInitialized])

  // Initial load and flash message handling
  useEffect(() => {
    if (!isInitialized) return
    const flashSuccess = document.querySelector('meta[name="flash-success"]')?.getAttribute("content")
    if (flashSuccess) {
      try {
        const successData = JSON.parse(flashSuccess)
        if (successData.batch_id) {
          setIsVisible(true)
          setTimeout(fetchJobs, 1000)
        }
      } catch (e) {
        setIsVisible(true)
        setTimeout(fetchJobs, 1000)
      }
    } else {
      // Always fetch jobs on page load
      fetchJobs()
    }

    const handleJobStarted = (event: CustomEvent) => {
      if (event.detail?.batch_id) {
        setIsVisible(true)
        setTimeout(fetchJobs, 1000)
      }
    }

    window.addEventListener("job-started", handleJobStarted as EventListener)
    return () => window.removeEventListener("job-started", handleJobStarted as EventListener)
  }, [isInitialized])

  useEffect(() => {
    if (initialBatchId && isInitialized) {
      setIsVisible(true)
      fetchJobs()
    }
  }, [initialBatchId, isInitialized])

  const getJobTypeLabel = (jobType: string) => {
    switch (jobType) {
      case "bulk_email_preparation":
        return "Email Prep"
      case "bulk_email_sending":
        return "Email Send"
      default:
        return jobType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    }
  }

  const handleViewResults = (job: JobProgress) => {
    if (job.batch_id && job.status === "completed") {
      router.get(`/emails/review/${job.batch_id}`)
    }
  }

  const handleSendEmails = async (job: JobProgress) => {
    if (job.batch_id && job.status === "completed") {
      try {
        const response = await fetch(`/emails/review/${job.batch_id}/send-all`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
          },
        })
        if (response.ok) {
          console.log("Emails sent successfully")
          fetchJobs()
        }
      } catch (error) {
        console.error("Failed to send emails:", error)
      }
    }
  }

  const handleDismissJob = async (jobId: number) => {
    try {
      // Call API to dismiss job
      const response = await fetch(`/api/jobs/${jobId}/dismiss`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
        },
      })

      if (response.ok) {
        // Remove from local state
        setJobs((prev) => prev.filter((job) => job.id !== jobId))
      }
    } catch (error) {
      console.error("Failed to dismiss job:", error)
      // Still remove from local state as fallback
      setJobs((prev) => prev.filter((job) => job.id !== jobId))
    }
  }

  // 🔥 HANDLE HIDE TRACKER (REMEMBER USER CHOICE)
  const handleHideTracker = () => {
    setIsVisible(false)
    // Mark as manually hidden so it doesn't auto-show on new jobs
    localStorage.setItem(STORAGE_KEYS.isVisible, "false")
  }

  // 🔥 HANDLE SHOW TRACKER (CLEAR MANUAL HIDE FLAG)
  const handleShowTracker = () => {
    setIsVisible(true)
    localStorage.setItem(STORAGE_KEYS.isVisible, "true")
  }

  // Get overall progress for header when minimized
  const getOverallProgress = () => {
    const processingJobs = jobs.filter((job) => job.status === "processing")
    if (processingJobs.length === 0) return 0

    const totalProgress = processingJobs.reduce((sum, job) => sum + (job.progress_percentage || 0), 0)
    return totalProgress / processingJobs.length
  }

  const activeJobs = jobs.filter((job) => job.status === "started" || job.status === "processing")
  const hasProcessingJobs = activeJobs.length > 0

  // Don't render anything until initialized
  if (!isInitialized) {
    return null
  }

  // Floating toggle button - left side on desktop, center on mobile
  if (!isVisible && jobs.length > 0) {
    return (
      <TooltipProvider>
        <AnimatePresence>
          <div
            className="fixed bottom-4 left-0 transform translate-none z-50 px-4"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleShowTracker}
                  className="rounded-full h-10 w-10 shadow-lg bg-background border border-border hover:bg-accent text-foreground relative backdrop-blur-md"
                  size="sm"
                >
                  <Zap className="h-4 w-4" />
                  {connectionStatus === "connected" && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-background" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Show processes ({jobs.length} recent)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </AnimatePresence>
      </TooltipProvider>
    )
  }

  if (!isVisible || jobs.length === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <AnimatePresence>

        <div className="fixed bottom-4 left-4 md:left-4 md:transform-none transform z-50 space-y-2 w-96">
          {/* Header Card */}

            <Card className="border-none bg-primary-foreground backdrop-blur-md relative overflow-hidden">
              {/* Progress overlay for header when minimized - NO ANIMATION */}
              {isMinimized && hasProcessingJobs && (
                <div className="absolute inset-0 pointer-events-none">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{
                      width: `${getOverallProgress()}%`,
                    }}
                  // className="h-full bg-accent transition-all duration-300 ease-out"
                  // style={{
                  // width: `${job.progress_percentage || 0}%`,
                  // }}
                  />
                </div>
              )}

              <CardContent className="p-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${connectionStatus === "connected"
                        ? "bg-primary"
                        : connectionStatus === "connecting"
                          ? "bg-yellow-500 animate-pulse"
                          : "bg-destructive"
                        }`}
                    />
                    <span className="text-sm font-medium text-foreground">Processes</span>
                    <span className="text-sm text-muted-foreground">({jobs.length})</span>
                    {activeJobs.length > 0 && (
                      <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                        {activeJobs.length} active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.get("/jobs")}
                          className="h-6 w-6 p-0 hover:bg-accent text-muted-foreground"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View all</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsMinimized(!isMinimized)}
                          className="h-6 w-6 p-0 hover:bg-accent text-muted-foreground"
                        >
                          {isMinimized ? "+" : "-"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isMinimized ? "Expand" : "Minimize"}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleHideTracker}
                          className="h-6 w-6 p-0 hover:bg-accent text-muted-foreground"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Hide</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Job Cards */}
          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                layout transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-2 max-h-96 overflow-y-auto"
              >
                <AnimatePresence>
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                    >
                      <Card
                        className="relative overflow-hidden bg-primary-foreground border-b-4 border-b-orange-500/20 shadow-none backdrop-blur-md"
                      >
                        {/* Progress Fill - NO ANIMATION ON MOUNT */}
                        {job.status === "processing" && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div
                              className="h-full bg-accent transition-all duration-300 ease-out"
                              style={{
                                width: `${job.progress_percentage || 0}%`,
                              }}
                            />
                          </div>
                        )}

                        {/* Completed State */}
                        {job.status === "completed" && (
                          <div className="absolute inset-0 pointer-events-none bg-primary-foreground" />
                        )}

                        {/* Failed State */}
                        {job.status === "failed" && (
                          <div className="absolute inset-0 pointer-events-none bg-destructive/20" />
                        )}

                        <CardContent className="p-3 relative z-10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div>
                                <span className="text-sm font-medium text-foreground">
                                  {getJobTypeLabel(job.job_type)} <span className="text-xs text-muted-foreground">{job.started_at}</span>
                                </span>
                                <p className="text-xs text-muted-foreground">{job.status === "completed" && (
                                  <div className=" gap-1 text-xs ">
                                    {job.successful_items} Done
                                    {job.failed_items > 0 && (
                                      <>
                                        <XCircle className="h-3 w-3 text-destructive" />
                                        {job.failed_items}
                                      </>
                                    )}
                                  </div>
                                )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {job.status === "processing" && (
                                <div className="text-xs text-muted-foreground font-mono">
                                  {job.processed_items}/{job.total_items}
                                </div>
                              )}
                              {job.status === "failed" && (
                                <div className="flex items-center gap-1 text-xs text-destructive font-medium">
                                  <XCircle className="h-3 w-3" />
                                  Failed
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1 ml-2">
                                {job.status === "completed" && job.successful_items > 0 && (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleViewResults(job)}
                                          className="h-6 w-6 p-0 hover:bg-accent text-foreground hover:text-primary transition-colors"
                                        >
                                          <Eye className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Review</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleSendEmails(job)}
                                          className="h-6 w-6 p-0 hover:bg-accent text-foreground hover:text-primary transition-colors"
                                        >
                                          <Send className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Send all ({job.successful_items})</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDismissJob(job.id)}
                                      className="h-6 w-6 p-0 hover:bg-accent text-foreground hover:text-destructive transition-colors"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Dismiss</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AnimatePresence >
    </TooltipProvider >
  )
}
