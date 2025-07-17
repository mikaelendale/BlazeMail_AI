<!DOCTYPE html>
<html>
<head>
    <title>Start Your Trial</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto p-8">
        <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <h1 class="text-2xl font-bold mb-6 text-center">Start Your 7-Day Free Trial</h1>
            
            @if(auth()->user()->onTrial())
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    <p><strong>Trial Active!</strong></p>
                    <p>Your trial ends on: {{ auth()->user()->trialEndsAt()->format('M d, Y') }}</p>
                </div>
                
                <div class="space-y-4">
                    <h3 class="text-lg font-semibold">Choose Your Plan</h3>
                    
                    <form method="POST" action="{{ route('trial.convert') }}">
                        @csrf
                        <input type="hidden" name="plan" value="starter">
                        <button type="submit" class="w-full bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700">
                            Convert to Starter Plan - $9/month
                        </button>
                    </form>
                    
                    <form method="POST" action="{{ route('trial.convert') }}">
                        @csrf
                        <input type="hidden" name="plan" value="pro">
                        <button type="submit" class="w-full bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700">
                            Convert to Pro Plan - $19/month
                        </button>
                    </form>
                </div>
            @else
                <form method="POST" action="{{ route('trial.start') }}">
                    @csrf
                    <div class="text-center">
                        <p class="mb-4">Get full access to all features for 7 days, completely free!</p>
                        <button type="submit" class="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700">
                            Start Free Trial
                        </button>
                    </div>
                </form>
            @endif
        </div>
    </div>
</body>
</html>
