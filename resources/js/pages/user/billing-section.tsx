import BillingPage from "@/components/billing"
import AppLayout from "@/layouts/app-layout"
import type React from "react"

interface UsageStats {
    used: number
    limit: number
    remaining: number
    percentage: number
    plan: string
    can_add: boolean
    is_near_limit: boolean
    is_at_limit: boolean
}

type BillingSectionProps = {
    subscription: any
    usage: UsageStats // Add the usage prop with the new type
    plans: any
    billingHistory: any
    currentPlan: any
}

const BillingSection: React.FC<BillingSectionProps> = ({ usage }) => {
    // Destructure usage from props
    return (
        <AppLayout>
            <BillingPage usage={usage} /> {/* Pass the usage prop */}
        </AppLayout>
    )
}

export default BillingSection
