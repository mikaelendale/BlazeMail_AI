import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SharedData } from "@/types";
import { Link, usePage } from "@inertiajs/react";

export default function TrialStatus() {
    const { trialStatus, customer } = usePage<SharedData>().props;

    if (customer.plan === 'free' && Boolean(trialStatus)) {
        return (
            <Alert className="mb-6">
                <AlertDescription>
                    <div className="flex">
                        <div>
                            <span className="font-medium">You're on a free trial!</span>
                            <span className="ml-2">
                                Upgrade your plan before your trial ends to keep generating emails without interruption&nbsp;
                            </span>
                            <Link href="/billing" className="text-primary underline">
                                Upgrade now
                            </Link>
                        </div>
                    </div>
                </AlertDescription>
            </Alert>
        );
    }

    return null;
}