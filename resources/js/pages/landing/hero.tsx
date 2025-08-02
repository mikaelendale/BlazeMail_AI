import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

export default function Hero() {
    return (
        <div className="p container mx-auto py-12">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 pt-11 text-center md:flex-row md:items-start md:text-left">
                {/* Hero Section */}
                <div className="relative mb-16 flex-1  pt-20 md:mb-0">
                    <div className="relative z-10 flex flex-col items-center justify-center px-4 py-12 text-center">
                        <h1 className="mb-6 text-5xl font-bold tracking-tight text-primary drop-shadow-lg md:text-[7rem]">
                            Write Cold Emails That Actually Get Replies
                            <br />
                        </h1>
                        <p className="mb-8 max-w-2xl text-xl leading-relaxed text-primary/90 drop-shadow-md">
                            AI-powered cold email tool targeting freelancers, solopreneurs, B2B startups, and students.
                        </p>
                        {/* Responsive CTA Buttons */}
                        <div className="mt-4 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link href="/register">
                                <Button className="w-full px-8 py-3 text-lg font-semibold shadow-md sm:w-auto" size="lg">
                                    Get Started Free
                                </Button>
                            </Link>
                            <a href="https://youtube.com" target='_blank'>
                                <Button variant="outline" className="w-full px-8 py-3 text-lg font-semibold shadow sm:w-auto" size="lg">
                                    See Live Demo
                                </Button>
                            </a>
                        </div>
                    </div>
                    {/* Background Image */}
                    {/* <div className="absolute inset-0 z-0 hidden overflow-hidden bg-no-repeat bg-cover md:block">
                        <img src="/images/pattern.png" alt="Background Image" className=" dark:hidden h-150 object-cover" />
                        <img src="/images/pattern-dark.png" alt="Background Image" className=" hidden dark:block h-150 object-cover" />
                    </div> */}

                    {/* Video Demo Section */}
                    {/* <div className="px-2 lg:px-16">
                        <div className="flex items-center justify-center mx-auto max-w-6xl border-7 dark:border border-accent bg-accent rounded-4xl">
                            <div className="relative w-full border dark:border-7 bg-accent border-accentdark:rounded-4xl rounded-3xl overflow-hidden">
                                <p className="text-sm sm:text-md flex justify-center items-center bg-accent lg:text-md py-2">Discover the future of <strong className="px-1">Cold email </strong>  in action.</p>
                                <video autoPlay muted loop playsInline className="w-full border-b bg-primary-foreground rounded-3xl h-auto">
                                    <source src="/demo-video.mp4" type="video/mp4" />
                                </video>
                                <div className="absolute inset-0 flex items-end justify-center ">
                                    <div className="text-center text-primary">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
}
