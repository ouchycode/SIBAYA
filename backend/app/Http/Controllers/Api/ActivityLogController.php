<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'actor_email' => ['required', 'email'],
            'actor_name' => ['nullable', 'string', 'max:255'],
            'actor_role' => ['nullable', 'string', 'max:50'],
            'action' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string'],
            'target_type' => ['nullable', 'string', 'max:100'],
            'target_id' => ['nullable', 'string', 'max:100'],
        ]);

        $log = ActivityLog::create($validated);
        return response()->json($log, 201);
    }
}
