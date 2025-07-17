import { Head, Link } from "@inertiajs/react"
import ReactMarkdown from "react-markdown"
import { ArrowLeft, Calendar, Tag, Sparkles, Rocket, Bug, Clock } from "lucide-react"
import LandingLayout from "./landing/landing-layout"

interface ChangelogProps {
    changelogContent: string
    pageTitle: string
    pageDescription: string
    currentVersion: string
    lastUpdated: string
}

interface ChangelogEntry {
    version: string
    date: string
    content: string
    isLatest?: boolean
}

export default function Changelog({
    changelogContent,
    pageTitle,
    pageDescription,
    currentVersion,
    lastUpdated,
}: ChangelogProps) {
    // Parse changelog content into structured entries
    const parseChangelog = (content: string): ChangelogEntry[] => {
        const entries: ChangelogEntry[] = []
        const sections = content.split(/^## /m).filter(Boolean)

        sections.forEach((section, index) => {
            const lines = section.split("\n")
            const headerLine = lines[0]
            const versionMatch = headerLine.match(/\[([^\]]+)\]/)
            const dateMatch = headerLine.match(/(\d{4}-\d{2}-\d{2})/)

            if (versionMatch && dateMatch) {
                entries.push({
                    version: versionMatch[1],
                    date: dateMatch[1],
                    content: lines.slice(1).join("\n"),
                    isLatest: index === 0,
                })
            }
        })

        return entries
    }

    const changelogEntries = parseChangelog(changelogContent)

    const getUpdateTypeIcon = (text: string) => {
        if (text.includes("Added") || text.includes("✨")) {
            return <Sparkles className="h-4 w-4" />
        } else if (text.includes("Improved") || text.includes("🚀")) {
            return <Rocket className="h-4 w-4" />
        } else if (text.includes("Fixed") || text.includes("🐛")) {
            return <Bug className="h-4 w-4" />
        }
        return null
    }

    const getUpdateTypeColor = (text: string) => {
        if (text.includes("Added") || text.includes("✨")) {
            return "text-primary   border-accent"
        } else if (text.includes("Improved") || text.includes("🚀")) {
            return "text-primary  border-accent"
        } else if (text.includes("Fixed") || text.includes("🐛")) {
            return "text-primary   border-accent"
        }
        return "text-gray-600 bg-gray-50 border-gray-200"
    }

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
                <section className="relative overflow-hidden pt-10 sm:pt-20">
                    <div className="container relative mx-auto px-4 py-20 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="mb-6 flex items-center justify-center">
                                <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary  ">
                                    Version {currentVersion}
                                </span>
                            </div>
                            <h1 className="mb-6 text-5xl font-bold tracking-tight text-primaey sm:text-6xl">
                                BlazeMail Changelog
                            </h1>
                            <p className="text-xl text-muted-foreground mb-8">See what's new, improved, and fixed in BlazeMail</p>
                            <div className="flex items-center justify-center text-sm text-muted-foreground">
                                <Clock className="mr-2 h-4 w-4" />
                                <span>Last updated: {lastUpdated}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Timeline */}
                <main className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl">
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-accent md:left-1/2 md:-translate-x-px" />

                            {/* Timeline entries */}
                            <div className="space-y-12">
                                {changelogEntries.map((entry, index) => (
                                    <div key={entry.version} className="relative">
                                        {/* Timeline dot */}
                                        <div className="absolute left-8 -translate-x-1/2 md:left-1/2">
                                            <div
                                                className={`flex h-12 w-12 items-center justify-center rounded-full border-4 border-orange-500 bg-background ${entry.isLatest ? "border-primary shadow-lg shadow-primary/25" : "border-border"
                                                    }`}
                                            >
                                                {entry.isLatest ? (
                                                    <div className="h-3 w-3 rounded-full bg-orange-500" />
                                                ) : (
                                                        <div className="h-3 w-3 rounded-full bg-orange-500" />

                                                )}
                                            </div>
                                        </div>

                                        {/* Content card */}
                                        <div className={`ml-20 md:ml-0 ${index % 2 === 0 ? "md:mr-1/2 md:pr-12" : "md:ml-1/2 md:pl-12"}`}>
                                            <div className="group relative overflow-hidden rounded-xl border-t-4 border-l-4 border-t-orange-500 border-l-orange-500 bg-card p-6 shadow-sm transition-all hover:shadow-md">
                                                {entry.isLatest && (
                                                    <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-primary/10" />
                                                )}

                                                {/* Version header */}
                                                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-semibold ${entry.isLatest ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                                                }`}
                                                        >
                                                            {entry.version}
                                                        </span>
                                                        {entry.isLatest && (
                                                            <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                                                Latest
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-sm text-muted-foreground">
                                                        {new Date(entry.date).toLocaleDateString("en-US", {
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric",
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="prose prose-sm max-w-none">
                                                    <ReactMarkdown
                                                        components={{
                                                            h3: ({ children }) => {
                                                                const text = children?.toString() || ""
                                                                const icon = getUpdateTypeIcon(text)
                                                                const colorClass = getUpdateTypeColor(text)

                                                                return (
                                                                    <div
                                                                        className={`mb-4 mt-6 first:mt-0 inline-flex items-center rounded-lg border px-3 py-2 text-sm font-semibold ${colorClass}`}
                                                                    >
                                                                        {children}
                                                                    </div>
                                                                )
                                                            },
                                                            ul: ({ children }) => <ul className="mt-3 space-y-2">{children}</ul>,
                                                            li: ({ children }) => (
                                                                <li className="flex items-start">
                                                                    <span className="mr-3 mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                                                                    <span className="text-muted-foreground leading-relaxed">{children}</span>
                                                                </li>
                                                            ),
                                                            strong: ({ children }) => (
                                                                <strong className="font-semibold text-foreground">{children}</strong>
                                                            ),
                                                            code: ({ children }) => (
                                                                <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground">
                                                                    {children}
                                                                </code>
                                                            ),
                                                            pre: ({ children }) => (
                                                                <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-4">
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
                                                        }}
                                                    >
                                                        {entry.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* End of timeline */}
                        <div className="mt-16 text-center">
                            <div className="inline-flex items-center rounded-full px-6 py-3 text-sm text-primary">
                                That's all for now! More updates coming soon.
                            </div>
                        </div>
                    </div>
                </main>
            </LandingLayout>
        </>
    )
}
