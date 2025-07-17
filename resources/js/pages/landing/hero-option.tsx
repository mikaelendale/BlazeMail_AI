import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

export default function HeroOption() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="max-w-6xl space-y-20 text-center">
                <div className="space-y-16">
                    <div className="space-y-8">
                        <div className="text-sm font-medium tracking-[0.4em] text-orange-500 uppercase">The Future of Professional Communication</div>

                        <h1 className="font-serif text-6xl leading-[0.9] tracking-tight text-foreground md:text-8xl lg:text-[9rem]">
                            Master the Art of
                            <br />
                            <span className="text-orange-500 italic">Cold Email</span>
                        </h1>

                        <div className="flex items-center justify-center gap-6">
                            <div className="h-px w-16 bg-orange-500"></div>
                            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                            <div className="h-px w-16 bg-orange-500"></div>
                        </div>
                    </div>

                    <div className="mx-auto max-w-4xl space-y-8">
                        <p className="text-2xl leading-relaxed font-light text-muted-foreground md:text-3xl">
                            In an era where digital communication defines professional success, master the sophisticated art of persuasive email
                            craftsmanship with AI precision.
                        </p>

                        <p className="mx-auto max-w-3xl text-lg leading-relaxed font-light text-muted-foreground/80">
                            Designed for discerning freelancers, visionary entrepreneurs, and ambitious professionals who refuse to accept mediocrity
                            in their outreach efforts.
                        </p>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="flex flex-col justify-center gap-6 sm:flex-row">
                        <Link href="/register">
                            <Button
                                size="lg"
                                className="bg-orange-500 px-12 py-6 text-lg font-medium tracking-wide text-white shadow-xl shadow-orange-500/20 hover:bg-orange-600"
                            >
                                Begin Mastery
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="lg"
                            className="border-2 bg-transparent px-12 py-6 text-lg font-medium tracking-wide transition-all duration-500 hover:border-orange-500 hover:text-orange-500"
                        >
                            Discover More
                        </Button>
                    </div>

                    <div className="text-xs font-light tracking-widest text-muted-foreground uppercase">Join the Elite • No Commitment Required</div>
                </div>
            </div>
        </div>
    );
}
