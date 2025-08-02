// import { Badge } from "@/components/ui/badge"
// import { MessageSquare, X } from "lucide-react"

// export default function Testimonial() {
//   const testimonials = [
//     {
//       id: 1,
//       name: "Hikmet Atçeken",
//       handle: "@hiatceken",
//       // avatar: "/placeholder.svg?height=40&width=40&text=HA",
//       text: "Pulsefy's our daily tool to bypass averages and reveal true insights, for the whole team!",
//       size: "large",
//     },
//     {
//       id: 2,
//       name: "Arda Guler",
//       handle: "@ardaguler_",
//       // avatar: "/placeholder.svg?height=40&width=40&text=AG",
//       text: "Pulsefy levels the analytics field for our team, enabling both beginners and pros to easily bypass average data and uncover the actionable insights that truly shape our marketing strategies.",
//       size: "large",
//     },
//     {
//       id: 3,
//       name: "Maria Ancelotti",
//       handle: "@maria_ancelotti",
//       // avatar: "/placeholder.svg?height=40&width=40&text=MA",
//       text: "From novice to pro, Pulsefy helps our team uncover the extraordinary in our marketing data! From novice to pro, Pulsefy helps our team uncover the extraordinary in our marketing data!",
//       size: "medium",
//     },
//     {
//       id: 4,
//       name: "Ragip Diler",
//       handle: "@rgdiler",
//       // avatar: "/placeholder.svg?height=40&width=40&text=RD",
//       text: "Pulsefy empowers our whole team, techies or not, to dive into marketing analytics and spot the insights that really matter—no more average data!",
//       size: "large",
//     },
//     {
//       id: 5,
//       name: "Jenny Wilson",
//       handle: "@wilson_jenny_19",
//       // avatar: "/placeholder.svg?height=40&width=40&text=JW",
//       text: "Pulsefy's user-friendly analytics let our whole team, regardless of skill, bypass averages to unearth and act on true, game-changing marketing insights every day.",
//       size: "large",
//     },
//     {
//       id: 6,
//       name: "Guy Hawkins",
//       handle: "@ghawkins",
//       // avatar: "/placeholder.svg?height=40&width=40&text=GH",
//       text: "Pulsefy is a game-changer for our team—easy for beginners and powerful for digging beyond average data. It's our daily ally in unearthing those pivotal marketing insights that really drive strategy!",
//       size: "large",
//     },
//   ]

//   return (
//     <div className="py-16 px-4">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="text-center mb-16">
//           <div className="flex items-center justify-center gap-2 mb-4">
//             <Badge className="bg-accent text-muted-foreground font-medium">Testimonials</Badge>
//           </div>
//           <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Public Cheers for Us!</h1>
//           <p className="text-muted-foreground text-lg">Find out how our users are spreading the word!</p>
//         </div>

//         {/* Testimonials Grid */}
//         <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
//           {testimonials.map((testimonial) => (
//             <div
//               key={testimonial.id}
//               className="bg-gradient-to-b from-accent via-accent to-orange-200/50 rounded-2xl p-6 shadow-sm border-2 border-primary-foreground break-inside-avoid"
//             >
//               {/* Header with Avatar and X Logo */}
//               <div className="flex items-start justify-between mb-4">
//                 <div className="flex items-center gap-3">
//                   <img
//                     src={testimonial.avatar || "/images/b.svg"}
//                     alt={testimonial.name}
//                     className="w-10 h-10 rounded-full object-cover"
//                   />
//                   <div>
//                     <h3 className="font-semibold text-primary text-sm">{testimonial.name}</h3>
//                     <p className="text-muted-foreground text-sm">{testimonial.handle}</p>
//                   </div>
//                 </div>
//                 <svg className="h-6 w-6 text-black dark:text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><g fill="none"><g clip-path="url(#primeTwitter0)"><path fill="currentColor" d="M11.025.656h2.147L8.482 6.03L14 13.344H9.68L6.294 8.909l-3.87 4.435H.275l5.016-5.75L0 .657h4.43L7.486 4.71zm-.755 11.4h1.19L3.78 1.877H2.504z" /></g><defs><clipPath id="primeTwitter0"><path fill="#fff" d="M0 0h14v14H0z" /></clipPath></defs></g></svg>
//               </div>

