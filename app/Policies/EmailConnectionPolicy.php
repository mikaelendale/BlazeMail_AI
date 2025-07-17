<?php

namespace App\Policies;

use App\Models\EmailConnection;
use App\Models\User;

class EmailConnectionPolicy
{
    public function view(User $user, EmailConnection $connection): bool
    {
        return $user->id === $connection->user_id;
    }

    public function delete(User $user, EmailConnection $connection): bool
    {
        return $user->id === $connection->user_id;
    }
}
