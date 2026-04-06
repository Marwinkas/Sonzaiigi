<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Intervention\Image\Facades\Image;

class ProfileController extends Controller
{
    // Теперь ТОЛЬКО твой CDN. Без вариантов.
    private function getCdnUrl() {
        return rtrim(env('AWS_URL', asset('storage')), '/');
    }


    public function show($username)
    {
        $user = \App\Models\User::where('username', $username)->firstOrFail();
        $cdn = $this->getCdnUrl();

        
        return Inertia::render('Profile/Show', [
            'profileUser' => $user,
            'interactions' => [
                'isFollowing' => Auth::user() ? Auth::user()->following()->where('followed_id', $user->id)->exists() : false,
                'isFollowedByThem' => Auth::user() ? Auth::user()->followers()->where('follower_id', $user->id)->exists() : false,
                'isBlocking' => Auth::user() ? Auth::user()->blockedUsers()->where('blocked_id', $user->id)->exists() : false,
                'isMuted' => Auth::user() ? Auth::user()->mutedUsers()->where('muted_user_id', $user->id)->exists() : false,
            ],
        ]);
    }

public function update(ProfileUpdateRequest $request)
{
    $user = $request->user();
    $user->fill($request->validated());

    if ($request->hasFile('avatar')) {
        $file = $request->file('avatar');
        $filename = uniqid();

        $img = Image::make($file);
        $size = min($img->width(), $img->height());
        $thumbnail = $img->fit($size, $size)->resize(256, 256)->encode('jpg', 80);

        // ВАЖНО: сохраняем в папку avatars БЕЗ приписки storage
        $path = "avatars/thumb_{$filename}.jpg";

        // Загружаем на S3
        Storage::disk('s3')->put($path, (string) $thumbnail);

        // В базу пишем чистый путь: avatars/thumb_...
        $user->avatar = $path;
    }

    $user->save();
    return redirect()->back();
}
}
