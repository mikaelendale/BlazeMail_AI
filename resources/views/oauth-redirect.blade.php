<!DOCTYPE html>
<html>
<head>
    <title>Connecting to Google...</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
        }
        .loading {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #4285f4;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loading">
        <div class="spinner"></div>
        <h3>Connecting to Google...</h3>
        <p>You will be redirected to Google's consent screen.</p>
        <p><small>If nothing happens, <a href="{{ $authUrl }}" id="manual-link">click here</a></small></p>
    </div>

    <script>
        // Immediate redirect
        window.location.href = '{{ $authUrl }}';
        
        // Fallback after 3 seconds
        setTimeout(function() {
            document.getElementById('manual-link').style.display = 'block';
        }, 3000);
    </script>
</body>
</html>
