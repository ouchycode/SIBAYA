<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        abort(404);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $login = $validated['email'];

        $user = User::where('email', $login)
            ->orWhere('nim', $login)
            ->orWhere('nip', $login)
            ->first();

        if (!$user) {
            return response()->json([
                'message' => 'Pengguna tidak terdaftar.',
                'error_type' => 'user_not_registered'
            ], 404);
        }

        if (!Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kata sandi yang Anda masukkan salah.'],
            ]);
        }

        $token = $user->createToken('siba-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout berhasil',
        ]);
    }
}
