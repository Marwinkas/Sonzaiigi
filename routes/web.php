<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PostController;
use Inertia\Inertia;

// Главная
Route::get('/', [PostController::class, 'index'])->name('home');
Route::get('/create', [PostController::class, 'create'])->name('create');
// Гости (только для тех, кто не вошел)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);

    // Google
    Route::get('/auth/google', [AuthController::class, 'redirectToGoogle'])->name('auth.google');
    Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);

Route::get('/register', [AuthController::class, 'showRegister'])->name('register'); // Страница регистрации
    Route::post('/register', [AuthController::class, 'register']); // Обработка
});

// Авторизованные (для установки ника и выхода)
Route::middleware('auth')->group(function () {
    // 1. Подтверждение кода
    Route::get('/auth/verify', [AuthController::class, 'showVerify'])->name('auth.verify');
    Route::post('/auth/verify', [AuthController::class, 'verifyCode']);

    // 2. Установка ника
    Route::get('/auth/nickname', [AuthController::class, 'showNicknameForm'])->name('auth.nickname');
    Route::post('/auth/nickname', [AuthController::class, 'saveNickname']);

    Route::get('/settings', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::post('/settings', [ProfileController::class, 'update'])->name('profile.update'); // Используем POST для отправки файлов
    Route::put('/settings/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
    Route::post('/posts', [PostController::class, 'store'])->name('posts.store');
    Route::post('/posts/{post}/like', [PostController::class, 'toggleLike'])->name('posts.like');
    // Выход
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});

Route::get('/u/{username}', [ProfileController::class, 'show'])->name('profile.show');
