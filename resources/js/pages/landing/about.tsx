import { Star, Calendar, Grid3X3, BarChart3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function About() {
    return (
        <div className=" z-3">
            {/* About Section */}
            <div className="p-8 lg:p-16">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Badge className="bg-accent text-accent-foreground">
                                <span className="text-sm">About BlazeMail</span>
                            </Badge>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
                        {/* Left Content */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="space-y-4">
                                <h1 className="text-xl lg:text-2xl font-normal leading-snug">
                                    <span className="text-muted-foreground">BlazeMail</span> <span className="text-foreground font-semibold">is your unfair advantage in cold outreach.</span> <span className="text-muted-foreground">Powered by ultra-fast AI, it crafts human-sounding, hyper-personalized cold emails in seconds. </span>
                                    <span className="text-foreground font-semibold">Built for freelancers, founders, and sales pros.</span>
                                </h1>
                            </div>

                            <div className="space-y-4">
                                <p className="text-xl lg:text-2xl font-normal leading-snug">
                                    <span className="text-muted-foreground"> BlazeMail</span> <span className="text-muted-foreground ">helps you land replies, book meetings, and</span> <span className="text-foreground font-semibold">close deals faster than ever.</span> <span className="text-muted-foreground">  Say goodbye to generic templates and </span><span className="text-foreground font-semibold">hello to cold email that actually works.</span>
                                    <span className="text-muted-foreground"> of the innovation curve.</span>
                                </p>
                            </div>
                        </div>

                        {/* Right Sidebar */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Beta Access:</p>
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-base font-medium text-foreground">Q3, 2025</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">AI Engine:</p>
                                <div className="flex items-center gap-3">
                                    <Grid3X3 className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-base font-medium text-foreground">Speed-Tuned Generation</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Technology:</p>
                                <div className="flex items-center gap-3">
                                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-base font-medium text-foreground"> LLMs + Smart Prompting</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}