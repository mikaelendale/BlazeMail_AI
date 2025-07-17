import { Card, CardContent } from "@/components/ui/card"
import { Link } from "@inertiajs/react"
import { Github, Twitter, Youtube, MessageCircle } from "lucide-react"

const productLinks = [
    { href: "#", label: "Features" },
    { href: "#", label: "Pricing" },
    { href: "#", label: "Integrations" },
    { href: "#", label: "Roadmap" },
]

const helpLinks = [
    { href: "#", label: "Support" },
    { href: "#", label: "FAQ" },
    { href: "#", label: "Docs" },
    { href: "#", label: "Contact Us" },
]

const legalLinks = [
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Terms of Service" },
    { href: "#", label: "Cookie Policy" },
    { href: "#", label: "Data Security" },
]

const companyLinks = [
    { href: "#", label: "About BlazeMail" },
    { href: "#", label: "Changelog" },
    { href: "#", label: "Careers (Coming Soon)" },
    { href: "#", label: "Press Kit" },
]
 

const footerLinks = [
    {
        name: "Product",
        links: productLinks,
    },
    {
        name: "Help",
        links: helpLinks,
    },
    {
        name: "Legal",
        links: legalLinks,
    },
    {
        name: "Company",
        links: companyLinks,
    }, 
]

export default function Footer() {
    return (
        <footer className=" rounded-3xl bg-background">
            <div className="mx-auto max-w-6xl px-5 py-16">
                {/* Top Section with Social Icons and Links */}
                <div className="mb-16">
                    {/* Social Icons */}
                    <div className="flex items-center gap-4 mb-12">
                        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                            <Github className="h-5 w-5" />
                        </a>
                        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                            <Twitter className="h-5 w-5" />
                        </a>
                        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                            <Youtube className="h-5 w-5" />
                        </a>
                        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                            <MessageCircle className="h-5 w-5" />
                        </a>
                    </div>

                    {/* Links Grid */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4 lg:grid-cols-4">
                        {footerLinks.map((linksGroup, index) => (
                            <div key={index}>
                                <h3 className="font-semibold pb-3 text-foreground">{linksGroup.name}</h3>
                                <ul className="space-y-4">
                                    {linksGroup.links.map((link, linkIndex) => (
                                        <li key={linkIndex}>
                                            <a
                                                href={link.href}
                                                className="text-muted-foreground text-sm hover:text-foreground transition-colors duration-200"
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Description Card */}
                <div className="mb-12">
                    <p className="text-primary max-w-xl text-sm leading-relaxed">
                        Blazemail is a lightning-fast cold email generator that uses AI to write personalized, human-like emails
                        for lead gen, client outreach, and sales.
                    </p>
                </div>

                {/* Bottom Section with Copyright */}
                <div className="flex flex-wrap items-center gap-6 mb-16">
                    <span className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} Blazemail AI</span>
                    <Link href="#" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                        Legal
                    </Link>
                    <Link href="#" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                        Status
                    </Link>
                </div>
            </div>

            {/* Large Logo at Bottom */}
            <div className="mx-auto max-w-6xl px-3">
                <div className="relative">
                    <img src="/images/footer-logo.svg" className="w-full h-auto" alt="BlazeMail Logo" />
                </div>
            </div>
        </footer>
    )
}
