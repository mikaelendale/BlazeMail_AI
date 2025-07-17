"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    AlertCircle,
    CheckCircle,
    Loader2,
    Pencil,
    Trash2,
    KeyRound,
    Ban,
    Phone,
    MapPin,
    Calendar,
    Clock,
    CreditCard,
    Shield,
    Activity,
    Save,
    X,
    ArrowLeft,
    UserCheck,
    DollarSign,
} from "lucide-react"
import AdminAppLayout from "@/layouts/admin-app-layout"

// TypeScript interfaces based on your Laravel model
interface UserDetails {
    id: number
    name: string
    email: string
    phone?: string
    location?: string
    bio?: string
    avatar_url?: string
    account_status: "active" | "inactive" | "suspended"
    email_verified_at?: string
    created_at: string
    last_login_at?: string
    credit_balance: number
    referral_credits: number
    subscription_status?: string
    user_plan?: string
    amount?: string
    fraud_score?: number
    onboarding_status?: boolean
    last_credit_activity?: string
    last_monthly_refill_at?: string
}

interface RecentAction {
    id: string
    description: string
    created_at: string
    subject_type?: string
    properties?: any
}

interface UserDetailsPageProps {
    user: UserDetails
    recent_actions: RecentAction[]
}

export default function UserDetailsPage({ user: initialUser, recent_actions }: UserDetailsPageProps) {
    const [user, setUser] = useState<UserDetails>(initialUser)
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [editForm, setEditForm] = useState({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
        account_status: user.account_status,
        credit_balance: user.credit_balance,
    })

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "active":
                return "default"
            case "inactive":
                return "secondary"
            case "suspended":
                return "destructive"
            default:
                return "outline"
        }
    }

    const getActionStatusIcon = (description: string) => {
        if (description.toLowerCase().includes("success") || description.toLowerCase().includes("login")) {
            return <CheckCircle className="h-4 w-4 text-green-500" />
        } else if (description.toLowerCase().includes("failed") || description.toLowerCase().includes("error")) {
            return <AlertCircle className="h-4 w-4 text-red-500" />
        } else {
            return <Activity className="h-4 w-4 text-blue-500" />
        }
    }

    const handleSaveUser = async () => {
        setIsLoading(true)
        try {
            // Simulate API call - replace with actual API call
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Update user state with form data
            setUser((prev) => ({
                ...prev,
                ...editForm,
            }))

            setIsEditing(false)
            // You would make an actual API call here:
            // const response = await fetch(`/api/users/${user.id}`, {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(editForm)
            // })
        } catch (error) {
            console.error("Error updating user:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteUser = async () => {
        setIsLoading(true)
        try {
            // Simulate API call - replace with actual API call
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Redirect to users list after deletion
            // window.location.href = '/admin/users'
            console.log("User deleted successfully")
        } catch (error) {
            console.error("Error deleting user:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetPassword = async () => {
        setIsLoading(true)
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))
            console.log("Password reset email sent")
        } catch (error) {
            console.error("Error sending password reset:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleStatus = async () => {
        const newStatus = user.account_status === "active" ? "inactive" : "active"
        setIsLoading(true)
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))
            setUser((prev) => ({ ...prev, account_status: newStatus }))
        } catch (error) {
            console.error("Error updating user status:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AdminAppLayout>
            <div className="min-h-screen ">
                {/* Header */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Users
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isEditing && (
                                <Button onClick={() => setIsEditing(true)} variant="outline">
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit User
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="space-y-8">
                        {/* Profile Header */}
                        <Card className="overflow-hidden">
                            <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-32"></div>
                            <CardContent className="relative px-8 pb-8">
                                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16">
                                    <Avatar className="h-32 w-32   shadow-lg">
                                        <AvatarFallback className="text-3xl bg-accent">
                                            {user.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div>
                                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                                                <p className="text-lg text-gray-600 dark:text-gray-400">{user.email}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant={getStatusBadgeVariant(user.account_status)} className="text-sm px-3 py-1">
                                                    {user.account_status}
                                                </Badge>
                                                {user.email_verified_at && (
                                                    <Badge variant="default" className="text-sm px-3 py-1">
                                                        <UserCheck className="h-3 w-3 mr-1" />
                                                        Verified
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                                            {user.phone && (
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                    <Phone className="h-4 w-4" />
                                                    {user.phone}
                                                </div>
                                            )}
                                            {user.location && (
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                    <MapPin className="h-4 w-4" />
                                                    {user.location}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <Calendar className="h-4 w-4" />
                                                Joined {new Date(user.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Main Content Tabs */}
                        <Tabs defaultValue="overview" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="profile">Profile</TabsTrigger>
                                <TabsTrigger value="activity">Activity</TabsTrigger>
                                <TabsTrigger value="admin">Admin</TabsTrigger>
                            </TabsList>

                            {/* Overview Tab */}
                            <TabsContent value="overview" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <CreditCard className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Credit Balance</p>
                                                    <p className="text-2xl font-bold">{user.credit_balance}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <DollarSign className="h-6 w-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Referral Credits</p>
                                                    <p className="text-2xl font-bold">{user.referral_credits}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-100 rounded-lg">
                                                    <Shield className="h-6 w-6 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Plan</p>
                                                    <p className="text-lg font-bold capitalize">{user.user_plan || "Free"}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-orange-100 rounded-lg">
                                                    <Clock className="h-6 w-6 text-orange-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Login</p>
                                                    <p className="text-sm font-medium">
                                                        {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Never"}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {user.bio && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>About</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{user.bio}</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* Profile Tab */}
                            <TabsContent value="profile" className="space-y-6">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>Personal Information</CardTitle>
                                            <CardDescription>User's detailed profile information</CardDescription>
                                        </div>
                                        {isEditing && (
                                            <div className="flex gap-2">
                                                <Button onClick={handleSaveUser} disabled={isLoading}>
                                                    {isLoading ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    ) : (
                                                        <Save className="h-4 w-4 mr-2" />
                                                    )}
                                                    Save Changes
                                                </Button>
                                                <Button variant="outline" onClick={() => setIsEditing(false)}>
                                                    <X className="h-4 w-4 mr-2" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Full Name</Label>
                                                {isEditing ? (
                                                    <Input
                                                        id="name"
                                                        value={editForm.name}
                                                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                                                    />
                                                ) : (
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{user.name}</div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email Address</Label>
                                                {isEditing ? (
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={editForm.email}
                                                        onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                                                    />
                                                ) : (
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{user.email}</div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone Number</Label>
                                                {isEditing ? (
                                                    <Input
                                                        id="phone"
                                                        value={editForm.phone}
                                                        onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                                                    />
                                                ) : (
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{user.phone || "Not provided"}</div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="location">Location</Label>
                                                {isEditing ? (
                                                    <Input
                                                        id="location"
                                                        value={editForm.location}
                                                        onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                                                    />
                                                ) : (
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                                        {user.location || "Not provided"}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="account_status">Account Status</Label>
                                                {isEditing ? (
                                                    <Select
                                                        value={editForm.account_status}
                                                        onValueChange={(value) => setEditForm((prev) => ({ ...prev, account_status: value as any }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">Active</SelectItem>
                                                            <SelectItem value="inactive">Inactive</SelectItem>
                                                            <SelectItem value="suspended">Suspended</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md capitalize">
                                                        {user.account_status}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="credit_balance">Credit Balance</Label>
                                                {isEditing ? (
                                                    <Input
                                                        id="credit_balance"
                                                        type="number"
                                                        value={editForm.credit_balance}
                                                        onChange={(e) =>
                                                            setEditForm((prev) => ({ ...prev, credit_balance: Number.parseInt(e.target.value) || 0 }))
                                                        }
                                                    />
                                                ) : (
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{user.credit_balance}</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="bio">Biography</Label>
                                            {isEditing ? (
                                                <Textarea
                                                    id="bio"
                                                    value={editForm.bio}
                                                    onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                                                    rows={4}
                                                />
                                            ) : (
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md min-h-[100px]">
                                                    {user.bio || "No biography provided"}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Activity Tab */}
                            <TabsContent value="activity" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Recent Activity</CardTitle>
                                        <CardDescription>Latest actions and system events for this user</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="min-w-[200px]">Action</TableHead>
                                                        <TableHead className="min-w-[150px]">Date & Time</TableHead>
                                                        <TableHead className="min-w-[100px]">Type</TableHead>
                                                        <TableHead>Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {recent_actions.length > 0 ? (
                                                        recent_actions.map((action) => (
                                                            <TableRow key={action.id}>
                                                                <TableCell className="font-medium">{action.description}</TableCell>
                                                                <TableCell className="text-sm text-gray-600">
                                                                    {new Date(action.created_at).toLocaleString()}
                                                                </TableCell>
                                                                <TableCell className="text-sm">
                                                                    {action.subject_type?.split("\\").pop() || "System"}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">{getActionStatusIcon(action.description)}</div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                                                No recent activity found
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Admin Tab */}
                            <TabsContent value="admin" className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Admin Actions</CardTitle>
                                            <CardDescription>Manage this user's account and permissions</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="space-y-1">
                                                    <h3 className="font-medium">Reset Password</h3>
                                                    <p className="text-sm text-gray-600">Send password reset email to user</p>
                                                </div>
                                                <Button variant="outline" onClick={handleResetPassword} disabled={isLoading}>
                                                    {isLoading ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    ) : (
                                                        <KeyRound className="h-4 w-4 mr-2" />
                                                    )}
                                                    Reset
                                                </Button>
                                            </div>

                                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="space-y-1">
                                                    <h3 className="font-medium">Account Status</h3>
                                                    <p className="text-sm text-gray-600">
                                                        {user.account_status === "active" ? "Deactivate user account" : "Activate user account"}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant={user.account_status === "active" ? "destructive" : "default"}
                                                    onClick={handleToggleStatus}
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    ) : (
                                                        <Ban className="h-4 w-4 mr-2" />
                                                    )}
                                                    {user.account_status === "active" ? "Deactivate" : "Activate"}
                                                </Button>
                                            </div>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 rounded-lg">
                                                        <div className="space-y-1">
                                                            <h3 className="font-medium text-red-900 dark:text-red-100">Delete User</h3>
                                                            <p className="text-sm text-red-700 dark:text-red-300">
                                                                Permanently remove user and all data
                                                            </p>
                                                        </div>
                                                        <Button variant="destructive">
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the user account and remove all
                                                            associated data from our servers.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
                                                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                            Delete User
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>User Statistics</CardTitle>
                                            <CardDescription>Key metrics and information</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-sm font-medium">User ID</span>
                                                <Badge variant="outline">{user.id}</Badge>
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-sm font-medium">Email Verified</span>
                                                <Badge variant={user.email_verified_at ? "default" : "destructive"}>
                                                    {user.email_verified_at ? "Yes" : "No"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-sm font-medium">Subscription Status</span>
                                                <Badge variant="outline">{user.subscription_status || "None"}</Badge>
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-sm font-medium">Onboarding Complete</span>
                                                <Badge variant={user.onboarding_status ? "default" : "secondary"}>
                                                    {user.onboarding_status ? "Yes" : "No"}
                                                </Badge>
                                            </div>
                                            {user.fraud_score !== undefined && (
                                                <div className="flex items-center justify-between py-2">
                                                    <span className="text-sm font-medium">Fraud Score</span>
                                                    <Badge variant={user.fraud_score > 50 ? "destructive" : "default"}>{user.fraud_score}</Badge>
                                                </div>
                                            )}
                                            {user.last_credit_activity && (
                                                <div className="flex items-center justify-between py-2">
                                                    <span className="text-sm font-medium">Last Credit Activity</span>
                                                    <span className="text-sm text-gray-600">
                                                        {new Date(user.last_credit_activity).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div></AdminAppLayout>
    )
}
