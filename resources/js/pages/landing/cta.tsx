import { motion } from "framer-motion";
import { PenLine, TimerIcon } from "lucide-react";

export default function CTA() {
    return (
        <>
            <section
                className="flex items-center justify-center p-4 sm:p-6"
            >
                <div className="relative w-full max-w-6xl  ">
                    <div className="relative w-full max-w-6xl rounded-4xl p-8 sm:p-12">
                        <div className="text-center space-y-6 sm:space-y-8">
                            {/* <div className="flex justify-center mb-4 sm:mb-6 mt-4 sm:mt-8">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent rounded-full flex items-center justify-center">
                                    <AppLogo />
                                </div>
                            </div> */}
                            <div className="mb-2 mt-5">
                                <h2 id="contact-heading" className="text-xl sm:text-2xl font-medium text-primary">
                                    Stay Connected!
                                </h2>
                                <h3 className="text-xl sm:text-2xl font-medium text-primary">Message Us & Follow</h3>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-6 px-2 max-w-xs sm:max-w-sm mx-auto">
                                Send us a message or follow us on our <br className="hidden sm:block" />
                                <span className="sm:hidden"> </span>social media channels to stay updated always.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-2 mb-8 sm:mb-12 px-4 sm:px-0">
                                <a href="mailto:mikaelendale00@gmail.com" className="w-full sm:w-auto" aria-label="Send us an email">
                                    <button className="w-full sm:w-auto text-sm bg-primary text-white dark:text-black font-medium py-4 sm:py-3.5 px-6 rounded-full flex items-center justify-center gap-2.5 transition-colors">
                                        <PenLine className="w-4 h-4" aria-hidden="true" />
                                        <span>Write Us</span>
                                    </button>
                                </a> 
                            </div> 
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};
