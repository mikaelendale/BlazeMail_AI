import { ArrowRight, Star, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const reviews = [
  {
    name: "Sarah Chen",
    role: "Product Manager",
    company: "TechFlow",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    content:
      "This platform completely transformed how we handle our product launches. The early access was incredible!",
  },
  {
    name: "Marcus Rodriguez",
    role: "Startup Founder",
    company: "InnovateLab",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    content: "Being on the waitlist was worth it. The features exceeded all my expectations. Highly recommend!",
  },
  {
    name: "Emily Watson",
    role: "Design Lead",
    company: "CreativeStudio",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    content: "The beta access gave us a competitive edge. The interface is intuitive and powerful.",
  },
  {
    name: "David Kim",
    role: "Tech Director",
    company: "FutureWorks",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    content: "Exceptional product! The early access program was well-organized and the support team was fantastic.",
  },
]

export default function Welcome() {
  return (
    <div className="min-h-screen bg-accent">
      <main className="container mx-auto px-4 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-1 min-h-[calc(100vh-200px)]">
          {/* Left Side - Waitlist Form */}
          <Card className="p-8 lg:p-12 bg-white space-y-8 order-2 lg:order-1">
            <div className="space-y-6">
              <div className="space-y-4">
                <Badge className="w-fit bg-primary/10 text-primary hover:bg-primary/20">Coming Soon</Badge>
                <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                  The Future of
                  <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {" "}Productivity
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  Join thousands of innovators who are already transforming their workflow. Be the first to experience the next generation of productivity tools.
                </p>
              </div>
            </div>
            <Card className="bg-card shadow-none border-none">
              <CardContent className="px-3 pl-0">
                <form className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Join the Waitlist</h3>
                    <p className="text-sm text-muted-foreground">
                      Get early access and exclusive updates about our launch.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input type="email" placeholder="Enter your email address" className="flex-1 h-12" required />
                    <Button size="lg" className="h-12 px-6">
                      Join Waitlist
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    By joining, you agree to receive updates about our product launch. Unsubscribe anytime.
                  </p>
                </form>
              </CardContent>
            </Card>
            <div className="flex items-center justify-center lg:justify-start space-x-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">2,847+</div>
                <div className="text-sm text-muted-foreground">People waiting</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Companies interested</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">4.9★</div>
                <div className="text-sm text-muted-foreground">Beta rating</div>
              </div>
            </div>
          </Card>
          {/* Right Side - Customer Reviews */}
          <Card className="p-8 lg:p-12 bg-white space-y-6 order-1 lg:order-2">
            <div className="text-center lg:text-left space-y-2">
              <h2 className="text-2xl lg:text-3xl font-bold">Loved by Early Users</h2>
              <p className="text-muted-foreground">See what our beta users are saying about their experience.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 h-fit">
              {/* Large review card */}
              <Card className="col-span-2 bg-card">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(reviews[0].rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed">"{reviews[0].content}"</p>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={reviews[0].avatar || "/placeholder.svg"} alt={reviews[0].name} />
                        <AvatarFallback>
                          {reviews[0].name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{reviews[0].name}</div>
                        <div className="text-xs text-muted-foreground">
                          {reviews[0].role} at {reviews[0].company}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Two smaller cards */}
              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-1">
                      {[...Array(reviews[1].rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-xs leading-relaxed">"{reviews[1].content}"</p>
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={reviews[1].avatar || "/placeholder.svg"} alt={reviews[1].name} />
                        <AvatarFallback className="text-xs">
                          {reviews[1].name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-xs">{reviews[1].name}</div>
                        <div className="text-xs text-muted-foreground">{reviews[1].role}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-1">
                      {[...Array(reviews[2].rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-xs leading-relaxed">"{reviews[2].content}"</p>
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={reviews[2].avatar || "/placeholder.svg"} alt={reviews[2].name} />
                        <AvatarFallback className="text-xs">
                          {reviews[2].name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-xs">{reviews[2].name}</div>
                        <div className="text-xs text-muted-foreground">{reviews[2].role}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Wide card */}
              <Card className="col-span-2 bg-card">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-1">
                      {[...Array(reviews[3].rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed">"{reviews[3].content}"</p>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={reviews[3].avatar || "/placeholder.svg"} alt={reviews[3].name} />
                        <AvatarFallback>
                          {reviews[3].name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{reviews[3].name}</div>
                        <div className="text-xs text-muted-foreground">
                          {reviews[3].role} at {reviews[3].company}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Card>
        </div>
      </main>
      <footer className="border-t bg-accent">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-medium">NextGen</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 NextGen. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}