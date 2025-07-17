<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complete Your Subscription</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="/css/app.css" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        primary: {
                            DEFAULT: 'hsl(var(--primary))',
                            foreground: 'hsl(var(--primary-foreground))',
                        },
                        secondary: {
                            DEFAULT: 'hsl(var(--secondary))',
                            foreground: 'hsl(var(--secondary-foreground))',
                        },
                        accent: {
                            DEFAULT: 'hsl(var(--accent))',
                            foreground: 'hsl(var(--accent-foreground))',
                        },
                        muted: {
                            DEFAULT: 'hsl(var(--muted))',
                            foreground: 'hsl(var(--muted-foreground))',
                        },
                        card: {
                            DEFAULT: 'hsl(var(--card))',
                            foreground: 'hsl(var(--card-foreground))',
                        },
                        border: 'hsl(var(--border))',
                    }
                }
            }
        }
    </script>
    <style>
        * {
            font-family: "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'";

        }

        :root {
            --background: 0 0% 100%;
            --foreground: 222.2 84% 4.9%;
            --card: 0 0% 100%;
            --card-foreground: 222.2 84% 4.9%;
            --primary: 221.2 83.2% 53.3%;
            --primary-foreground: 210 40% 98%;
            --secondary: 210 40% 96%;
            --secondary-foreground: 222.2 84% 4.9%;
            --muted: 210 40% 96%;
            --muted-foreground: 215.4 16.3% 46.9%;
            --accent: 210 40% 96%;
            --accent-foreground: 222.2 84% 4.9%;
            --border: 214.3 31.8% 91.4%;
        } 
    </style>
    @paddleJS
</head>

<body class="bg-background text-foreground antialiased">
    <div class="min-h-screen py-8 px-4">
        <div class="max-w-7xl mx-auto">

            <!-- Header -->
            <div class="text-center pt-10 mb-8 ">
                <h1 class="text-3xl font-bold text-foreground mb-2">Complete Your Subscription</h1>
                <p class="text-lg text-muted-foreground">Secure checkout powered by Paddle</p>
            </div>

            <!-- Right Side - Payment Section -->
            <div class="space-y-6">
                <!-- Total Card -->
                {{-- @if ($items && count($items) > 0)
                        <div class="bg-card border border-border rounded-lg p-6">
                            <h3 class="font-medium text-card-foreground mb-4">Payment Summary</h3>
                            <div class="space-y-3">
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-muted-foreground">Subtotal</span>
                                    <span class="text-card-foreground">${{ number_format($total, 2) }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Tax</span>
                <span class="text-card-foreground">Calculated at checkout</span>
            </div>
            <div class="border-t border-border pt-3">
                <div class="flex items-center justify-between">
                    <span class="font-medium text-card-foreground">Total</span>
                    <span class="text-xl font-bold text-card-foreground">${{ number_format($total, 2) }}</span>
                </div>
                <p class="text-xs text-muted-foreground mt-1">{{ $items[0]['currency'] ?? 'USD' }}</p>
            </div>
        </div>
    </div>
    @endif --}}

    <?php
    $options = $checkout->options();
    $options['settings']['frameTarget'] = 'paddle-checkout';
    $options['settings']['frameInitialHeight'] = 366;
    ?>

    <div class="paddle-checkout">
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                Paddle.Checkout.open(@json($options));
            });
        </script>
    </div>
    </div>

    <!-- Footer -->
    <div class="text-center mt-8 pt-6 border-t border-border">
        <div class="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clip-rule="evenodd"></path>
            </svg>
            <span>Your payment information is secure and encrypted</span>
        </div>
    </div>
    </div>
    </div>
</body>

</html>