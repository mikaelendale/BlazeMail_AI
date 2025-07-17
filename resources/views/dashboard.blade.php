<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="bg-gray-50">
    <div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl mx-auto">
            <h1 class="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

            <!-- Flash Messages -->
            @if (session('success'))
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                    {{ session('success') }}
                </div>
            @endif

            @if (session('error'))
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    {{ session('error') }}
                </div>
            @endif

            <!-- Subscription Status -->
            <div class="bg-white shadow rounded-lg p-6 mb-6">
                @php
                    $user = Auth::user();
                    $subscription = $user->subscription();
                    $canceledSub = $subscription && $subscription->canceled();
                    $gracePeriodSub = $subscription && $subscription->onGracePeriod() ? $subscription : null;
                    $activeSub = $subscription && !$canceledSub && !$gracePeriodSub ? $subscription : null;
                @endphp

                @if ($paused)
                    <!-- PAUSED ALERT -->
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div class="flex items-center">
                            <svg class="h-8 w-8 text-yellow-400 mr-3" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <div>
                                <h3 class="text-lg font-medium text-yellow-900">⚠️ Payment Paused</h3>
                                <p class="text-sm text-yellow-700">Your subscription is currently paused. Resume to
                                    continue
                                    billing.</p>
                            </div>
                        </div>
                    </div>

                    <!-- RESUME BUTTON ONLY -->
                    <div class="text-center">
                        <form method="POST" action="{{ route('subscription.resume') }}" class="inline">
                            @csrf
                            <button type="submit"
                                class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                                Resume Subscription
                            </button>
                        </form>
                    </div>
                @endif

                @if ($gracePeriodSub)
                    <!-- CANCELLED BUT ON GRACE PERIOD -->
                    <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                        <div class="flex items-center">
                            <svg class="h-8 w-8 text-orange-400 mr-3" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>

                                <h3 class="text-lg font-medium text-orange-900">Subscription Canceled</h3>
                                <p class="text-sm text-orange-700">
                                    You still have access until {{ $gracePeriodSub->ends_at }}
                                </p>
                            </div>
                        </div>
                    </div>
                @elseif ($canceledSub)
                    <!-- CANCELLED AND NO GRACE PERIOD -->
                    <div class="text-center">
                        <h3 class="text-lg font-medium text-gray-900">Subscription Ended</h3>
                        <p class="mt-1 text-sm text-gray-600">Your subscription has ended</p>
                        <div class="mt-4">
                            <a href="{{ route('subscribe', ['plan' => 'pro']) }}"
                                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                                Subscribe Again
                            </a>
                        </div>
                    </div>
                @elseif ($activeSub)
                    <!-- ACTIVE SUBSCRIPTION -->
                    <div class="flex items-center mb-4">
                        <svg class="h-8 w-8 text-green-400 mr-3" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 class="text-lg font-medium text-gray-900">Active Subscription</h3>
                            @if ($activeSub->onTrial())
                                <p class="text-sm text-gray-600">
                                    Trial ends: {{ $activeSub->trial_ends_at->format('M d, Y') }}
                                </p>
                            @else
                                <p class="text-sm text-gray-600">
                                    Next billing: {{ $activeSub->nextPayment()?->date()?->format('M d, Y') ?? 'N/A' }}
                                </p>
                            @endif
                        </div>
                    </div>

                    <!-- PLAN SWITCHING -->
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 class="text-sm font-medium text-gray-900 mb-3">Switch Plan</h4>
                        <div class="flex gap-3">
                            <form method="POST" action="{{ route('subscription.swap') }}" class="inline">
                                @csrf
                                <input type="hidden" name="plan" value="starter">
                                <button type="submit"
                                    class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    onclick="return confirm('Switch to Starter plan?')">
                                    Switch to Starter ($19/month)
                                </button>
                            </form>

                            <form method="POST" action="{{ route('subscription.swap') }}" class="inline">
                                @csrf
                                <input type="hidden" name="plan" value="pro">
                                <button type="submit"
                                    class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    onclick="return confirm('Switch to Pro plan?')">
                                    Switch to Pro ($49/month)
                                </button>
                            </form>
                        </div>
                    </div>

                    <!-- ACTIVE SUBSCRIPTION BUTTONS -->
                    <div class="flex flex-wrap gap-3">
                        <a href="{{ route('subscription.payment-method') }}"
                            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Update Payment Method
                        </a>

                        <form method="POST" action="{{ route('subscription.pause') }}" class="inline">
                            @csrf
                            <button type="submit"
                                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                                onclick="return confirm('Are you sure you want to pause your subscription?')">
                                Pause Subscription
                            </button>
                        </form>

                        <form method="POST" action="{{ route('subscription.cancel') }}" class="inline">
                            @csrf
                            <button type="submit"
                                class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                onclick="return confirm('Are you sure you want to cancel your subscription?')">
                                Cancel Subscription
                            </button>
                        </form>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 class="text-sm font-medium text-gray-900 mb-3">Switch Plan</h4>

                        <!-- Plan Options -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div class="border rounded-lg p-3">
                                <h5 class="font-medium">Starter Plan</h5>
                                <p class="text-sm text-gray-600">$9/month</p>
                                <div class="mt-2 space-y-2">
                                    <form method="POST" action="{{ route('subscription.swap') }}" class="inline">
                                        @csrf
                                        <input type="hidden" name="plan" value="starter">
                                        <input type="hidden" name="billing" value="next_cycle">
                                        <button type="submit"
                                            class="w-full text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                                            Switch (Next Cycle)
                                        </button>
                                    </form>
                                    <form method="POST" action="{{ route('subscription.swap') }}" class="inline">
                                        @csrf
                                        <input type="hidden" name="plan" value="starter">
                                        <input type="hidden" name="billing" value="immediate">
                                        <button type="submit"
                                            class="w-full text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                                            onclick="return confirm('You will be charged immediately with proration. Continue?')">
                                            Switch Now (Prorated)
                                        </button>
                                    </form>
                                </div>
                            </div>

                            <div class="border rounded-lg p-3">
                                <h5 class="font-medium">Pro Plan</h5>
                                <p class="text-sm text-gray-600">$19/month</p>
                                <div class="mt-2 space-y-2">
                                    <form method="POST" action="{{ route('subscription.swap') }}" class="inline">
                                        @csrf
                                        <input type="hidden" name="plan" value="pro">
                                        <input type="hidden" name="billing" value="next_cycle">
                                        <button type="submit"
                                            class="w-full text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                                            Switch (Next Cycle)
                                        </button>
                                    </form>
                                    <form method="POST" action="{{ route('subscription.swap') }}" class="inline">
                                        @csrf
                                        <input type="hidden" name="plan" value="pro">
                                        <input type="hidden" name="billing" value="immediate">
                                        <button type="submit"
                                            class="w-full text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                                            onclick="return confirm('You will be charged immediately with proration. Continue?')">
                                            Switch Now (Prorated)
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <!-- Advanced Options -->
                        <details class="mt-3">
                            <summary class="text-sm text-gray-600 cursor-pointer hover:text-gray-900">Advanced Billing
                                Options</summary>
                            <div class="mt-2 space-y-2 text-xs">
                                <div class="flex gap-2">
                                    <form method="POST" action="{{ route('subscription.swap') }}" class="inline">
                                        @csrf
                                        <input type="hidden" name="plan" value="starter">
                                        <input type="hidden" name="billing" value="no_prorate">
                                        <button type="submit"
                                            class="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700">
                                            Starter (No Proration)
                                        </button>
                                    </form>
                                    <form method="POST" action="{{ route('subscription.swap') }}" class="inline">
                                        @csrf
                                        <input type="hidden" name="plan" value="pro">
                                        <input type="hidden" name="billing" value="no_prorate">
                                        <button type="submit"
                                            class="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700">
                                            Pro (No Proration)
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </details>
                    </div>
                @else
                    <!-- NO SUBSCRIPTION -->
                    <div class="text-center">
                        <h3 class="text-lg font-medium text-gray-900">No Active Subscription</h3>
                        <p class="mt-1 text-sm text-gray-600">Start your free trial today</p>
                        <div class="mt-4">
                            <a href="{{ route('subscribe', ['plan' => 'pro']) }}"
                                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                                Start Free Trial
                            </a>
                        </div>
                    </div>
                @endif
            </div>
        </div>
    </div>
</body>

</html>
