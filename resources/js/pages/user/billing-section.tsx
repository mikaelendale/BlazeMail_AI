import BillingPage from '@/components/billing';
import AppLayout from '@/layouts/app-layout';
import React from 'react';


type BillingSectionProps = {
    subscription: any;
    usage: any;
    plans: any;
    billingHistory: any;
    currentPlan: any;
};

const BillingSection: React.FC<BillingSectionProps> = ( ) => {
    return (
        <AppLayout>
            <BillingPage/>
        </AppLayout>
    );
};

export default BillingSection;