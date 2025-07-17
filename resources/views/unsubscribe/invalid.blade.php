<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invalid Unsubscribe Link</title>
    <style>
        body {
            font-family: sans-serif;
            text-align: center;
            padding: 50px;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #f9f9f9;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        h1 {
            color: #dc3545;
        }

        p {
            color: #333;
        }
    </style>
</head>

<body>
    <div class="container">
        <h1>Error</h1>
        <p>{{ $message ?? 'The unsubscribe link is invalid or has expired.' }}</p>
    </div>
</body>

</html>