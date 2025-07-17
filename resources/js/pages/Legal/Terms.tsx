import { Head, Link, router } from "@inertiajs/react"
import ReactMarkdown from "react-markdown"
import { ArrowLeft, Scale, Clock, FileText, Mail, Phone, MapPin } from "lucide-react"
import LandingLayout from "../landing/landing-layout"
import { Button } from "@/Components/ui/button"

interface TermsProps {
    content: string
    pageTitle: string
    pageDescription: string
    lastUpdated: string
    pageType: string
}

export default function Terms({ content, pageTitle, pageDescription, lastUpdated, pageType }: TermsProps) {
    // Extract sections from markdown content
    const sections = content.split(/^## /m).filter(Boolean).slice(1) // Remove title section

    return (
        <>
            <Head>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta name="twitter:title" content={pageTitle} />
                <meta name="twitter:description" content={pageDescription} />
            </Head>
            <LandingLayout>

                {/* Hero Section */}
                <section className="pt-10 sm:pt-20 relative overflow-hidden ">
                    <div className="container relative mx-auto px-4 py-20 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <h1 className="mb-6 text-5xl font-bold tracking-tight text-primary sm:text-6xl">Terms of Service</h1>
                            <p className="text-xl text-primary mb-8">
                                The terms and conditions that govern your use of BlazeMail services
                            </p>
                        </div>
                    </div>
                </section>

                {/* Table of Contents */}
                <section className="bg-background">
                    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-4xl">
                            <h2 className="mb-6 text-xl font-semibold text-foreground">Table of Contents</h2>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {sections.map((section, index) => {
                                    const title = section.split("\n")[0].replace(/^### /, "").replace(/^# /, "")
                                    const slug = title
                                        .toLowerCase()
                                        .replace(/[^a-z0-9]+/g, "-")
                                        .replace(/(^-|-$)/g, "")
                                    return (
                                        <a
                                            key={index}
                                            href={`#${slug}`}
                                            className="flex items-center rounded-lg border p-3 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                                        >
                                            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                                            {title}
                                        </a>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Content */}
                <main className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl">
                        <div className="prose prose-lg max-w-none">
                            <ReactMarkdown
                                components={{
                                    h1: ({ children }) => (
                                        <h1 className="mb-8 text-4xl font-bold tracking-tight text-foreground">{children}</h1>
                                    ),
                                    h2: ({ children }) => {
                                        const text = children?.toString() || ""
                                        const slug = text
                                            .toLowerCase()
                                            .replace(/[^a-z0-9]+/g, "-")
                                            .replace(/(^-|-$)/g, "")
                                        return (
                                            <div className="mb-8 mt-16 first:mt-0">
                                                <h2 id={slug} className="mb-4 text-2xl font-bold text-foreground scroll-mt-20">
                                                    {children}
                                                </h2>
                                                <hr className="border-border" />
                                            </div>
                                        )
                                    },
                                    h3: ({ children }) => <h3 className="mb-4 mt-8 text-xl font-semibold text-foreground">{children}</h3>,
                                    h4: ({ children }) => <h4 className="mb-3 mt-6 text-lg font-semibold text-foreground">{children}</h4>,
                                    p: ({ children }) => <p className="mb-4 leading-relaxed text-muted-foreground">{children}</p>,
                                    ul: ({ children }) => <ul className="mb-6 space-y-2 pl-6">{children}</ul>,
                                    li: ({ children }) => (
                                        <li className="flex items-start">
                                            <span className="mr-3 mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                                            <span className="text-muted-foreground leading-relaxed">{children}</span>
                                        </li>
                                    ),
                                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                                    code: ({ children }) => (
                                        <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground">{children}</code>
                                    ),
                                    pre: ({ children }) => (
                                        <pre className="mb-6 overflow-x-auto rounded-lg bg-muted p-4">
                                            <code className="text-sm font-mono text-foreground">{children}</code>
                                        </pre>
                                    ),
                                    a: ({ href, children }) => (
                                        <a
                                            href={href}
                                            className="text-primary underline-offset-4 hover:underline"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {children}
                                        </a>
                                    ),
                                    blockquote: ({ children }) => (
                                        <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
                                            {children}
                                        </blockquote>
                                    ),
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    </div>
                </main>

                {/* Contact Section */}
                <section className="bg-background">
                    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-4xl text-center">
                            <h2 className="mb-8 text-3xl font-bold text-primary">Legal Questions?</h2>
                            <p className="mb-8 text-lg text-secondary">
                                Contact our legal team for questions about these terms or our services.
                            </p>
                            <Button onClick={() => router.get('/support')} className="" variant={'outline'}>
                                Ask Here
                            </Button>
                        </div>
                    </div>
                </section>
            </LandingLayout>
        </>
    )
}
