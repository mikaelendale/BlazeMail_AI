"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AppLayout from "@/layouts/app-layout"
import {
  ArrowLeft,
  Mail,
  Users,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Calendar,
  Download,
  Share2,
  CheckCircle,
  Award,
  Target,
  BarChart3,
  Star,
  Trophy,
} from "lucide-react"
import { useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

// Mock data for completed campaign
const completedCampaignData = {
  id: 1,
  name: "Holiday Special Offers",
  status: "completed",
  startDate: "2023-12-01",
  endDate: "2023-12-31",
  completedDate: "2023-12-31T23:59:59Z",
  assignedAccount: {
    name: "Emily Rodriguez",
    email: "emily.rodriguez@company.com",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Campaign Manager",
  },
  emailAccount: "campaigns@company.com",
  totalEmails: 6,
  emailsSent: 6,
  totalSubscribers: 3200,
  finalSubscribers: 3050,
  totalOpens: 2307,
  totalClicks: 598,
  openRate: 72.1,
  clickRate: 18.7,
  unsubscribeRate: 4.7,
  bounceRate: 2.3,
  conversionRate: 8.2,
  revenue: 45600,
  roi: 456,
}

// Final performance data
const finalPerformanceData = [
  { date: "2023-12-01", opens: 520, clicks: 89, conversions: 12, revenue: 2400 },
  { date: "2023-12-05", opens: 480, clicks: 95, conversions: 18, revenue: 3600 },
  { date: "2023-12-10", opens: 445, clicks: 78, conversions: 15, revenue: 3000 },
  { date: "2023-12-15", opens: 398, clicks: 102, conversions: 22, revenue: 4400 },
  { date: "2023-12-20", opens: 289, clicks: 134, conversions: 28, revenue: 5600 },
  { date: "2023-12-25", opens: 175, clicks: 100, conversions: 35, revenue: 7000 },
]

const finalEngagementData = [
  { name: "Opened & Clicked", value: 18.7, color: "#10b981" },
  { name: "Opened Only", value: 53.4, color: "#3b82f6" },
  { name: "Unsubscribed", value: 4.7, color: "#f59e0b" },
  { name: "Bounced", value: 2.3, color: "#ef4444" },
  { name: "No Action", value: 20.9, color: "#6b7280" },
]

const deviceData = [
  { device: "Mobile", opens: 1385, clicks: 359, percentage: 60 },
  { device: "Desktop", opens: 692, clicks: 179, percentage: 30 },
  { device: "Tablet", value: 230, clicks: 60, percentage: 10 },
]

const topPerformingEmails = [
  { subject: "🎄 Exclusive Holiday Sale - 50% Off Everything!", opens: 2890, clicks: 487, ctr: 16.8, revenue: 12400 },
  { subject: "Last Chance: Holiday Deals End Tonight!", opens: 2650, clicks: 398, ctr: 15.0, revenue: 8900 },
  { subject: "Your Holiday Gift Guide is Here 🎁", opens: 2420, clicks: 312, ctr: 12.9, revenue: 6700 },
  { subject: "Black Friday Preview - Early Access", opens: 2180, clicks: 289, ctr: 13.3, revenue: 5800 },
]

const benchmarkData = [
  { metric: "Open Rate", yourCampaign: 72.1, industryAvg: 45.2, difference: 26.9 },
  { metric: "Click Rate", yourCampaign: 18.7, industryAvg: 12.3, difference: 6.4 },
  { metric: "Conversion Rate", yourCampaign: 8.2, industryAvg: 4.1, difference: 4.1 },
  { metric: "Unsubscribe Rate", yourCampaign: 4.7, industryAvg: 2.8, difference: -1.9 },
]

const radarData = [
  { subject: "Deliverability", A: 95, B: 85, fullMark: 100 },
  { subject: "Engagement", A: 88, B: 70, fullMark: 100 },
  { subject: "Conversion", A: 82, B: 65, fullMark: 100 },
  { subject: "Retention", A: 78, B: 75, fullMark: 100 },
  { subject: "Growth", A: 85, B: 60, fullMark: 100 },
]

export default function CompletedCampaignDetail() {
  const [selectedTab, setSelectedTab] = useState("overview")

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" className="rounded-2xl">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-primary lg:text-4xl">{completedCampaignData.name}</h1>
                  <Badge className="bg-primary text-primary-foreground">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                  <Badge className="bg-accent text-accent-foreground">
                    <Trophy className="h-3 w-3 mr-1" />
                    High Performer
                  </Badge>
                </div>
                <p className="text-lg text-secondary">
                  Campaign completed on {formatDate(completedCampaignData.completedDate)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="rounded-2xl bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button variant="outline" className="rounded-2xl bg-transparent">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Results
                </Button>
              </div>
            </div>
          </div>

          {/* Success Metrics */}
          <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="rounded-3xl border border-accent bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(completedCampaignData.revenue)}</p>
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">ROI: {completedCampaignData.roi}%</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-green-100 p-3 dark:bg-green-900/30">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-accent bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Open Rate</p>
                    <p className="text-2xl font-bold text-primary">{completedCampaignData.openRate}%</p>
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">+26.9% vs industry</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-3">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-accent bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Click Rate</p>
                    <p className="text-2xl font-bold text-primary">{completedCampaignData.clickRate}%</p>
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">+6.4% vs industry</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-secondary/10 p-3">
                    <MousePointer className="h-6 w-6 text-secondary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-accent bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-bold text-primary">{completedCampaignData.conversionRate}%</p>
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">+4.1% vs industry</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-accent/10 p-3">
                    <Target className="h-6 w-6 text-accent-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-accent bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Final Subscribers</p>
                    <p className="text-2xl font-bold text-primary">
                      {completedCampaignData.finalSubscribers.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingDown className="h-3 w-3 text-orange-500" />
                      <span className="text-orange-500">
                        -{completedCampaignData.totalSubscribers - completedCampaignData.finalSubscribers} lost
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-muted/10 p-3">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Detailed Analytics */}
              <Card className="rounded-3xl border border-accent bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Campaign Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 rounded-2xl">
                      <TabsTrigger value="overview" className="rounded-xl">
                        Overview
                      </TabsTrigger>
                      <TabsTrigger value="performance" className="rounded-xl">
                        Performance
                      </TabsTrigger>
                      <TabsTrigger value="engagement" className="rounded-xl">
                        Engagement
                      </TabsTrigger>
                      <TabsTrigger value="benchmark" className="rounded-xl">
                        Benchmark
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6">
                      <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={finalPerformanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) =>
                              new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                            }
                            stroke="#666"
                          />
                          <YAxis stroke="#666" />
                          <Tooltip
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "12px",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stackId="1"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.8}
                          />
                          <Area
                            type="monotone"
                            dataKey="conversions"
                            stackId="2"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </TabsContent>

                    <TabsContent value="performance" className="mt-6">
                      <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={finalPerformanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) =>
                              new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                            }
                            stroke="#666"
                          />
                          <YAxis stroke="#666" />
                          <Tooltip
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "12px",
                            }}
                          />
                          <Line type="monotone" dataKey="opens" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} />
                          <Line type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} />
                          <Line type="monotone" dataKey="conversions" stroke="#f59e0b" strokeWidth={3} dot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </TabsContent>

                    <TabsContent value="engagement" className="mt-6">
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div>
                          <h4 className="font-semibold mb-4">Engagement Breakdown</h4>
                          <ResponsiveContainer width="100%" height={250}>
                            <RechartsPieChart>
                              <Pie
                                data={finalEngagementData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {finalEngagementData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => [`${value}%`, "Percentage"]}
                                contentStyle={{
                                  backgroundColor: "white",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "12px",
                                }}
                              />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-4">Device Breakdown</h4>
                          <div className="space-y-4">
                            {deviceData.map((device, index) => (
                              <div key={index} className="rounded-2xl border border-accent bg-muted/30 p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{device.device}</span>
                                  <span className="text-sm text-muted-foreground">{device.percentage}%</span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span>Opens: {device.opens}</span>
                                    <span>Clicks: {device.clicks}</span>
                                  </div>
                                  <div className="h-2 rounded-full bg-muted">
                                    <div
                                      className="h-2 rounded-full bg-primary"
                                      style={{ width: `${device.percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="benchmark" className="mt-6">
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div>
                          <h4 className="font-semibold mb-4">Industry Comparison</h4>
                          <div className="space-y-4">
                            {benchmarkData.map((item, index) => (
                              <div key={index} className="rounded-2xl border border-accent bg-muted/30 p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{item.metric}</span>
                                  <div className="flex items-center gap-2">
                                    {item.difference > 0 ? (
                                      <TrendingUp className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <TrendingDown className="h-4 w-4 text-red-500" />
                                    )}
                                    <span
                                      className={`text-sm font-medium ${
                                        item.difference > 0 ? "text-green-500" : "text-red-500"
                                      }`}
                                    >
                                      {item.difference > 0 ? "+" : ""}
                                      {item.difference}%
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Your Campaign</span>
                                    <p className="font-semibold text-primary">{item.yourCampaign}%</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Industry Avg</span>
                                    <p className="font-semibold">{item.industryAvg}%</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-4">Performance Radar</h4>
                          <ResponsiveContainer width="100%" height={250}>
                            <RadarChart data={radarData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="subject" />
                              <PolarRadiusAxis angle={90} domain={[0, 100]} />
                              <Radar
                                name="Your Campaign"
                                dataKey="A"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.3}
                              />
                              <Radar
                                name="Industry Average"
                                dataKey="B"
                                stroke="#6b7280"
                                fill="#6b7280"
                                fillOpacity={0.1}
                              />
                              <Tooltip />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Top Performing Emails */}
              <Card className="rounded-3xl border border-accent bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Top Performing Emails
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformingEmails.map((email, index) => (
                      <div key={index} className="rounded-2xl border border-accent bg-muted/30 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg font-bold text-primary">#{index + 1}</span>
                              <h4 className="font-semibold text-primary">{email.subject}</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                              <div>
                                <span className="text-muted-foreground">Opens</span>
                                <p className="font-semibold">{email.opens.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Clicks</span>
                                <p className="font-semibold">{email.clicks.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">CTR</span>
                                <p className="font-semibold">{email.ctr}%</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Revenue</span>
                                <p className="font-semibold text-green-600">{formatCurrency(email.revenue)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Campaign Summary */}
              <Card className="rounded-3xl border border-accent bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Campaign Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={completedCampaignData.assignedAccount.avatar || "/placeholder.svg"}
                        alt={completedCampaignData.assignedAccount.name}
                      />
                      <AvatarFallback>{getInitials(completedCampaignData.assignedAccount.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-primary">{completedCampaignData.assignedAccount.name}</p>
                      <p className="text-xs text-muted-foreground">{completedCampaignData.assignedAccount.role}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">From:</span>
                      <span className="font-medium">{completedCampaignData.emailAccount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">31 days</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium text-green-600">Successfully Completed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Achievements */}
              <Card className="rounded-3xl border border-accent bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Key Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-yellow-600" />
                    <span>Top 5% performer in industry</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>456% ROI achieved</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span>Exceeded conversion goals by 120%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="h-4 w-4 text-purple-500" />
                    <span>72.1% open rate (industry: 45.2%)</span>
                  </div>
                </CardContent>
              </Card>

              {/* Export Options */}
              <Card className="rounded-3xl border border-accent bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Export & Share</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start rounded-2xl bg-transparent">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-2xl bg-transparent">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Export Analytics Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-2xl bg-transparent">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Success Story
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
