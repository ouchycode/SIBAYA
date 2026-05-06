<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EntityController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'role:admin,dosen,mahasiswa'])->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function (): void {
    Route::get('/{entity}', [EntityController::class, 'index']);
    Route::post('/{entity}', [EntityController::class, 'store']);
    Route::put('/{entity}/{id}', [EntityController::class, 'update']);
    Route::delete('/{entity}/{id}', [EntityController::class, 'destroy']);
});

Route::prefix('dosen')->middleware(['auth:sanctum', 'role:dosen'])->group(function (): void {
    Route::get('/{entity}', [EntityController::class, 'index']);
    Route::post('/{entity}', [EntityController::class, 'store']);
    Route::put('/{entity}/{id}', [EntityController::class, 'update']);
    Route::delete('/{entity}/{id}', [EntityController::class, 'destroy']);
});

Route::prefix('mahasiswa')->middleware(['auth:sanctum', 'role:mahasiswa'])->group(function (): void {
    Route::get('/{entity}', [EntityController::class, 'index']);
    Route::post('/{entity}', [EntityController::class, 'store']);
    Route::put('/{entity}/{id}', [EntityController::class, 'update']);
    Route::delete('/{entity}/{id}', [EntityController::class, 'destroy']);
});
