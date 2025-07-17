import { Button } from '@/components/ui/button'
import { CalendarCheck, ChevronRight, Target } from 'lucide-react'
import {Link} from '@inertiajs/react'

export default function FeaturesSection() {
    return (
        <section>
            <div className="py-24">
                <div className="mx-auto w-full max-w-5xl px-6">
                    <div className="grid gap-12 md:grid-cols-5">
                        <div className="md:col-span-2">
                            <h2 className="text-foreground text-balance text-4xl font-semibold">The AI Coding Assistant that helps you write code faster</h2>
                        </div>

                        <div className="space-y-6 md:col-span-3 md:space-y-10">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Target className="size-5" />
                                    <h3 className="text-foreground text-lg font-semibold">Code Generation</h3>
                                </div>
                                <p className="text-muted-foreground mt-3 text-balance">Just describe the code you want to write and we'll generate it for you. From boilerplate code to complex business logic, we've got you covered.</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <CalendarCheck className="size-5" />
                                    <h3 className="text-foreground text-lg font-semibold">Code Review</h3>
                                </div>
                                <p className="text-muted-foreground mt-3 text-balance">Get instant feedback on your code. Our AI will review your code and suggest improvements in terms of best practices and performance.</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative mt-16 px-12">
                        <div className="bg-background rounded-(--radius) relative mx-auto overflow-hidden border border-transparent shadow-lg shadow-black/10 ring-1 ring-black/10">
                            <img
                                src="demo/light_demo.png"
                                alt="app screen light"
                                width="2880"
                                height="1842"
                                className="block dark:hidden"
                            />
                            <img
                                src="demo/dark_demo.png"
                                alt="app screen dark"
                                width="2880"
                                height="1842"
                                className="hidden dark:block"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
