import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SharedData } from "@/types";
import { Link, usePage } from "@inertiajs/react"; 

export default function TrialStatus() {
    const { trialStatus, customer } = usePage<SharedData>().props;
    return (
        <>
            {customer.plan === 'free' && (
                Boolean(trialStatus) ? (
                    <Alert className="mb-6">
                        <AlertDescription>
                            <div className="flex ">
                                <div>
                                    <span className="font-medium ">You're on a free trial!</span>
                                    <span className="ml-2 ">
                                        Upgrade your plan before your trial ends to keep generating emails without interruption &nbsp;
                                    </span>
                                    <Link href="/billing" className="text-primary underline">Upgrade now
                                    </Link>
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert className="mb-6 border-green-400/40 bg-green-100/40">
                        <AlertDescription>
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="ml-2 text-green-800">Your account is active and ready to use.</span>
                                </div>
                                <Link href="/billing">
                                    <Button size="sm" variant="outline" className="border-green-400 text-green-900 hover:bg-green-200">
                                        Manage Account
                                    </Button>
                                </Link>
                            </div>
                        </AlertDescription>
                    </Alert>
                )
            )}
        </>
    );
}