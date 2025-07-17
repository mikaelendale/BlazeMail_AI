<?php

namespace App\Console\Commands;

use App\Services\CreditService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RefillMonthlyCredits extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'credits:refill-monthly';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Refills monthly credits for users and expires old free credits.';

    public function __construct(
        private CreditService $creditService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting monthly credit refills and expirations...');
        Log::info('Starting monthly credit refills and expirations command.');

        try {
            $this->creditService->processMonthlyRefillsAndExpirations();
            $this->info('Monthly credit refills and expirations completed successfully.');
            Log::info('Monthly credit refills and expirations command completed successfully.');
        } catch (\Exception $e) {
            $this->error('An error occurred: ' . $e->getMessage());
            Log::error('Error in monthly credit refills command: ' . $e->getMessage(), ['exception' => $e]);
        }

        return Command::SUCCESS;
    }
}
