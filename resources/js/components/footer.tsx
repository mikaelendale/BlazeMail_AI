import { Card, CardContent } from "@/components/ui/card"
import { Link, router } from "@inertiajs/react"
import { Github, Twitter, Youtube, MessageCircle } from "lucide-react"
import { Separator } from "./ui/separator"
import AppLogo from "./app-logo"
import { Button } from "./ui/button"

const productLinks = [
    { href: "#features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
]

const helpLinks = [
    { href: "/support", label: "Support" },
    { href: "/support", label: "FAQ" },
    { href: "/support", label: "Contact Us" },
]

const legalLinks = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
]

const companyLinks = [
    { href: "/about", label: "About BlazeMail" },
    { href: "/changelog", label: "Changelog" },
    { href: "#", label: "Press Kit (coming soon)" },
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
        <footer className="rounded-3xl">
            <div className="mx-auto max-w-6xl px-5 pb-10">

                <div className="bg-gradient-to-br from-primary-foreground via-orange-100 to-primary-foreground dark:from-primary-foreground dark:via-orange-500/20 dark:to-primary-foreground rounded-3xl py-10 px-6 mb-6 border-7 border-muted ">
                    <div className="px-4">
                        <div className="mb-16">
                            {/* Links Grid */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4 lg:grid-cols-4">
                                {footerLinks.map((linksGroup, index) => (
                                    <div key={index}>
                                        <h3 className="font-semibold pb-3 text-foreground">{linksGroup.name}</h3>
                                        <ul className="space-y-4">
                                            {linksGroup.links.map((link, linkIndex) => (
                                                <li key={linkIndex}>
                                                    <Link
                                                        href={link.href}
                                                        className="text-muted-foreground text-sm hover:text-foreground transition-colors duration-200"
                                                    >
                                                        {link.label}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Section with Copyright */}
                        <div className="flex flex-wrap justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <span className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} Blazemail AI</span>
                                {/* <Link href="#" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                                    Status
                                </Link> */}
                            </div>
                            {/* Social Icons */}
                            <div className="flex items-center gap-6">
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    <svg className="h-7 w-7 block dark:hidden" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M20.9992 5.95846C21.0087 6.565 20.9333 7.32649 20.8658 7.8807C20.8395 8.09686 20.8037 8.27676 20.7653 8.42453C21.6227 10.01 22 11.9174 22 14C22 16.4684 20.8127 18.501 18.9638 19.8871C17.1319 21.2605 14.6606 22 12 22C9.33939 22 6.86809 21.2605 5.0362 19.8871C3.18727 18.501 2 16.4684 2 14C2 11.9174 2.37732 10.01 3.23472 8.42452C3.19631 8.27676 3.16055 8.09685 3.13422 7.8807C3.06673 7.32649 2.99133 6.565 3.00081 5.95846C3.01149 5.27506 3.10082 4.5917 3.19988 3.91379C3.24569 3.60028 3.31843 3.30547 3.65883 3.11917C4.00655 2.92886 4.37274 2.99981 4.73398 3.1021C5.95247 3.44713 7.09487 3.93108 8.16803 4.51287C9.2995 4.17287 10.5783 4 12 4C13.4217 4 14.7005 4.17287 15.832 4.51287C16.9051 3.93108 18.0475 3.44713 19.266 3.1021C19.6273 2.99981 19.9935 2.92886 20.3412 3.11917C20.6816 3.30547 20.7543 3.60028 20.8001 3.91379C20.8992 4.5917 20.9885 5.27506 20.9992 5.95846ZM20 14C20 12.3128 19.6122 10 17.5 10C16.5478 10 15.6474 10.2502 14.7474 10.5004C13.8482 10.7502 12.9495 11 12 11C11.0505 11 10.1518 10.7502 9.25263 10.5004C8.35261 10.2502 7.45216 10 6.5 10C4.39379 10 4 12.3197 4 14C4 15.7636 4.82745 17.231 6.23588 18.2869C7.66135 19.3556 9.69005 20 12 20C14.3099 20 16.3386 19.3555 17.7641 18.2869C19.1726 17.231 20 15.7636 20 14ZM10 14.5C10 15.8807 9.32843 17 8.5 17C7.67157 17 7 15.8807 7 14.5C7 13.1193 7.67157 12 8.5 12C9.32843 12 10 13.1193 10 14.5ZM15.5 17C16.3284 17 17 15.8807 17 14.5C17 13.1193 16.3284 12 15.5 12C14.6716 12 14 13.1193 14 14.5C14 15.8807 14.6716 17 15.5 17Z" fill="#000000"></path></svg>
                                    <svg className="h-7 w-7 hidden dark:block" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M20.9992 5.95846C21.0087 6.565 20.9333 7.32649 20.8658 7.8807C20.8395 8.09686 20.8037 8.27676 20.7653 8.42453C21.6227 10.01 22 11.9174 22 14C22 16.4684 20.8127 18.501 18.9638 19.8871C17.1319 21.2605 14.6606 22 12 22C9.33939 22 6.86809 21.2605 5.0362 19.8871C3.18727 18.501 2 16.4684 2 14C2 11.9174 2.37732 10.01 3.23472 8.42452C3.19631 8.27676 3.16055 8.09685 3.13422 7.8807C3.06673 7.32649 2.99133 6.565 3.00081 5.95846C3.01149 5.27506 3.10082 4.5917 3.19988 3.91379C3.24569 3.60028 3.31843 3.30547 3.65883 3.11917C4.00655 2.92886 4.37274 2.99981 4.73398 3.1021C5.95247 3.44713 7.09487 3.93108 8.16803 4.51287C9.2995 4.17287 10.5783 4 12 4C13.4217 4 14.7005 4.17287 15.832 4.51287C16.9051 3.93108 18.0475 3.44713 19.266 3.1021C19.6273 2.99981 19.9935 2.92886 20.3412 3.11917C20.6816 3.30547 20.7543 3.60028 20.8001 3.91379C20.8992 4.5917 20.9885 5.27506 20.9992 5.95846ZM20 14C20 12.3128 19.6122 10 17.5 10C16.5478 10 15.6474 10.2502 14.7474 10.5004C13.8482 10.7502 12.9495 11 12 11C11.0505 11 10.1518 10.7502 9.25263 10.5004C8.35261 10.2502 7.45216 10 6.5 10C4.39379 10 4 12.3197 4 14C4 15.7636 4.82745 17.231 6.23588 18.2869C7.66135 19.3556 9.69005 20 12 20C14.3099 20 16.3386 19.3555 17.7641 18.2869C19.1726 17.231 20 15.7636 20 14ZM10 14.5C10 15.8807 9.32843 17 8.5 17C7.67157 17 7 15.8807 7 14.5C7 13.1193 7.67157 12 8.5 12C9.32843 12 10 13.1193 10 14.5ZM15.5 17C16.3284 17 17 15.8807 17 14.5C17 13.1193 16.3284 12 15.5 12C14.6716 12 14 13.1193 14 14.5C14 15.8807 14.6716 17 15.5 17Z" fill="#ffffff"></path></svg>
                                </a>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    <svg className="h-6 w-6 text-black dark:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><g fill="none"><g clip-path="url(#primeTwitter0)"><path fill="currentColor" d="M11.025.656h2.147L8.482 6.03L14 13.344H9.68L6.294 8.909l-3.87 4.435H.275l5.016-5.75L0 .657h4.43L7.486 4.71zm-.755 11.4h1.19L3.78 1.877H2.504z" /></g><defs><clipPath id="primeTwitter0"><path fill="#fff" d="M0 0h14v14H0z" /></clipPath></defs></g></svg>
                                </a>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    <svg className="h-7 w-7" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g fill="none" fill-rule="evenodd"><path d="M36,72 L36,72 C55.882251,72 72,55.882251 72,36 L72,36 C72,16.117749 55.882251,-3.65231026e-15 36,0 L36,0 C16.117749,3.65231026e-15 -2.4348735e-15,16.117749 0,36 L0,36 C2.4348735e-15,55.882251 16.117749,72 36,72 Z" fill="#FF0002"></path><path d="M31.044,42.269916 L31.0425,28.6877416 L44.0115,35.5022437 L31.044,42.269916 Z M59.52,26.3341627 C59.52,26.3341627 59.0505,23.003199 57.612,21.5363665 C55.7865,19.610299 53.7405,19.6012352 52.803,19.4894477 C46.086,19 36.0105,19 36.0105,19 L35.9895,19 C35.9895,19 25.914,19 19.197,19.4894477 C18.258,19.6012352 16.2135,19.610299 14.3865,21.5363665 C12.948,23.003199 12.48,26.3341627 12.48,26.3341627 C12.48,26.3341627 12,30.2467232 12,34.1577731 L12,37.8256098 C12,41.7381703 12.48,45.6492202 12.48,45.6492202 C12.48,45.6492202 12.948,48.9801839 14.3865,50.4470165 C16.2135,52.3730839 18.612,52.3126583 19.68,52.5135736 C23.52,52.8851913 36,53 36,53 C36,53 46.086,52.9848936 52.803,52.4954459 C53.7405,52.3821478 55.7865,52.3730839 57.612,50.4470165 C59.0505,48.9801839 59.52,45.6492202 59.52,45.6492202 C59.52,45.6492202 60,41.7381703 60,37.8256098 L60,34.1577731 C60,30.2467232 59.52,26.3341627 59.52,26.3341627 L59.52,26.3341627 Z" fill="#FFF"></path></g></svg>
                                </a>
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                                    <img src="https://api.iconify.design/logos/telegram.svg" className="w-7 h-7" alt="Telegram" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    className="rounded-3xl py-8 border-8 border-muted px-6 bg-[url('/images/pattern.png')] dark:bg-[url('/images/pattern-dark.png')]"
                    style={{
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    <div className="flex  justify-between sm:10 gap-4 flex-row sm:gap-0">
                        <div className="flex items-center ">
                            <img src="/images/footer-logo.svg" className="w-25 " alt="Logo" />
                            {/* <AppLogo/> */}
                        </div>
                        <div className="flex sm:flex-row items-center sm:space-x-4 gap-3">
                            <Button
                                onClick={() => router.get("/login")}
                                className="bg-accent sm:block hidden  text-primary px-4 py-2 rounded-full hover:bg-accent/80 transition-colors flex-1 text-center"
                                size={'default'}
                            >
                                Login
                            </Button>
                            <Button
                                onClick={() => router.get("/register")}
                                style={{
                                    background: 'linear-gradient(90deg, #f5e9da 0%, #f9f6f1 50%, #fdf6e3 100%)',
                                    color: '#7c6f57',
                                }}
                                size={'default'}
                                className="justify-end from-sand-200 via-sand-100 text-sand-900 hover:from-sand-300 hover:via-sand-200 rounded-2xl text-primary py-2 bg-gradient-to-r to-amber-100 shadow-lg shadow-yellow-200/25 hover:to-amber-200 hover:bg-accent/80 transition-colors flex-1 text-center"
                            >
                                GetStarted
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Large Logo at Bottom */}
                {/* <div className="mx-auto max-w-6xl px-3">
                    <div className="relative bg-background rounded-3xl">
                        <img
                            src="/images/footer-logo.svg"
                            className="w-full h-auto select-none pointer-events-none"
                            alt="BlazeMail Logo"
                            draggable={false}
                            style={{ userSelect: "none" }}
                        />
                    </div>
                </div> */}
            </div>
        </footer>
    )
}
