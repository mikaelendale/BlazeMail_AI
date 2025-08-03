# Email Healing System - Developer Documentation

## 🏗️ SYSTEM ARCHITECTURE

### Core Components
1. **Jobs** - Background processing for healing accounts
2. **Commands** - CLI tools for management and monitoring  
3. **Migrations** - Database structure for healing features
4. **Models** - EmailAccount model with healing relationships

---

## 📁 FILE STRUCTURE & RESPONSIBILITIES

### 🔧 CORE HEALING JOBS
```
app/Jobs/
├── EmailAccountHealthCheckJob.php          # Main orchestrator - runs every 2 hours
├── ImprovedValidateEmailTokensJob.php      # Advanced healing with comprehensive error handling
├── FixedValidateEmailTokensJob.php         # Database-constraint-safe version
└── ValidateEmailTokensJob.php              # Original basic version
```

**Primary Job**: `FixedValidateEmailTokensJob.php` (recommended for production)

### 🖥️ MANAGEMENT COMMANDS
```
app/Console/Commands/
├── StartEmailHealingSystem.php             # Initialize automated healing
├── EmailSystemStatus.php                  # Basic system status
├── UpdatedEmailSystemStatus.php           # Enhanced status with reauth detection
├── EmailHealingSummary.php                # Comprehensive system overview
├── EmailSystemHealthCheck.php             # Health scoring and diagnostics
├── CreateReauthNotification.php           # User notification management
├── ImprovedHealErrorEmailAccounts.php     # Advanced healing command
├── FixedHealErrorEmailAccounts.php        # Production-safe healing
├── EmailAccountDetails.php                # Individual account inspection
└── TestEmailConnection.php                # Connection testing utility
```

### 🗄️ DATABASE MIGRATIONS
```
database/migrations/
├── add_healing_fields_to_email_accounts.php    # Adds healing tracking fields
└── fix_email_accounts_status_constraint.php    # Fixes status constraint for 'needs_reauth'
```

### ⚙️ CONFIGURATION
```
app/Console/Kernel.php                      # Scheduled task definitions
```

---

## 🔄 HEALING WORKFLOW

### 1. **Detection Phase**
```php
// Identifies accounts needing attention
$accounts = EmailAccount::where(function ($query) {
    $query->where('status', 'error')
        ->orWhere('consecutive_errors', '>', 0)
        ->orWhere('token_expires_at', '<=', now()->addHours(1))
        ->orWhere('last_health_check', '<=', now()->subHours(6));
})->get();
```

### 2. **Classification Phase**
```php
// Determines if account needs re-authentication
private function needsReAuthentication(): bool
{
    $reAuthErrors = [
        'invalid_grant',
        'unauthorized_client', 
        'access_denied',
        'token has been expired or revoked'
    ];
    
    foreach ($reAuthErrors as $errorType) {
        if (str_contains($lastError, $errorType)) {
            return true;
        }
    }
    return false;
}
```

### 3. **Healing Phase**
```php
// Attempts token refresh
$newToken = $client->fetchAccessTokenWithRefreshToken($refreshToken);

// Tests Gmail connection
$profile = $gmail->users->getProfile('me');

// Updates account status
$account->update([
    'status' => 'active',
    'consecutive_errors' => 0,
    'last_sync' => now()
]);
```

---

## 🎯 COMMAND USAGE GUIDE

### Daily Operations
```bash
# Check system health
php artisan email:system-status-updated

# Run healing process
php artisan email:heal-errors-fixed

# Get comprehensive overview
php artisan email:healing-summary

# Health check with scoring
php artisan email:health-check
```

### Troubleshooting
```bash
# Inspect specific account
php artisan email:account-details {account-id}

# Test connection for account
php artisan email:test-connection {account-id}

# Heal specific account only
php artisan email:heal-errors-fixed --account-id={id}
```

### System Management
```bash
# Start automated healing (runs every 2 hours)
php artisan email:start-healing-system

# Create user notifications
php artisan email:create-reauth-notifications

# Run scheduled tasks
php artisan schedule:work
```

---

## 📊 DATABASE SCHEMA ADDITIONS

### New Fields in `email_accounts` Table
```sql
-- Healing System Fields
last_healing_attempt         TIMESTAMP NULL
healing_attempts_today       INT DEFAULT 0
healing_history             JSON NULL
auto_healing_enabled        BOOLEAN DEFAULT TRUE
auto_healed_at              TIMESTAMP NULL
auto_heal_count             INT DEFAULT 0

-- Token Management
last_token_refresh          TIMESTAMP NULL
token_refresh_count         INT DEFAULT 0
token_refresh_failed_at     TIMESTAMP NULL

-- Indexes for Performance
INDEX (status, consecutive_errors, last_health_check)
INDEX (auto_healing_enabled, status)
INDEX (token_expires_at, provider)
```

---

## 🔍 MONITORING & LOGGING

