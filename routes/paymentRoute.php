<?php

use App\Http\Controllers\SubscriptionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Laravel\Paddle\Subscription;
use Laravel\Paddle\Transaction;

Route::middleware(['auth', 'verified'])->group(function () {
    // Subscription routes
    Route::get('/subscribe', [SubscriptionController::class, 'subscribe'])->name('subscribe');
    Route::post('/subscription/swap', [SubscriptionController::class, 'swap'])->name('subscription.swap');
    Route::post('/subscription/pause', [SubscriptionController::class, 'pause'])->name('subscription.pause');
    Route::post('/subscription/resume', [SubscriptionController::class, 'resume'])->name('subscription.resume');
    Route::post('/subscription/stop-cancellation', [SubscriptionController::class, 'stopCancellation'])->name('subscription.stop-cancellation');
    Route::get('/download-invoice', function (Request $request) {
        $transactionId = $request->query('transaction_id');
        if (!$transactionId) {
            abort(404, 'Transaction ID is required.');
        }
        $transaction = Transaction::findOrFail($transactionId);

        // Check if the transaction belongs to the authenticated user
        if ($transaction->billable_id !== Auth::user()->id) {
            return abort(404, 'Transaction not found.');
        }

        return $transaction->redirectToInvoicePdf();
    })->name('download-invoice');
    Route::post('/subscription/cancel', [SubscriptionController::class, 'cancel'])->name('subscription.cancel');
    Route::get('/subscription/payment-method', [SubscriptionController::class, 'updatePaymentMethod'])->name('subscription.payment-method');
});
