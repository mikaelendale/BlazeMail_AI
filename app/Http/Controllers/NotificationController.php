<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Auth::user()->notifications()->latest()->take(20)->get()->map(function ($notification) {
            return [
                'id' => $notification->id,
                'title' => $notification->data['title'] ?? 'Notification',
                'description' => $notification->data['message'] ?? null,
                'timestamp' => $notification->created_at->diffForHumans(),
                'isRead' => $notification->read(),
                'type' => $notification->data['type'] ?? 'system',
                'actionLabel' => $notification->data['actionLabel'] ?? null,
                'actionUrl' => $notification->data['actionUrl'] ?? null,
            ];
        });
        // dd($notifications, Auth::user()->id);

        return inertia('user/notifications', [
            'notifications' => $notifications,
        ]);
    }
    public function markAllAsRead()
    {
        Auth::user()->unreadNotifications->markAsRead();
        return back();
    }
    public function markAsRead($id)
    {
        $notification = Auth::user()->notifications()->find($id);
        if ($notification) {
            $notification->markAsRead();
        }
        return back();
    }
    public function markAsUnread($id)
    {
            $notification = Auth::user()->notifications()->find($id);
            if ($notification) {
                $notification->update(['read_at' => null]);
            }
            return back();
    }
}