### Log Patterns to Watch
```bash
# Successful healing
grep "ACCOUNT SUCCESSFULLY HEALED" storage/logs/laravel.log

# Accounts needing reauth
grep "NEEDS_REAUTH" storage/logs/laravel.log

# Token refresh failures
grep "Token refresh failed" storage/logs/laravel.log

# System health alerts
grep "Email system health alert" storage/logs/laravel.log
```

### Key Metrics
- **Health Score**: Overall system health (0-100%)
- **Active Rate**: Percentage of accounts that are active and connected
- **Reauth Rate**: Percentage of accounts needing re-authentication
- **Error Rate**: Percentage of accounts with consecutive errors

---

## 🚨 ERROR HANDLING

### Account Status Flow
```
[Active] → [Warning] → [Error] → [Suspended/needs_reauth]
    ↑                                      ↓
    ←←←←←← [Healing Process] ←←←←←←←←←←←←←←←←
```

### Status Meanings
- **active**: Account working normally
- **warning**: Minor issues, still functional
- **error**: Multiple failures, needs attention
- **suspended**: Needs re-authentication (OAuth issues)
- **needs_reauth**: Explicit re-authentication required

---

## ⚡ PERFORMANCE CONSIDERATIONS

### Queue Configuration
```php
// Recommended queue setup
'email-health' => [
    'driver' => 'database',
    'queue' => 'email-health',
    'retry_after' => 600,
    'block_for' => 0,
],

'email-validation' => [
    'driver' => 'database', 
    'queue' => 'email-validation',
    'retry_after' => 300,
    'block_for' => 0,
]
```

### Scheduling
```php
// In app/Console/Kernel.php
$schedule->command('email:heal-errors-fixed')
    ->everyTwoHours()
    ->withoutOverlapping()
    ->runInBackground();

$schedule->command('email:health-check')
    ->hourly()
    ->withoutOverlapping();
```

---

## 🔐 SECURITY CONSIDERATIONS

### Token Storage
- Access tokens encrypted in database
- Refresh tokens encrypted separately
- No tokens logged in plain text
- Automatic token rotation

### Rate Limiting
- Delays between API calls (500ms)
- Maximum healing attempts per day (10)
- Exponential backoff on failures
- Queue-based processing to prevent overload

---

## 🧪 TESTING

### Manual Testing
```bash
# Test specific account
php artisan email:test-connection 52

# Force healing run
php artisan email:heal-errors-fixed --force

# Check health score
php artisan email:health-check --alert
```

### Automated Testing
```php
// Example test structure
public function test_healing_system_detects_invalid_grant()
{
    $account = EmailAccount::factory()->create([
        'last_error' => 'invalid_grant',
        'status' => 'error'
    ]);
    
    FixedValidateEmailTokensJob::dispatchSync($account);
    
    $account->refresh();
    $this->assertEquals('suspended', $account->status);
    $this->assertStringContains('NEEDS_REAUTH', $account->last_error);
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Run migrations: `php artisan migrate`
- [ ] Configure Gmail OAuth credentials
- [ ] Set up queue workers
- [ ] Configure scheduled tasks

### Post-Deployment
- [ ] Test healing system: `php artisan email:heal-errors-fixed`
- [ ] Verify health check: `php artisan email:health-check`
- [ ] Start scheduler: `php artisan schedule:work`
- [ ] Monitor logs for first 24 hours

### Production Monitoring
- [ ] Set up log monitoring for "NEEDS_REAUTH" patterns
- [ ] Configure health check alerts
- [ ] Monitor queue processing times
- [ ] Track user re-authentication rates

---

## 🔧 TROUBLESHOOTING GUIDE

### Common Issues

#### "Database constraint violation"
**Solution**: Run `fix_email_accounts_status_constraint.php` migration

#### "No accounts being healed"
**Solution**: Check queue workers are running: `php artisan queue:work`

#### "High error rates"
**Solution**: Most likely OAuth tokens expired - normal behavior, users need to reconnect

#### "Health score always low"
**Solution**: If all accounts need reauth, this is expected - focus on user notifications

### Debug Commands
```bash
# Check queue status
php artisan queue:failed

# Clear failed jobs
php artisan queue:flush

# Restart queue workers
php artisan queue:restart

# Check scheduled tasks
php artisan schedule:list
```

---

## 📈 FUTURE ENHANCEMENTS

### Planned Features
1. **Web Interface**: User-friendly reauth flow
2. **Email Notifications**: Automated user alerts
3. **Advanced Analytics**: Healing success rates
4. **Bulk Operations**: Mass account management
5. **API Integration**: Programmatic access

### Scalability Considerations
- Redis queue for high-volume processing
- Database indexing optimization
- Horizontal scaling support
- Microservice architecture preparation

---

## 📞 SUPPORT

### Getting Help
1. Check logs: `storage/logs/laravel.log`
2. Run health check: `php artisan email:health-check`
3. Review account details: `php artisan email:account-details {id}`
4. Test connections: `php artisan email:test-connection {id}`

### Emergency Procedures
```bash
# Stop all healing processes
php artisan queue:clear

# Reset all healing attempts
# (Custom command - implement if needed)
php artisan email:reset-healing-counters

# Force system restart
php artisan queue:restart
php artisan email:start-healing-system
