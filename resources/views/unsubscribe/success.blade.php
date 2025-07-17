<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribe Successful</title>
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
            color: #28a745;
        }

        p {
            color: #333;
        }
    </style>
</head>

<body>
    <div class="container">
        <h1>Unsubscribe Successful!</h1>
        <p>You have successfully unsubscribed from future emails for {{ $contact->email }}.</p>
        <p>We're sorry to see you go.</p>
    </div>
</body>

</html>