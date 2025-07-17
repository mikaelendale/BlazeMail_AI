<?php

use App\Http\Controllers\CampaignController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\EmailAccountController;
use App\Http\Controllers\EmailAccountSetupController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\User\DashboardController;
use App\Http\Controllers\EmailGenerateController;
use App\Http\Controllers\GmailOAuthController;
use App\Http\Controllers\InboxController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\User\BillingController;
use App\Http\Controllers\User\MyEmailsController;
use App\Http\Controllers\User\EmailSenderController;
use App\Http\Middleware\ValidateEmailAccountHealth;
use Inertia\Inertia;

Route::middleware(['auth', 'verified', 'role:user', 'onboarding'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('my-emails', [MyEmailsController::class, 'index'])->name('myemails');
    Route::delete('my-emails/{id}/delete', [MyEmailsController::class, 'delete'])->name('myemails.delete');
    // Billing routes
    Route::get('/billing', [BillingController::class, 'index'])->name('billing.index');
    Route::post('/billing/change-plan', [BillingController::class, 'changePlan'])->name('billing.change-plan');
    Route::post('/billing/update-payment', [BillingController::class, 'updatePaymentMethod'])->name('billing.update-payment');
    Route::post('/billing/cancel', [BillingController::class, 'cancelSubscription'])->name('billing.cancel');
    Route::get('/billing/invoice/{transaction}', [BillingController::class, 'downloadInvoice'])->name('billing.download-invoice');


    // Notification routes
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications');
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->middleware('auth');
    // Mark specific notification as read
    Route::post('/notifications/{id}/mark-read', [NotificationController::class, 'markAsRead'])->middleware('auth');
    // Mark specific notification as unread
    Route::post('/notifications/{id}/mark-unread', [NotificationController::class, 'markAsUnread'])->middleware('auth');


    // Contacts page
    // Contact routes
    Route::get('/contacts', [ContactController::class, 'index'])->name('contacts.index');
    Route::post('/contacts', [ContactController::class, 'store'])->name('contacts.store');
    // Import/Export
    Route::get('/contacts/download-template', [ContactController::class, 'downloadTemplate']);
    Route::get('/contacts/template', [ContactController::class, 'downloadTemplate'])->name('contacts.template');
    Route::post('/contacts/import', [ContactController::class, 'import'])->name('contacts.import');
    Route::get('/contacts/export', [ContactController::class, 'export'])->name('contacts.export');
    Route::get('/contacts/{contact}', [ContactController::class, 'show'])->name('contacts.show');
    Route::put('/contacts/{contact}', [ContactController::class, 'update'])->name('contacts.update');
    Route::delete('/contacts/{contact}', [ContactController::class, 'destroy'])->name('contacts.destroy');
    // Bulk operations
    Route::delete('/contacts/bulk/delete', [ContactController::class, 'bulkDelete'])->name('contacts.bulk.delete');
    Route::put('/contacts/bulk/update', [ContactController::class, 'bulkUpdate'])->name('contacts.bulk.update');

    Route::get('email/generate', function () {
        return Inertia::render('user/email/generate');
    })->name('user.email.generate')->middleware('credits:email_generation');
    Route::post('email/generate', [\App\Http\Controllers\EmailGenerateController::class, 'store'])->name('user.email.generate.post')->middleware('credits:email_generation');
    Route::get('email/generate/refine', function () {
        return redirect(route('user.email.generate'));
    })->middleware('credits:ai_rewrite');
    Route::post('email/generate/refine', [\App\Http\Controllers\EmailGenerateController::class, 'refine'])->name('user.email.generate.refine')->middleware('credits:ai_rewrite');
    //saving generated email
    Route::post('email/generate/save', [EmailGenerateController::class, 'save'])
        ->name('user.email.generate.save');
    // Show the email sender page (or trigger sending)
    Route::get('email/generate/send', [EmailSenderController::class, 'send'])
        ->name('user.email.generate.send');
    Route::post('email/generate/send', [EmailSenderController::class, 'sendBulk'])
        ->name('user.email.generate.send.bulk');
    //scam checker 
    // Route::get('email/scam-checker', [ScamCheckController::class, 'index'])->name('email.scam.page');
    // Campaign

    Route::prefix('email/campaign')->name('user.email.')->group(function () {
        Route::get('/', [CampaignController::class, 'index'])->name('campaign');
        Route::post('/filter', [CampaignController::class, 'filter'])->name('campaign.filter');
        Route::get('/create', [CampaignController::class, 'create'])->name('campaign.create');
        Route::post('/store', [CampaignController::class, 'store'])->name('campaign.store');
        Route::get('/{campaign}/setup', [CampaignController::class, 'setup'])->name('campaign.setup');
        Route::patch('/{campaign}/setup', [CampaignController::class, 'updateSetup'])->name('campaign.updateSetup');
        Route::patch('/{campaign}/launch', [CampaignController::class, 'launch'])->name('campaign.launch');
        Route::delete('/{campaign}', [CampaignController::class, 'destroy'])->name('campaign.destroy'); // Existing delete route
        Route::get('/{campaign}', [CampaignController::class, 'show'])->name('campaign.show');
        Route::get('/status-completed', [CampaignController::class, 'status_completed'])->name('campaign.status_completed');
        Route::patch('/{campaign}/status', [CampaignController::class, 'updateStatus'])
            ->name('campaign.updateStatus');
    });

    // Connected Accounts
    // Route::get('settings/accounts', function () {
    //     return Inertia::render('settings/connected-accounts');
    // })->name('settings.accounts');
    // Route::get('settings/accounts/details', function () {
    //     return Inertia::render('settings/connected-account-details');
    // })->name('settings.connected');


    // Email accounts routes with health check middleware
    Route::get('/settings/email-accounts', [EmailAccountController::class, 'index'])
        ->name('settings.email-accounts');

    Route::post('/settings/email-accounts', [EmailAccountController::class, 'store'])
        ->name('email-accounts.store');

    Route::get('/settings/email-accounts/{emailAccount}', [EmailAccountController::class, 'show'])
        ->name('email-accounts.show');

    Route::patch('/settings/email-accounts/{emailAccount}', [EmailAccountController::class, 'update'])
        ->name('email-accounts.update');

    Route::patch('/settings/email-accounts/{emailAccount}/toggle', [EmailAccountController::class, 'toggle'])
        ->name('email-accounts.toggle');

    Route::delete('/settings/email-accounts/{emailAccount}', [EmailAccountController::class, 'destroy'])
        ->name('email-accounts.destroy');

    // Connection test with health check
    Route::post('/api/email-accounts/{emailAccount}/test-connection', [EmailAccountController::class, 'testConnection'])
        ->name('email-accounts.test-connection')
        ->middleware(ValidateEmailAccountHealth::class);

    // Inbox routes with health check middleware
    Route::get('/inbox', [InboxController::class, 'index'])->name('inbox.index');
    Route::get('/inbox/{message}', [InboxController::class, 'show'])->name('inbox.show');

    Route::post('/inbox/sync-account', [InboxController::class, 'syncAccount'])
        ->name('inbox.sync-account')
        ->middleware(ValidateEmailAccountHealth::class);

    Route::post('/inbox/sync', [InboxController::class, 'sync'])
        ->name('inbox.sync')
        ->middleware(ValidateEmailAccountHealth::class);

    Route::post('/inbox/mark-read', [InboxController::class, 'markAsRead'])->name('inbox.mark-read');
    Route::post('/inbox/{message}/star', [InboxController::class, 'toggleStar'])->name('inbox.toggle-star');
    Route::post('/inbox/{message}/important', [InboxController::class, 'markAsImportant'])->name('inbox.mark-important');
    Route::delete('/inbox/messages', [InboxController::class, 'destroy'])->name('inbox.destroy');
});

Route::middleware(['auth', 'verified', 'role:user'])->group(function () {
    // Gmail OAuth routes 
    Route::get('/oauth/gmail/start', [GmailOAuthController::class, 'start'])
        ->name('oauth.gmail.start');
    Route::get('/oauth/gmail/callback', [GmailOAuthController::class, 'callback'])
        ->name('oauth.gmail.callback');

    // NEW: Email Account Setup routes
    Route::get('/settings/email-accounts/{account}/setup', [EmailAccountSetupController::class, 'show'])
        ->name('settings.email-accounts.setup');
    Route::post('/settings/email-accounts/{account}/setup', [EmailAccountSetupController::class, 'store'])
        ->name('settings.email-accounts.setup.store');
});
