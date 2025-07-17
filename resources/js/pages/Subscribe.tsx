import { useEffect } from 'react';

export default function Subscribe({ plan, checkout }: { plan: string; checkout: any }) {
    useEffect(() => {
        if (window.Paddle && checkout) {
            window.Paddle.Checkout.open(checkout);
        }
    }, [checkout]);

    return (
        <div className="mx-auto max-w-xl p-6 text-center">
            <h1 className="mb-4 text-3xl font-bold">Subscribe to {plan} Plan</h1>
            <div id="paddle-checkout" className="paddle-checkout" />
        </div>
    );
}
