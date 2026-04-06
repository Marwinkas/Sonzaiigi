<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Auth;

class MuteController extends Controller
{
    public function toggle(User $user)
    {
        $me = Auth::user();
        if ($me->id === $user->id) return back();

        // Включаем или выключаем мут
        $me->mutedUsers()->toggle($user->id);

        return back();
    }
}
