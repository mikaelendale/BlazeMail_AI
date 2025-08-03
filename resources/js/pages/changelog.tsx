"use client"

import { Head } from "@inertiajs/react"
import ReactMarkdown from "react-markdown"
import { Calendar, Sparkles, Rocket, Bug, Clock, ImageIcon, Plus, CircleFadingArrowUp, PackagePlus, Package, GitBranch, FolderSync, ChevronLeftCircle, Check, CheckCircle, CircleCheck, CalendarSync } from "lucide-react"
import LandingLayout from "./landing/landing-layout"
import { useState } from "react"

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
    title?: string
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
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

    // Parse changelog content into structured entries
    const parseChangelog = (content: string): ChangelogEntry[] => {
        const entries: ChangelogEntry[] = []
        const sections = content.split(/^## /m).filter(Boolean)

        sections.forEach((section) => {
            const lines = section.split("\n")
            const headerLine = lines[0]
            const versionMatch = headerLine.match(/\[([^\]]+)\]/)
            const dateMatch = headerLine.match(/(\d{4}-\d{2}-\d{2})/)

            let title: string | undefined = undefined
            if (lines[1] && lines[1].startsWith('#### ')) {
                title = lines[1].replace(/^#### /, '').trim()
            }

            const contentStart = title ? 2 : 1
            const entryContent = lines.slice(contentStart).join("\n")

            if (versionMatch && dateMatch) {
                entries.push({
                    version: versionMatch[1],
                    date: dateMatch[1],
                    title,
                    content: entryContent,
                })
            }
        })

        // Find the entry with the latest date
        let latestIndex = -1
        let latestDate = null
        entries.forEach((entry, idx) => {
            const entryDate = new Date(entry.date)
            if (!latestDate || entryDate > latestDate) {
                latestDate = entryDate
                latestIndex = idx
            }
        })
        // Set isLatest only for the latest entry
        if (latestIndex !== -1) {
            entries[latestIndex].isLatest = true
        }

        return entries
    }
    const changelogEntries = parseChangelog(changelogContent)

    const getUpdateTypeIcon = (text: string) => {
        if (text.includes("Added") || text.includes("✨")) {
            return <PackagePlus className="h-4 w-4 text-emerald-700" />
        } else if (text.includes("Improved") || text.includes("🚀")) {
            return <CircleFadingArrowUp className="text-sky-700 h-4 w-4" />
        } else if (text.includes("Fixed") || text.includes("🐛")) {
            return <Bug className="text-rose-700 h-4 w-4" />
        }
        return null
    }

    const getUpdateTypeColor = (text: string) => {
        if (text.includes("Added") || text.includes("✨")) {
            return "bg-accent border-primary-foreground "
        } else if (text.includes("Improved") || text.includes("🚀")) {
            return "bg-accent border-primary-foreground "
        } else if (text.includes("Fixed") || text.includes("🐛")) {
            return "bg-accent border-primary-foreground "
        }
        return "text-muted-foreground bg-muted border-border"
    }

    const handleImageError = (src: string) => {
        setImageErrors((prev) => new Set(prev).add(src))
    }

    const ImageComponent = ({ src, alt, title }: { src?: string; alt?: string; title?: string }) => {
        if (!src) return null

        const isError = imageErrors.has(src)

        if (isError) {
            return (
                <div className="my-4 flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-background p-8">
                    <div className="text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Failed to load image: {alt || "Untitled"}</p>
                    </div>
                </div>
            )
        }

        return (
            <div className="mt-6 overflow-hidden rounded-xl border border-accent bg-card">
                <img
                    src={src || "/placeholder.svg"}
                    alt={alt || ""}
                    title={title}
                    className="h-auto w-full object-cover"
                    onError={() => handleImageError(src)}
                    loading="lazy"
                />
            </div>
        )
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
                <section className="relative overflow-hidden pt-10 sm:pt-20 bg-background">
                    <div className="container relative mx-auto px-4 pt-20 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="mb-6 flex items-center justify-center">
                                <span className="inline-flex items-center rounded-full bg-gradient-to-br from-orange-500 via-accent to-orange-500 
                                dark:bg-gradient-to-br dark:from-orange-500 dark:via-accent dark:to-orange-500 px-4 py-1
                                text-sm font-medium text-primary border border-muted shadow-sm">
                                    <GitBranch className="mr-2 h-4 w-4" />
                                    Version {currentVersion}
                                </span>
                            </div>
                            <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
                                BlazeMail Changelog
                            </h1>
                            <p className="sm:text-lg text-sm text-muted-foreground mb-8">
                                Discover what's new, improved, and fixed in BlazeMail
                            </p>
                            <div className="flex items-center justify-center text-sm text-muted-foreground ">
                                <FolderSync className="mr-2 h-4 w-4" />
                                <span className="underline underline-offset-4">Last updated: {lastUpdated}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Timeline */}
                <main className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl">
                        <div className="relative">
                            {/* Timeline entries */}
                            <div className="space-y-12">
                                {changelogEntries.map((entry, index) => (
                                    <div key={entry.version} className="relative">
                                        {/* Timeline dot */}
                                        <div className="absolute left-0 top-0 z-10 flex flex-col items-center">
                                            {/* Vertical line above dot (except for first entry) */}
                                            {index !== 0 && (
                                                <div className="h-6 w-px bg-border" />
                                            )}
                                            {/* Timeline dot */}
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background shadow-sm ${entry.isLatest ? "border-primary shadow-primary/20" : "border-border"
                                                    }`}
                                            >
                                                {entry.isLatest ? (
                                                    <div className="h-3 w-3 rounded-full bg-primary" />
                                                ) : (
                                                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                                                )}
                                            </div>
                                            {/* Vertical line below dot (except for last entry) */}
                                            {index !== changelogEntries.length - 1 && (
                                                <div className="h-full w-px bg-border flex-1" />
                                            )}
                                        </div>

                                        {/* Content card */}
                                        <div className="ml-12">
                                            <div className="rounded-3xl border bg-primary-foreground p-6 border-accent">
                                                {/* Version header */}
                                                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-semibold ${entry.isLatest ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                                                }`}
                                                        >
                                                            {entry.version}
                                                        </span>
                                                        {entry.isLatest && (
                                                            <span className="inline-flex items-center rounded-lg bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                Latest
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                                                        <CalendarSync className="mr-2 h-4 w-4" />
                                                        {new Date(entry.date).toLocaleDateString("en-US", {
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric",
                                                        })}
                                                    </div>
                                                </div>
                                                {entry.title && (
                                                    <div className="mb-4 px-1 text-3xl sm:text-4xl font-bold text-primary">{entry.title}</div>
                                                )}

                                                {/* Content */}
                                                <div className="prose max-w-none dark:prose-invert">
                                                    <ReactMarkdown
                                                        components={{
                                                            h3: ({ children }) => {
                                                                const text = children?.toString() || ""
                                                                const icon = getUpdateTypeIcon(text)
                                                                const colorClass = getUpdateTypeColor(text)
                                                                return (
                                                                    <div
                                                                        className={` mt-8 first:mt-0 inline-flex items-center gap-2 rounded-xl border border-accent px-3 py-2 text-sm font-semibold  ${colorClass}`}
                                                                    >
                                                                        {icon}
                                                                        {children}
                                                                    </div>
                                                                )
                                                            },
                                                            ul: ({ children }) => <ul className="mt-3 space-y-2">{children}</ul>,
                                                            li: ({ children }) => (
                                                                <li className="flex gap-3 items-start py-1">
                                                                    <CircleCheck className=" h-5 w-5 pt-1 flex-shrink-0 " /><span className="text-foreground leading-relaxed">{children}</span>
                                                                </li>
                                                            ),
                                                            strong: ({ children }) => (
                                                                <strong className="font-semibold text-foreground">{children}</strong>
                                                            ),
                                                            code: ({ children }) => (
                                                                <code className="rounded-lg bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground">
                                                                    {children}
                                                                </code>
                                                            ),
                                                            pre: ({ children }) => (
                                                                <pre className="mt-6 overflow-x-auto rounded-xl bg-muted p-4 shadow-inner">
                                                                    <code className="text-sm font-mono text-foreground">{children}</code>
                                                                </pre>
                                                            ),
                                                            a: ({ href, children }) => (
                                                                <a
                                                                    href={href}
                                                                    className="font-semibold text-primary underline-offset-4"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {children}
                                                                </a>
                                                            ),
                                                            img: ({ src, alt, title }) => (
                                                                <ImageComponent src={src || "/placeholder.svg"} alt={alt} title={title} />
                                                            ),
                                                            p: ({ children }) => <p className="mb-4 leading-relaxed text-foreground">{children}</p>,
                                                            blockquote: ({ children }) => (
                                                                <blockquote className="border-l-4 border-primary bg-muted pl-6 py-4 my-6 italic text-foreground rounded-r-lg">
                                                                    {children}
                                                                </blockquote>
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
                        <div className="mt-20 text-center">
                            <div className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-primary ">
                                <Package className="mr-2 h-5 w-5" />
                                That's all for now! More updates coming soon.
                            </div>
                        </div>
                    </div>
                </main>
            </LandingLayout>
        </>
    )
}
