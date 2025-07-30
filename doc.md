# Single command to create both roles
php artisan tinker --execute="use Spatie\Permission\Models\Role; Role::firstOrCreate(['name' => 'user']); Role::firstOrCreate(['name' => 'admin']); echo 'Roles created successfully!';"

