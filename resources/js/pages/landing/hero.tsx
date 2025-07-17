import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

export default function Hero() {
    return (
        <div className="p container mx-auto py-12">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 pt-11 text-center md:flex-row md:items-start md:text-left">
                {/* Hero Section */}
                <div className="relative mb-16 flex-1 pt-20 md:mb-0">
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
                    {/* Background Image
                    <div className="absolute inset-0 z-0 hidden overflow-hidden bg-no-repeat bg-cover md:block">
                        <img src="/images/bg_pattern.png" alt="Background Image" className=" dark:hidden h-150 object-cover" />
                        <img src="/images/bg_pattern_dark.png" alt="Background Image" className=" hidden dark:block h-150 object-cover" />
                    </div> */}
                </div>
            </div>
        </div>
    );
}
