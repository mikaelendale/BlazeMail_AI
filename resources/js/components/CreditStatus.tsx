import { usePage } from "@inertiajs/react"
import { AlertTriangle, CoinsIcon, Zap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SharedData } from "@/types"
 

interface Props {
    showDetails?: boolean
    showActions?: boolean
    className?: string
}

export default function CreditStatus({ showDetails = false, showActions = true, className = "" }: Props) {
    const { props: { credits } } = usePage<SharedData>()

    if (!credits) return null

    const getStatusColor = () => {
        if (credits.is_critical_balance) return "text-red-600"
        if (credits.is_low_balance) return "text-yellow-600"
        return "text-orange-600"
    }

    const getStatusIcon = () => {
        if (credits.is_critical_balance) return <AlertTriangle className="h-4 w-4" />
        if (credits.is_low_balance) return <AlertTriangle className="h-4 w-4" />
        return <CoinsIcon className="h-4 w-4" />
    }

    const getStatusMessage = () => {
        if (!credits.has_credits) return "No credits available"
        if (credits.is_critical_balance) return "Critical: Very low credits"
        if (credits.is_low_balance) return "Warning: Low credits"
        return "Credits available"
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Main Credit Display */}
            <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
                    {getStatusIcon()}
                    <a href="/credits"> <span className="font-medium">{credits.balance.toLocaleString()}</span>
                    <span className="text-md text-muted-foreground">&nbsp;credits</span></a>
                </div>

                {credits.account_status !== "active" && <Badge variant="destructive">Account {credits.account_status}</Badge>}
            </div>  
            {credits.is_low_balance && !credits.is_critical_balance && (
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        {getStatusMessage()}
                        {showActions && (
                            <Button size="sm" variant="outline" className="ml-2 bg-transparent" asChild>
                                <a href="/credits">Top Up</a>
                            </Button>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {/* Detailed Information */}
            {showDetails && (
                <div className="space-y-2 text-sm text-muted-foreground">
                    {credits.next_refill_date && <p>Next refill: {new Date(credits.next_refill_date).toLocaleDateString()}</p>}

                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(credits.available_actions).map(([action, info]: [string, any]) => (
                            <div key={action} className="flex justify-between">
                                <span>{info.name}:</span>
                                <span className={info.available ? "text-orange-600" : "text-red-600"}>
                                    {info.cost} credits {info.available ? "✓" : "✗"} 
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