//               {/* Testimonial Text */}
//               <p className="text-muted-foreground leading-relaxed text-md">{testimonial.text}</p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   )
// }


export default function TestimonialCard() {
  return (
    <>
      <div className="flex items-center justify-center  p-8">
        <div className="w-full max-w-3xl text-center">
          <h1 className="text-3xl sm:text-5xl font-bold text-primary mb-2">What People Are Saying</h1>
          <p className="text-muted-foreground text-md sm:text-lg">Real testimonials from early users and the founder.</p>
        </div>
      </div>

      <div
        className="flex items-center justify-center p-4" >
        <div className="w-full max-w-5xl rounded-4xl p-12 mx-auto border border-background bg-gradient-to-br from-background via-accent to-background">
          {/* Testimonial text */}
          <div className="text-center mb-5 ">
            <p className="text-xl lg:text-2xl font-medium leading-tight text-primary">
              <span className="text-muted-foreground">
                “Invested in BlazeMail because it <span className="text-foreground font-semibold">delivers results fast</span> — not just another SaaS. <span className="text-foreground font-semibold">Performance, personalization, and speed</span> are built-in. In a market full of generic tools, <span className="text-foreground font-semibold">BlazeMail stands out and converts</span>. The founder <span className="text-foreground font-semibold">executes with urgency</span>. That’s rare.”
              </span>
            </p>
          </div>
          {/* Profile section */}
          <div className="flex flex-row justify-center items-center">
            <div className="w-16 h-16 rounded-full overflow-hidden">
              <img src="sami.png" alt="Sami B. Hailemariam" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col pl-4 ">
              <h3 className="text-xl font-semibold text-primary mb-1">Sami B. Hailemariam</h3>
              <p className="text-muted-foreground text-xs">Investor @ BlazeMail | SS-Softwares</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center p-4  mb-10">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Testimonial 1 */}
          <div className="rounded-3xl p-12 bg-gradient-to-br from-background via-accent to-background flex flex-col justify-between h-full">
            {/* Testimonial text */}
            <div className="text-center mb-5">
              <p className="text-xl lg:text-2xl leading-tight">
                <span className="text-muted-foreground">“I got early access to BlazeMail and tried the demo — </span>
                <span className="text-foreground font-semibold">it literally wrote 10 solid cold emails in under 15 seconds.</span>
                <span className="text-muted-foreground"> The speed and personalization blew me away. Can’t wait for the full launch.”</span>
              </p>
            </div>
            {/* Profile section */}
            <div className="flex flex-row justify-center items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                <img src="/fuad.png" alt="Fuad Tesfaye" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col pl-4">
                <h3 className="text-xl font-semibold text-primary mb-1">Fuad T. Mamo</h3>
                <p className="text-muted-foreground text-xs">CEO @ Dawn Nexus</p>
              </div>
            </div>
          </div>
          {/* Testimonial 2 */}
          <div className="rounded-3xl p-12 border border-background bg-gradient-to-br from-background via-accent to-background flex flex-col justify-between h-full">
            {/* Testimonial text */}
            <div className="text-center mb-5">
              <p className="text-xl lg:text-2xl font-medium leading-tight text-primary">
                <span className="text-muted-foreground">“I built BlazeMail because<span className="text-foreground font-semibold"> I was tired of cold emails that sounded like robots.</span> I dogfooded the tool myself, sent 21 emails in under half a minute, all personalized, all human sounding.</span> <span className="text-foreground font-semibold">If it didn’t work, I wouldn’t be pushing it.</span><span className="text-muted-foreground"> This thing’s built for hustlers.”</span>
              </p>
            </div>
            {/* Profile section */}
            <div className="flex flex-row justify-center items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                <img src="Mike.png" alt="Mikael Endale" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col pl-4">
                <h3 className="text-xl font-semibold text-primary mb-1">Mikael E. Gebreyes</h3>
                <p className="text-muted-foreground text-xs">Founder @ BlazeMail</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
