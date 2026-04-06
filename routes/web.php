<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PostController;
use App\Http\Controllers\FriendController;
use Inertia\Inertia;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\BlockController;
use App\Http\Controllers\MuteController;
use App\Http\Controllers\MessengerController;
// Пересылка сообщений
Route::post('/messages/forward', [MessengerController::class, 'forwardMessage'])->name('messages.forward');

// Избранные гифки (добавление/удаление)
Route::post('/messages/toggle-favorite-gif', [MessengerController::class, 'toggleFavoriteGif'])->name('messages.favorite-gif.toggle');
Route::post('/users/{user}/mute', [MuteController::class, 'toggle'])->name('users.mute');
Route::post('/users/{user}/block', [BlockController::class, 'toggle'])->name('users.block');
Route::post('/users/{user}/follow', [FollowController::class, 'toggle'])->name('users.follow');
Route::get('/messages', [MessengerController::class, 'index'])->name('messages');
    Route::get('/messages/{conversation}', [MessengerController::class, 'messages']);
    Route::post('/messages/{conversation}', [MessengerController::class, 'store']);
    Route::post('/messages/start/{user}', [MessengerController::class, 'start'])->name('messages.start');
Route::patch('/messages/{message}', [MessengerController::class, 'update']);
Route::delete('/messages/{message}', [MessengerController::class, 'destroy']);
Route::post('/messages/{message}/pin', [MessengerController::class, 'togglePin']);
Route::get('/messages/{conversation}/context/{message}', [MessengerController::class, 'loadContext']);
Route::get('/messages/{conversation}/more-down', [MessengerController::class, 'loadMoreDown']);
Route::get('/', [PostController::class, 'index'])->name('home');
Route::get('/create', [PostController::class, 'create'])->name('create');
Route::get('/messages/{conversation}/pins', [MessengerController::class, 'getPins']);
Route::get('/friends', [FriendController::class, 'index'])->name('friends.index');
    Route::post('/friends', [FriendController::class, 'store'])->name('friends.store');
    Route::delete('/friends/{friend}', [FriendController::class, 'destroy'])->name('friends.destroy');
Route::post('/friends/{friend}/accept', [FriendController::class, 'accept'])->name('friends.accept');

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
Route::post('/groups/create', [MessengerController::class, 'createGroup'])->name('groups.create');
Route::get('/join/{token}', [MessengerController::class, 'joinGroup'])->name('groups.join');
    // 2. Установка ника
    Route::get('/auth/nickname', [AuthController::class, 'showNicknameForm'])->name('auth.nickname');
    Route::post('/auth/nickname', [AuthController::class, 'saveNickname']);
Route::post('/messages/{message}/react', [MessengerController::class, 'react']);
    Route::get('/settings', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/settings', [ProfileController::class, 'update'])->name('profile.update'); // Используем POST для отправки файлов
    Route::put('/settings/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
    Route::post('/posts', [PostController::class, 'store'])->name('posts.store');
    Route::post('/posts/{post}/like', [PostController::class, 'toggleLike'])->name('posts.like');
    // Выход
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

});
Route::delete('/conversations/{conversation}', [MessengerController::class, 'destroyConversation']);
Route::get('/u/{username}', [ProfileController::class, 'show'])->name('profile.show');
    Route::post('/u/{username}', [ProfileController::class, 'update'])->name('profile.store');
