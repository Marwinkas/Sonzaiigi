<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use App\Http\Requests\ProfileUpdateRequest;
use Intervention\Image\Facades\Image;
use Illuminate\Support\Facades\Auth;
class ProfileController extends Controller
{
    public function edit(Request $request)
    {
        // Мы просто рендерим страницу. Данные юзера прилетят через Middleware.
        return Inertia::render('Profile/Edit', [
            'status' => session('status'),
        ]);
    }

public function update(ProfileUpdateRequest $request)
{
    $user = $request->user();
    $user->fill($request->validated());

    if ($user->isDirty('email')) {
        $user->email_verified_at = null;
    }

    if ($request->hasFile('avatar')) {
        $file = $request->file('avatar');
        $filename = uniqid();

        // Создаем директорию, если её нет
        if (!Storage::disk('public')->exists('avatars')) {
            Storage::disk('public')->makeDirectory('avatars');
        }

        // 1. Создаем оригинал, обрезанный в квадрат
        $img = Image::make($file);
        $size = min($img->width(), $img->height());
        $img->fit($size, $size); // Обрезает по центру до квадрата

        // Сохраняем оригинал (для превью)
        $img->save(Storage::disk('public')->path("avatars/full_{$filename}.jpg"), 90);

        // 2. Делаем миниатюру 256x256
        $img->resize(256, 256);
        $img->save(Storage::disk('public')->path("avatars/thumb_{$filename}.jpg"), 80);

        // Удаляем старые файлы, чтобы не занимать место в WSL
        if ($user->avatar) {
            $oldThumb = str_replace('/storage/', '', $user->avatar);
            $oldFull = str_replace('thumb_', 'full_', $oldThumb);
            Storage::disk('public')->delete([$oldThumb, $oldFull]);
        }

        $user->avatar = "avatars/thumb_{$filename}.jpg";
    }

    $user->save();

    return redirect()->back(); // Возвращаемся назад с обновленными данными
}

    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'min:8', 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back();
    }
public function show($username)
    {
        // Ищем пользователя только по никнейму (БЕЗ массивных связей with!)
        $user = \App\Models\User::where('username', $username)->firstOrFail();

        $interactions = [
            'isFollowing' => false,
            'isFollowedByThem' => false,
            'isBlocking' => false,
            'isMuted' => false,
        ];

        if ($viewer = Auth::user()) {
            // Защита: Если владелец профиля заблокировал нас -> 404
            if ($user->blockedUsers()->where('blocked_id', $viewer->id)->exists()) {
                abort(404);
            }

            // Быстро проверяем все статусы (это занимает миллисекунды)
            $interactions['isFollowing'] = $viewer->following()->where('followed_id', $user->id)->exists();
            $interactions['isFollowedByThem'] = $viewer->followers()->where('follower_id', $user->id)->exists();
            $interactions['isBlocking'] = $viewer->blockedUsers()->where('blocked_id', $user->id)->exists();
            $interactions['isMuted'] = $viewer->mutedUsers()->where('muted_user_id', $user->id)->exists();
        }

        return \Inertia\Inertia::render('Profile/Show', [
            'profileUser' => $user,
            'interactions' => $interactions, // Передаем готовые ответы в React!
        ]);
    }
}
