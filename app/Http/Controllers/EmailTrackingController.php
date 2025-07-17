<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use App\Models\CampaignExecution;
use App\Models\Campaign;

class EmailTrackingController extends Controller
{
    /**
     * Track email opens.
     */
    public function open(Request $request, string $token)
    {
        try {
            $data = Crypt::decrypt($token);

            $contactId = $data['contact_id'] ?? null;
            $campaignId = $data['campaign_id'] ?? null;
            $timestamp = $data['timestamp'] ?? null;

            if (!$contactId || !$campaignId) {
                Log::warning('⚠️ Invalid tracking token: Missing contact_id or campaign_id', ['token' => $token]);
                return response()->noContent(400); // Bad Request
            }

            // Find the latest campaign execution for this contact and campaign
            $execution = CampaignExecution::where('campaign_id', $campaignId)
                ->where('recipient_data->>contact_id', $contactId)
                ->latest()
                ->first();

            if ($execution && $execution->status !== 'opened') {
                $execution->update([
                    'status' => 'opened',
                    'opened_at' => now(),
                    'execution_log' => array_merge($execution->execution_log ?? [], ['status' => 'opened', 'opened_at' => now()]),
                ]);
                Log::info('✅ Email opened tracked', [
                    'campaign_id' => $campaignId,
                    'contact_id' => $contactId,
                    'execution_id' => $execution->id,
                ]);
            } else if (!$execution) {
                Log::warning('⚠️ No matching campaign execution found for tracking', [
                    'campaign_id' => $campaignId,
                    'contact_id' => $contactId,
                    'token' => $token
                ]);
            } else {
                Log::info('ℹ️ Email already marked as opened', [
                    'campaign_id' => $campaignId,
                    'contact_id' => $contactId,
                    'execution_id' => $execution->id,
                ]);
            }

            // Return a 1x1 transparent GIF
            $pixel = base64_decode('R0lGODlhAQABAJAAAP8AAAAAACH5BAUQAAAALAAAAAABAAEAAAICBAEAOw==');
            return response($pixel)->header('Content-Type', 'image/gif');
        } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
            Log::error('❌ Invalid tracking token (decryption failed)', ['token' => $token, 'error' => $e->getMessage()]);
            return response()->noContent(400); // Bad Request
        } catch (\Exception $e) {
            Log::error('❌ Error tracking email open', ['token' => $token, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->noContent(500); // Internal Server Error
        }
    }
}
