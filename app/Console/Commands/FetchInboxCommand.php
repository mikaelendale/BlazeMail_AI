<?php

namespace App\Console\Commands;

use App\Jobs\FetchInboxForAllAccountsJob;
use Illuminate\Console\Command;

class FetchInboxCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'inbox:fetch {--account-id= : Specific account ID to sync}';

    /**
     * The console command description.
     */
    protected $description = 'Fetch inbox messages for all connected Gmail accounts';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $accountId = $this->option('account-id');

        if ($accountId) {
            $this->info("Fetching inbox for account ID: {$accountId}");
            // You can implement single account sync here if needed
        } else {
            $this->info('Dispatching inbox fetch job for all accounts...');
            FetchInboxForAllAccountsJob::dispatch();
            $this->info('Inbox fetch job dispatched successfully!');
        }

        return 0;
    }
}
