import LandingLayout from './landing/landing-layout';
import Pricing from './landing/Pricing';
import PricingComparison from './landing/pricing-comparison';

export default function PricingPage() {
    return (
        <>
            <LandingLayout>
                <div className="min-h-screen bg-background">
                    {/* Hero Section */}
                    <div className="relative overflow-hidden border-b bg-gradient-to-br from-background via-background to-orange-50/30 dark:to-orange-950/10">
                        <div className="container mx-auto px-4 py-24 md:py-32">
                            <div className="mx-auto max-w-4xl text-center">
                                {/* <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
                                    Transparent Pricing
                                </div> */}
                                <br /><br />
                                <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
                                    Scale your outreach.
                                    <span className="block text-orange-500">Pay as you grow.</span>
                                </h1>
                                <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
                                    Choose the perfect plan for your cold email campaigns. No hidden fees, no surprises.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Pricing /> 
                </div>
            </LandingLayout>
        </>
    );
}
