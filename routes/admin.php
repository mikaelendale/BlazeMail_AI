<?php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\AppSettingController;
use App\Http\Controllers\Admin\BlogDashboardController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CommentController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PostController;
use App\Http\Controllers\Admin\TagController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified', 'role:admin'])->group(function () {
    Route::get('admin', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('users', [DashboardController::class, 'users'])->name('admin.users');
    Route::get('users/{id}', [DashboardController::class, 'show'])->name('admin.users.show');
    Route::get('email-monitor', [DashboardController::class, 'emailMonitor'])->name('admin.email-monitor');
    Route::get('email-monitor/{id}', [DashboardController::class, 'emailMonitor'])->name('admin.email-monitor.view');
    Route::delete('email-monitor/{id}/delete', [DashboardController::class, 'emailMonitorDelete'])->name('admin.email-monitor.delete');
    Route::get('billing-logs', function () {
        return Inertia::render('admin/billing-logs');
    })->name('admin.billing-logs');
    Route::get('settings/app', [AppSettingController::class, 'index'])->name('admin.app-settings');
    Route::post('settings/app', [AppSettingController::class, 'store'])->name('admin.app-settings.store');

    // Admin Routes
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/blog', [BlogDashboardController::class, 'index'])->name('blog.dashboard');

        // Posts - Complete CRUD
        Route::get('/posts', [PostController::class, 'index'])->name('posts.index');
        Route::get('/posts/create', [PostController::class, 'create'])->name('posts.create');
        Route::post('/posts', [PostController::class, 'store'])->name('posts.store');
        Route::get('/posts/{post}', [PostController::class, 'show'])->name('posts.show');
        Route::get('/posts/{post}/edit', [PostController::class, 'edit'])->name('posts.edit');
        Route::put('/posts/{post}', [PostController::class, 'update'])->name('posts.update');
        Route::delete('/posts/{post}', [PostController::class, 'destroy'])->name('posts.destroy');

        // Categories (Admin only)
        Route::resource('categories', CategoryController::class)->except(['show', 'create', 'edit']);

        // Tags (Admin only)
        Route::resource('tags', TagController::class)->except(['show', 'create', 'edit']);

        // Comments
        Route::resource('comments', CommentController::class)->only(['index', 'update', 'destroy']);

        // Analytics
        Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');
    });
});
