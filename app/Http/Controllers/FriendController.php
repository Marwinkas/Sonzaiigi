<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FriendController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $friends = $user->friends; // Мои друзья
        $requests = $user->friendRequests; // Кто просится в друзья
        $pending = $user->pendingFriends; // Кому я отправил заявку

        // Собираем всех, с кем мы уже как-то связаны, чтобы не показывать их в поиске
        $excludedIds = collect([$user->id])
            ->merge($friends->pluck('id'))
            ->merge($requests->pluck('id'))
            ->merge($pending->pluck('id'));

        $otherUsers = User::whereNotIn('id', $excludedIds)->get();

        return Inertia::render('Friends', [
            'friends' => $friends,
            'requests' => $requests,
            'otherUsers' => $otherUsers,
        ]);
    }

    // Отправляем заявку
    public function store(Request $request)
    {
        $request->validate(['friend_id' => 'required|exists:users,id']);
        $user = Auth::user();

        // Если человек уже отправлял нам заявку, а мы тоже нажали "Добавить",
        // то мы просто принимаем его заявку
        $existingRequest = DB::table('friendships')
            ->where('user_id', $request->friend_id)
            ->where('friend_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($existingRequest) {
            $friend = User::find($request->friend_id);
            return $this->accept($friend);
        }

        // Иначе просто создаем новую заявку со статусом "ожидает" (pending)
        DB::table('friendships')->updateOrInsert(
            ['user_id' => $user->id, 'friend_id' => $request->friend_id],
            ['status' => 'pending']
        );

        return redirect()->back();
    }

    // Принимаем заявку
    public function accept(User $friend)
    {
        $user = Auth::user();

        // 1. Говорим, что заявка от друга к нам теперь принята
        DB::table('friendships')
            ->where('user_id', $friend->id)
            ->where('friend_id', $user->id)
            ->update(['status' => 'accepted']);

        // 2. Создаем такую же связь от нас к другу, чтобы дружба была взаимной
        DB::table('friendships')->updateOrInsert(
            ['user_id' => $user->id, 'friend_id' => $friend->id],
            ['status' => 'accepted']
        );

        return redirect()->back();
    }

    // Удаляем из друзей ИЛИ отклоняем заявку
    public function destroy(User $friend)
    {
        $user = Auth::user();

        // Стираем любые связи между нами и этим человеком в обе стороны
        DB::table('friendships')
            ->where(function($query) use ($user, $friend) {
                $query->where('user_id', $user->id)->where('friend_id', $friend->id);
            })
            ->orWhere(function($query) use ($user, $friend) {
                $query->where('user_id', $friend->id)->where('friend_id', $user->id);
            })
            ->delete();

        return redirect()->back();
    }
}
