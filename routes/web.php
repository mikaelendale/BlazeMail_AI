<?php

use App\Http\Controllers\Admin\RssController;
use App\Http\Controllers\Admin\SitemapController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\ChangelogController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\CreditController;
use App\Http\Controllers\EmailTrackingController;
use App\Http\Controllers\LandingPageController;
use App\Http\Controllers\LegalController;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\Socialite\ProviderCallbackController;
use App\Http\Controllers\Socialite\ProviderRedirectController;
use App\Http\Controllers\UnsubscribeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/


Route::middleware(['auth', 'verified', 'role:user', 'soon'])->group(function () {
    Route::get('onboarding', [OnboardingController::class, 'index'])
        ->name('user.onboarding')
        ->middleware('onboardingComplete');
    Route::post('onboarding/submit', [OnboardingController::class, 'store'])
        ->name('user.onboarding.submit')
        ->middleware('onboardingComplete');
});
// social logins
Route::get('/auth/{provider}/redirect', ProviderRedirectController::class)->name('auth.redirect')->middleware(['throttle:5,1', 'soon']);
Route::get('/auth/{provider}/callback', ProviderCallbackController::class)->name('auth.callback')->middleware(['throttle:5,1', 'soon']);

Route::get('/soon', function () {
    if (config('app.status') !== 'coming-soon') {
        abort(404);
    }
    return Inertia::render('ComingSoon');
})->name('coming-soon');

//landing pages
// Route::get('/', [LandingPageController::class, 'index'])->name('home');
// Route::get('/pricing', [LandingPageController::class, 'pricing'])->name('pricing');
// Route::get('/features', [LandingPageController::class, 'features'])->name('features');
// // Changelog 
// Route::get('/changelog', [ChangelogController::class, 'index'])->name('changelog');
// Route::get('/privacy', [LegalController::class, 'privacy'])->name('privacy');
// Route::get('/terms', [LegalController::class, 'terms'])->name('terms');

//blog

// Route::prefix('blog')->name('blog.')->group(function () {
//     Route::get('/', [BlogController::class, 'index'])->name('index');
//     Route::get('/search', [BlogController::class, 'search'])->name('search');
//     Route::get('/category/{category:slug}', [BlogController::class, 'category'])->name('category');
//     Route::get('/tag/{tag:slug}', [BlogController::class, 'tag'])->name('tag');
//     Route::get('/author/{user:name}', [BlogController::class, 'author'])->name('author');
//     Route::get('/{post:slug}', [BlogController::class, 'show'])->name('show');

//     // Comments
//     Route::middleware('auth')->group(function () {
//         Route::post('/{post:slug}/comments', [CommentController::class, 'store'])->name('comments.store');
//     });
// });

// // SEO Routes
// Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');
// Route::get('/rss', [RssController::class, 'index'])->name('rss');

// // Newsletter Routes
// Route::post('/newsletter/subscribe', [NewsletterController::class, 'subscribe'])->name('newsletter.subscribe');
// Route::get('/newsletter/verify/{token}', [NewsletterController::class, 'verify'])->name('newsletter.verify');
// Route::get('/newsletter/unsubscribe/{token}', [NewsletterController::class, 'unsubscribe'])->name('newsletter.unsubscribe');

//support routes
// Route::get('/support', function () {
//     return Inertia::render('support');
// })->name('support.index');

// Credit management routes
Route::middleware('auth', 'soon')->group(function () {
    Route::get('/credits', [CreditController::class, 'index'])->name('credits.index');
});

Route::get('/unsubscribe/{token}', UnsubscribeController::class)->name('unsubscribe');
// New route for email open tracking
Route::get('/email/track/open/{token}', [EmailTrackingController::class, 'open'])->name('email.track.open');

require __DIR__ . '/settings.php'; # User settings
require __DIR__ . '/auth.php'; # Auth settings
require __DIR__ . '/admin.php'; # Admin routes
require __DIR__ . '/userRoute.php'; # User routes
require __DIR__ . '/paymentRoute.php'; # Paddle payment routes