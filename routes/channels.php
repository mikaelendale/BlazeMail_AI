<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
// 🔥 USER-SPECIFIC JOB PROGRESS CHANNEL
Broadcast::channel('job-progress.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
 