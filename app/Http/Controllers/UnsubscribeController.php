<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Contact;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class UnsubscribeController extends Controller
{
    /**
     * Handle the unsubscribe request.
     *
     * @param  string  $token
     * @return \Illuminate\Http\Response
     */
    public function __invoke(string $token)
    {
        try {
            $decryptedData = Crypt::decryptString($token);
            $data = json_decode($decryptedData, true);

            $contactId = $data['contact_id'] ?? null;
            $campaignId = $data['campaign_id'] ?? null;

            if (!$contactId) {
                Log::warning('Unsubscribe attempt with missing contact_id', ['token' => $token]);
                return view('unsubscribe.invalid', ['message' => 'Invalid unsubscribe link.']);
            }

            $contact = Contact::find($contactId);

            if (!$contact) {
                Log::warning('Unsubscribe attempt for non-existent contact', ['contact_id' => $contactId]);
                return view('unsubscribe.invalid', ['message' => 'Contact not found.']);
            }

            // Update contact status to 'unsubscribed'
            $contact->status = 'unsubscribed';
            $contact->save();

            Log::info('Contact unsubscribed successfully', [
                'contact_id' => $contact->id,
                'contact_email' => $contact->email,
                'campaign_id' => $campaignId
            ]);

            return view('unsubscribe.success', ['contact' => $contact]);
        } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
            Log::error('Invalid unsubscribe token (decryption failed)', ['token' => $token, 'error' => $e->getMessage()]);
            return view('unsubscribe.invalid', ['message' => 'Invalid unsubscribe link.']);
        } catch (\Exception $e) {
            Log::error('Error during unsubscribe process', ['token' => $token, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return view('unsubscribe.error', ['message' => 'An error occurred during unsubscription. Please try again later.']);
        }
    }
}
