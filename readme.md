# 🔐 Default Roles/Permissions
Created by **RolePermissionSeeder**:

**Admin**: Full access

**User**: Basic email features

To manually create:

```
php artisan tinker

# In Tinker:
Role::create(['name'=>'admin','guard_name'=>'web']);
Role::create(['name'=>'user','guard_name'=>'web']);
```
```
php artisan tinker
```
**Then run:**
```
php
User::find(1)->assignRole('admin');
```