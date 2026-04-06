<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function edit(Request $request)
    {
        // Мы просто рендерим страницу. Данные юзера прилетят через Middleware.
        return Inertia::render('Profile/Edit', [
            'status' => session('status'),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'username' => ['required', 'string', 'max:20', 'regex:/^[a-zA-Z0-9_]+$/', Rule::unique('users')->ignore($user->id)],
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'avatar' => ['nullable', 'image', 'max:5120'], // До 5МБ
        ]);

        $user->fill($request->only('name', 'username', 'email'));

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        // Логика Аватарки
        if ($request->hasFile('avatar')) {
            // Удаляем старую
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            // Сохраняем новую
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = $path;
        }

        $user->save();

        return redirect()->back();
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
        // Ищем пользователя по никнейму. Если нет — 404 ошибка.
        $user = \App\Models\User::where('username', $username)->firstOrFail();

        // Подготавливаем данные для отображения
        // Важно: не отправлять password или email всем подряд, выбираем только нужное
        $publicProfile = [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'avatar' => $user->avatar ? '/storage/' . $user->avatar : null,
            'created_at' => $user->created_at->format('d.m.Y'),
        ];

        return \Inertia\Inertia::render('Profile/Show', [
            'profileUser' => $publicProfile,
        ]);
    }
}