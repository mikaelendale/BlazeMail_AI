# Single command to create both roles
php artisan tinker --execute="use Spatie\Permission\Models\Role; Role::firstOrCreate(['name' => 'user']); Role::firstOrCreate(['name' => 'admin']); echo 'Roles created successfully!';"

# Email validation 
php artisan queue:work --queue=email-validation, email-security, email-health

# Email Security 
php artisan queue:work --queue=email-security

# Email Health
php artisan queue:work --queue=email-health

## Running all three queue workers at once

You can run all three queue workers simultaneously by opening three separate terminal windows or tabs and running each command in its own terminal:

```sh
php artisan queue:work --queue=email-validation
php artisan queue:work --queue=email-security
php artisan queue:work --queue=email-health
```

Alternatively, on Unix-like systems, you can run them in the background from a single terminal:

```sh
php artisan queue:work --queue=email-validation &
php artisan queue:work --queue=email-security &
php artisan queue:work --queue=email-health &
```