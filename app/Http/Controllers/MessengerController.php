<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessengerController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $chats = $user->conversations()
            ->with(['users', 'messages' => function ($q) {
                $q->latest()->limit(1);
            }])
            ->withCount('messages')
            ->get()
            ->map(function ($conv) use ($user) {
                $otherUser = $conv->users->where('id', '!=', $user->id)->first();
                if (! $otherUser) {
                    return null;
                }

                $iFollowThem = \DB::table('follows')->where('follower_id', $user->id)->where('followed_id', $otherUser->id)->exists();
                $theyFollowMe = \DB::table('follows')->where('follower_id', $otherUser->id)->where('followed_id', $user->id)->exists();
                $iBlockedThem = \DB::table('blocks')->where('blocker_id', $user->id)->where('blocked_id', $otherUser->id)->exists();
                $theyBlockedMe = \DB::table('blocks')->where('blocker_id', $otherUser->id)->where('blocked_id', $user->id)->exists();

                $canReply = ($iFollowThem && $theyFollowMe) && ! $iBlockedThem && ! $theyBlockedMe;
                $isEmpty = $conv->messages_count === 0;

                if (! $canReply && $isEmpty) {
                    return null;
                }

                $lastMsg = $conv->messages->first();

                return [
                    'id' => $conv->id,
                    'user' => $otherUser->load(['followers', 'following', 'blockers', 'mutedBy']), // <--- Добавь это для модалки!
                    'name' => $otherUser->name,
                    'avatar' => $otherUser->avatar,
                    'lastMessage' => $lastMsg ? $lastMsg->body : 'Нет сообщений',
                    'time' => $lastMsg ? $lastMsg->created_at->format('H:i') : '',
                    'can_reply' => $canReply,
                ];
            })
            ->filter()
            ->values();

        return inertia('Messenger', [
            'initialChats' => $chats,
            'activeChatId' => $request->query('chat'),
        ]);
    }

public function messages(Conversation $conversation, Request $request)
{
    $user = Auth::user();
    $otherUser = $conversation->users->where('id', '!=', $user->id)->first();

    if (!$otherUser) return response()->json(['messages' => [], 'can_reply' => false]);

    $offset = $request->query('offset', 0);
    $limit = ($offset === 0) ? 10 : 19;

    // --- НАСТОЯЩАЯ ПРОВЕРКА ДЛЯ БЛОКИРОВКИ ПОЛЯ ВВОДА ---
    $iFollowThem = \DB::table('follows')->where('follower_id', $user->id)->where('followed_id', $otherUser->id)->exists();
    $theyFollowMe = \DB::table('follows')->where('follower_id', $otherUser->id)->where('followed_id', $user->id)->exists();
    $iBlockedThem = \DB::table('blocks')->where('blocker_id', $user->id)->where('blocked_id', $otherUser->id)->exists();
    $theyBlockedMe = \DB::table('blocks')->where('blocker_id', $otherUser->id)->where('blocked_id', $user->id)->exists();

    $canReply = ($iFollowThem && $theyFollowMe) && !$iBlockedThem && !$theyBlockedMe;
    // -----------------------------------------------------

    $messages = $conversation->messages()
        ->with(['parent.user'])
        ->latest()
        ->skip($offset)
        ->take($limit)
        ->get()
        ->reverse()
        ->values()
        ->map(function($msg) use ($user) {
            $isReplyToMe = $msg->parent && $msg->parent->user_id === $user->id;
            $isMention = str_contains($msg->body ?? '', '@' . $user->name);

            return [
                'id' => $msg->id,
                'senderId' => $msg->user_id,
                'image' => $msg->image ? asset('storage/' . $msg->image) : null,
                'text' => $msg->body,
                'time' => $msg->created_at->format('H:i'),
                'is_pinned' => (bool)$msg->pinned_at,
                'is_mention' => $isMention || $isReplyToMe,
                'reply_to' => ($msg->parent && $msg->parent->user) ? [
                    'name' => $msg->parent->user->name,
                    'text' => $msg->parent->body
                ] : null,
            ];
        });

    return response()->json([
        'messages' => $messages,
        'has_more' => $messages->count() >= $limit,
        'can_reply' => $canReply // ТЕПЕРЬ ТУТ РЕАЛЬНЫЙ СТАТУС, А НЕ true!
    ]);
}

