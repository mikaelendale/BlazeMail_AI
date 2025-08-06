import AppLogo from "@/components/app-logo";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default function ComingSoonPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background image with adjustable opacity */}
            <div
                className="absolute inset-0 pointer-events-none z-0 opacity-10 dark:opacity-20"
                style={{
                    backgroundImage: "url('/images/footer-logo.svg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    // opacity: 0.1, // Adjust opacity here (0 = transparent, 1 = opaque)
                }}
            />
            <ModeToggle className="absolute top-4 right-4 z-10" />
            <div className="w-full max-w-4xl mx-auto text-center space-y-8 z-10 relative">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className=" flex items-center justify-center">
                        <AppLogo />
                    </div>
                </div>

                {/* Main heading */}
                <div className="space-y-4">
                    <h1 className="text-6xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                        Cold Outreach, <br />
                        Reimagined
                    </h1>
                    <p className="text-sm md:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        We’re building the fastest, smartest AI email engine to help founders, freelancers, and teams close more deals—without sounding like robots.
                        <br />
                        <Badge variant="default" className="mt-2 bg-gradient-to-br from-orange-200 via-orange-300 to-orange-400 border border-orange-500 text-orange-800">
                            Launching soon. Get early access.
                        </Badge>
                    </p>
                </div>
            </div>
        </div>
    )
}
