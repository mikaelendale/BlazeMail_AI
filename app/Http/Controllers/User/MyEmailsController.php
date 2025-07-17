<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\UserSavedEmails;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MyEmailsController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = UserSavedEmails::where('user_id', $user->id);

        // Tone filter
        if ($request->filled('tone') && $request->tone !== 'all') {
            $query->where('tone', $request->tone);
        }

        // Date filter
        if ($request->filled('date') && $request->date !== 'all') {
            switch ($request->date) {
                case 'today':
                    $query->whereDate('created_at', now());
                    break;
                case 'week':
                    $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
                case 'month':
                    $query->whereMonth('created_at', now()->month);
                    break;
                case 'year':
                    $query->whereYear('created_at', now()->year);
                    break;
            }
        }

        $myEmails = $query->orderByDesc('created_at')->paginate(6)->withQueryString();
        // Pass filters back to the frontend
        $filters = [
            'tone' => $request->tone ?? 'all',
            'date' => $request->date ?? 'all',
        ];

        return Inertia::render('user/myemails', [
            'myEmails' => $myEmails,
            'filters' => $filters,
        ]);
    }
    public function delete($id)
    {
        $email = UserSavedEmails::findOrFail($id);
        if ($email->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $email->delete();
        return redirect()->route('myemails')->with('success', 'Email deleted successfully.');
    }
}
