<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Jobs\SendBulkPersonalizedEmails;
use App\Models\Contact;
use App\Models\EmailAccount;
use App\Models\UserSavedEmails;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class EmailSenderController extends Controller
{
    public function send(Request $request)
    {
        $emailId = $request->input('email_id');
        $user = Auth::user();

        $userEmail = UserSavedEmails::where('id', $emailId)
            ->where('user_id', $user->id)
            ->first();

        if (!$userEmail) {
            abort(404, 'Email not found or does not belong to the authenticated user.');
        }

        $contacts = $user->contacts()->limit(200)->get();

        // Fetch all active and connected email accounts for the user
        $emailAccounts = $user->emailAccounts()
            ->where('status', 'active')
            ->where('is_connected', true)
            ->get();

        return inertia('user/email/email-sender', [
            'userEmail' => $userEmail,
            'email_accounts' => $emailAccounts,
            'contacts' => $contacts,
        ]);
    }

    public function sendBulk(Request $request)
    {
        try {
            Log::info('🚀 Bulk email request received', [
                'user_id' => Auth::id(),
                'request_data' => $request->all()
            ]);

            // Validate the request
            $validated = $request->validate([
                'emailId' => 'required|integer|exists:user_saved_emails,id',
                'recipients' => 'required|array|min:1',
                'recipients.*' => 'required|integer|exists:contacts,id',
                'emailAccount' => 'required|integer|exists:email_accounts,id',
            ]);

            $user = Auth::user();

            // Get the email template
            $userEmail = UserSavedEmails::where('id', $validated['emailId'])
                ->where('user_id', $user->id)
                ->firstOrFail();

            // Get and verify the selected email account
            $emailAccount = EmailAccount::where('id', $validated['emailAccount'])
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->where('is_connected', true)
                ->firstOrFail();

            Log::info('📧 Email template and account found', [
                'email_id' => $userEmail->id,
                'subject' => $userEmail->subject,
                'email_account_id' => $emailAccount->id,
                'email_account_email' => $emailAccount->email
            ]);

            // Check if user has enough credits
            $requiredCredits = count($validated['recipients']);
            $availableCredits = $user->credit_balance ?? 0;

            if ($requiredCredits > $availableCredits) {
                Log::warning('❌ Insufficient credits', [
                    'required' => $requiredCredits,
                    'available' => $availableCredits,
                    'user_id' => $user->id
                ]);

                return back()->withErrors([
                    'credits' => "Insufficient credits. You need {$requiredCredits} credits but only have {$availableCredits}."
                ]);
            }

            // Verify all recipients exist and belong to the user
            $contacts = Contact::whereIn('id', $validated['recipients'])
                ->where('user_id', $user->id)
                ->get();

            Log::info('👥 Contacts verification', [
                'requested_count' => count($validated['recipients']),
                'found_count' => $contacts->count(),
                'contact_ids' => $contacts->pluck('id')->toArray(),
                'contact_emails' => $contacts->pluck('email')->toArray()
            ]);

            if ($contacts->count() !== count($validated['recipients'])) {
                Log::warning('⚠️ Some contacts not found', [
                    'requested' => $validated['recipients'],
                    'found' => $contacts->pluck('id')->toArray()
                ]);

                return back()->withErrors([
                    'recipients' => 'Some selected contacts were not found or do not belong to you.'
                ]);
            }

            // 🔥 GENERATE BATCH ID FOR TRACKING
            $batchId = Str::uuid()->toString();

            Log::info('🚀 Dispatching bulk personalized email job', [
                'user_id' => $user->id,
                'email_id' => $userEmail->id,
                'email_account_id' => $emailAccount->id,
                'recipients_count' => count($validated['recipients']),
                'email_subject' => $userEmail->subject,
                'required_credits' => $requiredCredits,
                'available_credits' => $availableCredits,
                'batch_id' => $batchId
            ]);

            // 🔥 DISPATCH THE JOB WITH BATCH ID
            SendBulkPersonalizedEmails::dispatch(
                $userEmail,
                $validated['recipients'],
                $user->id,
                $emailAccount->id,
                $batchId
            )->onQueue('emails');

            // 🔥 RETURN SUCCESS WITH JOB TRACKER DATA
            return back()->with('success', "🚀 Your personalized emails are being prepared from {$emailAccount->email}.");
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('❌ Bulk email validation failed', [
                'user_id' => Auth::id(),
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            return back()->withErrors($e->errors());
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('❌ Model not found in bulk email dispatch', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'request_data' => $request->all()
            ]);
            return back()->withErrors([
                'general' => 'Selected email template or account not found.'
            ]);
        } catch (\Exception $e) {
            Log::error('💥 Bulk email dispatch failed', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            return back()->withErrors([
                'general' => 'Failed to start email sending process. Please try again.'
            ]);
        }
    }
}
