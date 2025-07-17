import { Card, CardContent } from "@/components/ui/card"
import { Mail, TrendingUp, Reply, Send } from "lucide-react"

interface User {
  name: string
  email: string
}

interface Stats {
  totalEmails: number
  openRate: number
  replyRate: number
  sentToday: number
}

interface WelcomeHeaderProps {
  user: User
  stats: Stats
}

export function WelcomeHeader({ user, stats }: WelcomeHeaderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {user.name}</h1>
        <p className="text-muted-foreground mt-1">Here's your email campaign overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Emails</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalEmails.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Open Rate</p>
                <p className="text-2xl font-bold text-foreground">{stats.openRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Reply className="h-4 w-4 text-blue-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Reply Rate</p>
                <p className="text-2xl font-bold text-foreground">{stats.replyRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Send className="h-4 w-4 text-orange-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Sent Today</p>
                <p className="text-2xl font-bold text-foreground">{stats.sentToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