public function store(Request $request, Conversation $conversation)
{
    // Текст теперь nullable, так как можно отправить только картинку
    $request->validate([
        'text' => 'nullable|string',
        'image' => 'nullable|image|max:10240', // до 10мб (хотя мы сожмем во фронте)
        'parent_id' => 'nullable|exists:messages,id'
    ]);

    if (!$request->text && !$request->hasFile('image')) {
        return response()->json(['error' => 'Пустое сообщение'], 422);
    }

    $user = Auth::user();
    $imagePath = null;

    // Сохраняем картинку в storage/app/public/messages
    if ($request->hasFile('image')) {
        $imagePath = $request->file('image')->store('messages', 'public');
    }

    $msg = $conversation->messages()->create([
        'user_id' => $user->id,
        'body' => $request->text ?? '', // Если текста нет, пишем пустую строку
        'image' => $imagePath,
        'parent_id' => $request->parent_id
    ]);

    $msg->load(['parent.user']);

    return response()->json([
        'id' => $msg->id,
        'senderId' => $msg->user_id,
        'text' => $msg->body,
        'image' => $msg->image ? asset('storage/' . $msg->image) : null, // Отдаем URL
        'time' => $msg->created_at->format('H:i'),
        'reply_to' => ($msg->parent && $msg->parent->user) ? [
            'name' => $msg->parent->user->name,
            'text' => $msg->parent->body
        ] : null,
    ]);
}

    public function update(Request $request, $id)
    {
        $message = Message::findOrFail($id);
        if ($message->user_id !== Auth::id()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $request->validate(['text' => 'required|string']);
        $message->update(['body' => $request->text]);

        return response()->json([
            'id' => $message->id,
            'text' => $message->body,

            'senderId' => $message->user_id,
            'time' => $message->created_at->format('H:i'),
        ]);
    }

    public function destroy($id)
    {
        $message = Message::findOrFail($id);
        if ($message->user_id !== Auth::id()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $message->delete();

        return response()->json(['success' => true]);
    }

    public function getPins(Conversation $conversation)
    {
        $pins = $conversation->messages()
            ->whereNotNull('pinned_at')
            ->orderBy('pinned_at', 'desc')
            ->get()
            ->map(function ($msg) {
                return [
                    'id' => $msg->id,
                    'text' => $msg->body,
                    'pinned_at' => $msg->pinned_at,
                ];
            });

        return response()->json($pins);
    }

    public function togglePin($id)
    {
        $message = Message::findOrFail($id);
        $message->update(['pinned_at' => $message->pinned_at ? null : now()]);

        return response()->json(['pinned_at' => $message->pinned_at]);
    }

    public function loadContext(Conversation $conversation, $id)
    {
        $message = Message::findOrFail($id);
        $user = Auth::user();

        $before = $conversation->messages()->with(['parent.user'])->where('id', '<', $message->id)->latest()->take(20)->get();
        $after = $conversation->messages()->with(['parent.user'])->where('id', '>', $message->id)->oldest()->take(20)->get();

        $messages = $before->reverse()->push($message)->concat($after)->map(function ($msg) use ($user) {
            $isReplyToMe = $msg->parent && $msg->parent->user_id === $user->id;
            $isMention = str_contains($msg->body ?? '', '@'.$user->name);

            return [
                'id' => $msg->id,
                'senderId' => $msg->user_id,
                'text' => $msg->body,
                'image' => $msg->image ? asset('storage/' . $msg->image) : null,
                'time' => $msg->created_at->format('H:i'),
                'is_mention' => $isMention || $isReplyToMe,
                'reply_to' => ($msg->parent && $msg->parent->user) ? [
                    'name' => $msg->parent->user->name,
                    'text' => $msg->parent->body,
                ] : null,
                'is_pinned' => (bool) $msg->pinned_at,
            ];
        });

        return response()->json([
            'messages' => $messages->values(),
            'has_more_up' => $before->count() >= 20,
            'has_more_down' => $after->count() >= 20,
        ]);
    }

    public function loadMoreDown(Conversation $conversation, Request $request)
    {
        $user = Auth::user();
        $afterId = $request->query('after_id');

        $messages = $conversation->messages()
            ->with(['parent.user'])
            ->where('id', '>', $afterId)
            ->oldest()
            ->take(19)
            ->get()
            ->map(function ($msg) use ($user) {
                $isReplyToMe = $msg->parent && $msg->parent->user_id === $user->id;
                $isMention = str_contains($msg->body ?? '', '@'.$user->name);

                return [
                    'id' => $msg->id,
                    'senderId' => $msg->user_id,
                    'text' => $msg->body,
                    'image' => $msg->image ? asset('storage/' . $msg->image) : null,
                    'time' => $msg->created_at->format('H:i'),
                    'is_mention' => $isMention || $isReplyToMe,
                    'reply_to' => ($msg->parent && $msg->parent->user) ? [
                        'name' => $msg->parent->user->name,
                        'text' => $msg->parent->body,
                    ] : null,
                    'is_pinned' => (bool) $msg->pinned_at,
                ];
            });

        return response()->json([
            'messages' => $messages,
            'has_more_down' => $messages->count() >= 19,
        ]);
    }

    public function start(User $user)
    {
        $me = Auth::user();
        $conversation = $me->conversations()->whereHas('users', function ($q) use ($user) {
            $q->where('users.id', $user->id);
        })->first();

        if (! $conversation) {
            $conversation = Conversation::create();
            $conversation->users()->attach([$me->id, $user->id]);
        }

        return redirect()->route('messages', ['chat' => $conversation->id]);
    }

    public function destroyConversation(Conversation $conversation)
    {
        $user = Auth::user();

        // Проверяем, состоит ли пользователь в этом чате
        if (! $conversation->users->contains($user->id)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        // МАГИЯ ЗДЕСЬ: Удаляем только сообщения!
        // Саму комнату ($conversation->delete()) и связи пользователей не трогаем.
        $conversation->messages()->delete();

        return response()->json(['success' => true]);
    }


}
