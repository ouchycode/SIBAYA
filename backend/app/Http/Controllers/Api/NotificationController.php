<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = Notification::query();

        if ($request->filled('recipient_email')) {
            $query->where('recipient_email', $request->string('recipient_email'));
        }

        $orderBy = $request->string('order_by')->toString();
        if ($orderBy === '-created_date') {
            $query->orderByDesc('created_at');
        } else {
            $query->orderByDesc('id');
        }

        $limit = (int) $request->input('limit', 20);
        $notifications = $query->limit(max(1, min($limit, 100)))->get();

        return response()->json(
            $notifications->map(function (Notification $item) {
                return [
                    ...$item->toArray(),
                    'created_date' => $item->created_at?->toIso8601String(),
                ];
            })
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'recipient_email' => ['required', 'email'],
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
            'type' => ['nullable', 'string', 'max:100'],
            'is_read' => ['nullable', 'boolean'],
            'link' => ['nullable', 'string', 'max:255'],
        ]);

        $notification = Notification::create([
            ...$validated,
            'type' => $validated['type'] ?? 'system',
            'is_read' => $validated['is_read'] ?? false,
            'link' => $validated['link'] ?? '',
        ]);

        return response()->json($notification, 201);
    }

    public function update(Request $request, Notification $notification)
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'message' => ['sometimes', 'string'],
            'type' => ['sometimes', 'string', 'max:100'],
            'is_read' => ['sometimes', 'boolean'],
            'link' => ['sometimes', 'string', 'max:255'],
        ]);

        $notification->update($validated);
        return response()->json($notification);
    }

    public function destroy(Notification $notification)
    {
        $notification->delete();
        return response()->json(status: 204);
    }
}
