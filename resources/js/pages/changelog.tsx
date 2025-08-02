"use client"

import { Head } from "@inertiajs/react"
import ReactMarkdown from "react-markdown"
import { Calendar, Sparkles, Rocket, Bug, Clock, ImageIcon, Plus, CircleFadingArrowUp, PackagePlus } from "lucide-react"
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
        return <PackagePlus className="h-4 w-4" />
    } else if (text.includes("Improved") || text.includes("🚀")) {
        return <CircleFadingArrowUp className="h-4 w-4" />
    } else if (text.includes("Fixed") || text.includes("🐛")) {
      return <Bug className="h-4 w-4" />
    }
    return null
  }

  const getUpdateTypeColor = (text: string) => {
    if (text.includes("Added") || text.includes("✨")) {
      return "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800"
    } else if (text.includes("Improved") || text.includes("🚀")) {
      return "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-950 dark:border-sky-800"
    } else if (text.includes("Fixed") || text.includes("🐛")) {
      return "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950 dark:border-rose-800"
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
      <div className="my-6 overflow-hidden rounded-lg border bg-card shadow-sm">
        <img
          src={src || "/placeholder.svg"}
          alt={alt || ""}
          title={title}
          className="h-auto w-full object-cover"
          onError={() => handleImageError(src)}
          loading="lazy"
        />
        {(alt || title) && <div className="px-4 py-3 text-sm text-muted-foreground">{alt || title}</div>}
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
          <div className="container relative mx-auto px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 flex items-center justify-center">
                <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Version {currentVersion}
                </span>
              </div>
              <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
                BlazeMail Changelog
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover what's new, improved, and fixed in BlazeMail
              </p>
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <Clock className="mr-2 h-4 w-4" />
                <span>Last updated: {lastUpdated}</span>
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
                    <div className="absolute left-0 top-0 z-10">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background shadow-sm ${
                          entry.isLatest ? "border-primary shadow-primary/20" : "border-border"
                        }`}
                      >
                        {entry.isLatest ? (
                          <div className="h-3 w-3 rounded-full bg-primary" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Content card */}
                    <div className="ml-12">
                      <div className="rounded-xl border bg-card p-6 shadow-sm border-t-4 border-l-4 border-primary">
                        {/* Version header */}
                        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-semibold shadow-sm ${
                                entry.isLatest ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
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
                            <Calendar className="mr-2 h-4 w-4" />
                            {new Date(entry.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        </div>

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
                                    className={`mb-6 mt-8 first:mt-0 inline-flex items-center gap-2 rounded-xl border border-accent px-3 py-2 text-sm font-semibold  ${colorClass}`}
                                  >
                                    {icon}
                                    {children}
                                  </div>
                                )
                              },
                              ul: ({ children }) => <ul className="mt-3 space-y-2">{children}</ul>,
                              li: ({ children }) => (
                                <li className="flex items-start">
                                  <span className="mr-4 mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                                  <span className="text-foreground leading-relaxed">{children}</span>
                                </li>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-bold text-foreground">{children}</strong>
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
              <div className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-primary-foreground font-semibold shadow-md">
                <Sparkles className="mr-2 h-5 w-5" />
                That's all for now! More updates coming soon.
              </div>
            </div>
          </div>
        </main>
      </LandingLayout>
    </>
  )
}
