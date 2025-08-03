// import { motion } from "framer-motion";
// import { PenLine, TimerIcon } from "lucide-react";

// export default function CTA() {
//     return (
//         <>
//             <section
//                 className="flex items-center justify-center p-4 "
//             >
//                 <div className="relative w-full max-w-6xl">
//                     <div className="relative w-full max-w-6xl rounded-4xl p-8 sm:p-12">
//                         <div className="text-center space-y-6 sm:space-y-8">
//                             {/* <div className="flex justify-center mb-4 sm:mb-6 mt-4 sm:mt-8">
//                                 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent rounded-full flex items-center justify-center">
//                                     <AppLogo />
//                                 </div>
//                             </div> */}
//                             <div className="mb-2 mt-5">
//                                 <h2 id="contact-heading" className="text-xl sm:text-2xl font-medium text-primary">
//                                     Stay Connected!
//                                 </h2>
//                                 <h3 className="text-xl sm:text-2xl font-medium text-primary">Message Us & Follow</h3>
//                             </div>
//                             <p className="text-muted-foreground text-sm leading-relaxed mb-6 px-2 max-w-xs sm:max-w-sm mx-auto">
//                                 Send us a message or follow us on our <br className="hidden sm:block" />
//                                 <span className="sm:hidden"> </span>social media channels to stay updated always.
//                             </p>
//                             <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-2 mb-8 sm:mb-12 px-4 sm:px-0">
//                                 <a href="mailto:mikaelendale00@gmail.com" className="w-full sm:w-auto" aria-label="Send us an email">
//                                     <button className="w-full sm:w-auto text-sm bg-primary text-white dark:text-black font-medium py-4 sm:py-3.5 px-6 rounded-full flex items-center justify-center gap-2.5 transition-colors">
//                                         <PenLine className="w-4 h-4" aria-hidden="true" />
//                                         <span>Write Us</span>
//                                     </button>
//                                 </a>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </section>
//         </>
//     );
// };


import { Button } from "@/components/ui/button"
import { router } from "@inertiajs/react"
import { ChevronRight } from "lucide-react"

export default function CTA() {
    return (
        <section className=" flex flex-col items-center justify-center px-4 py-16 relative">
            {/* Background with dotted pattern */}
            <div className="max-w-5xl mx-auto text-center space-y-10 relative z-10">
                {/* Logo Icons */}
                <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center -space-x-4">
                        {/* First Avatar */}
                        <div className="relative z-30 select-none pointer-events-none">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-accent rounded-full p-1 shadow-lg">
                                <img
                                    src="/fuad.png"
                                    alt="User 1"
                                    className="w-full h-full rounded-full object-cover border-2 border-primary-foreground select-none pointer-events-none"
                                    draggable={false}
                                    style={{ userSelect: "none", pointerEvents: "none" }}
                                />
                            </div>
                        </div>

                        {/* Second Avatar */}
                        <div className="relative z-20 select-none pointer-events-none">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-accent rounded-full p-1 shadow-lg">
                                <img
                                    src="/sami.png"
                                    alt="User 2"
                                    className="w-full h-full rounded-full object-cover border-2 border-primary-foreground select-none pointer-events-none"
                                    draggable={false}
                                    style={{ userSelect: "none", pointerEvents: "none" }}
                                />
                            </div>
                        </div>

                        {/* Third Avatar */}
                        <div className="relative z-10 select-none pointer-events-none">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-accent rounded-full p-1 shadow-lg">
                                <img
                                    src="Mike.png"
                                    alt="User 3"
                                    className="w-full h-full rounded-full object-cover border-2 border-primary-foreground select-none pointer-events-none"
                                    draggable={false}
                                    style={{ userSelect: "none", pointerEvents: "none" }}
                                />
                            </div>
                        </div>

                        {/* Plus indicator for more users */}
                        <div className="relative z-0">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg border-2 border-accent select-none pointer-events-none">
                                <span className="text-white font-bold text-sm md:text-lg select-none pointer-events-none">+12</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-8">
                    <h1 className="sm:text-5xl text-3xl  font-bold text-primary leading-[0.9] tracking-tight">
                        Start sending smarter emails →
                    </h1>

                    <p className="text-lg md:text-xl text-secondary max-w-xl mx-auto leading-relaxed font-normal">
                        BlazeMail is the shortest path between question and{"\n"}
                        answer, delivering true business value in the shortest time.
                    </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 pt-4">
                    <Button
                    onClick={() => router.get('/register')}
                        size="lg"
                        className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-medium rounded-2xl md:rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                        Start for Free
                    </Button>
                    <Button
                        onClick={() => router.get('/how-it-works')}
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto group px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-medium rounded-2xl md:rounded-3xl hover:bg-accent transition-all duration-200 bg-transparent"
                    >
                        See How It Works
                        <ChevronRight className="ml-2 md:ml-3 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                </div>
            </div>
        </section>
    )
}
