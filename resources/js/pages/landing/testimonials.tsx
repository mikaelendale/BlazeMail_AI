import { Badge } from "@/components/ui/badge"
import { MessageSquare, X } from "lucide-react"

export default function Testimonial() {
  const testimonials = [
    {
      id: 1,
      name: "Hikmet Atçeken",
      handle: "@hiatceken",
      // avatar: "/placeholder.svg?height=40&width=40&text=HA",
      text: "Pulsefy's our daily tool to bypass averages and reveal true insights, for the whole team!",
      size: "large",
    },
    {
      id: 2,
      name: "Arda Guler",
      handle: "@ardaguler_",
      // avatar: "/placeholder.svg?height=40&width=40&text=AG",
      text: "Pulsefy levels the analytics field for our team, enabling both beginners and pros to easily bypass average data and uncover the actionable insights that truly shape our marketing strategies.",
      size: "large",
    },
    {
      id: 3,
      name: "Maria Ancelotti",
      handle: "@maria_ancelotti",
      // avatar: "/placeholder.svg?height=40&width=40&text=MA",
      text: "From novice to pro, Pulsefy helps our team uncover the extraordinary in our marketing data! From novice to pro, Pulsefy helps our team uncover the extraordinary in our marketing data!",
      size: "medium",
    },
    {
      id: 4,
      name: "Ragip Diler",
      handle: "@rgdiler",
      // avatar: "/placeholder.svg?height=40&width=40&text=RD",
      text: "Pulsefy empowers our whole team, techies or not, to dive into marketing analytics and spot the insights that really matter—no more average data!",
      size: "large",
    },
    {
      id: 5,
      name: "Jenny Wilson",
      handle: "@wilson_jenny_19",
      // avatar: "/placeholder.svg?height=40&width=40&text=JW",
      text: "Pulsefy's user-friendly analytics let our whole team, regardless of skill, bypass averages to unearth and act on true, game-changing marketing insights every day.",
      size: "large",
    },
    {
      id: 6,
      name: "Guy Hawkins",
      handle: "@ghawkins",
      // avatar: "/placeholder.svg?height=40&width=40&text=GH",
      text: "Pulsefy is a game-changer for our team—easy for beginners and powerful for digging beyond average data. It's our daily ally in unearthing those pivotal marketing insights that really drive strategy!",
      size: "large",
    },
  ]

  return (
    <div className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge className="bg-accent text-muted-foreground font-medium">Testimonials</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Public Cheers for Us!</h1>
          <p className="text-muted-foreground text-lg">Find out how our users are spreading the word!</p>
        </div>

        {/* Testimonials Grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-gradient-to-b from-accent via-accent to-orange-200/50 rounded-2xl p-6 shadow-sm border-2 border-primary-foreground break-inside-avoid"
            >
              {/* Header with Avatar and X Logo */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatar || "/images/b.svg"}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-primary text-sm">{testimonial.name}</h3>
                    <p className="text-muted-foreground text-sm">{testimonial.handle}</p>
                  </div>
                </div>
                <svg className="h-6 w-6 text-black dark:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><g fill="none"><g clip-path="url(#primeTwitter0)"><path fill="currentColor" d="M11.025.656h2.147L8.482 6.03L14 13.344H9.68L6.294 8.909l-3.87 4.435H.275l5.016-5.75L0 .657h4.43L7.486 4.71zm-.755 11.4h1.19L3.78 1.877H2.504z" /></g><defs><clipPath id="primeTwitter0"><path fill="#fff" d="M0 0h14v14H0z" /></clipPath></defs></g></svg>
              </div>

              {/* Testimonial Text */}
              <p className="text-muted-foreground leading-relaxed text-md">{testimonial.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
