<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Auth;

class BlockController extends Controller
{
    public function toggle(User $user)
    {
        $me = Auth::user();
        if ($me->id === $user->id) return back();

        // Включаем или выключаем блокировку
        $me->blockedUsers()->toggle($user->id);

        // Если мы только что заблокировали человека, стираем подписки в обе стороны
        if ($me->blockedUsers()->where('blocked_id', $user->id)->exists()) {
            $me->following()->detach($user->id);
            $me->followers()->detach($user->id);
        }

        return back();
    }
}
