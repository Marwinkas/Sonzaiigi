<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FollowController extends Controller
{
    public function toggle(User $user)
    {
        $me = Auth::user();

        // Нельзя подписаться на самого себя
        if ($me->id === $user->id) return back();

        // Если уже подписаны — отписываемся (toggle сам всё сделает)
        $me->following()->toggle($user->id);

        return back();
    }
}
