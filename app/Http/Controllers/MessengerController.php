<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Models\FavoriteGif;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class MessengerController extends Controller
{
    // --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ S3 ---
    // Аккуратно достает правильную ссылку на файл из облака
    private function getFileUrl($path) {
        if (!$path) return null;

        // Если это уже полная ссылка (например, внешняя аватарка), возвращаем как есть
        if (str_starts_with($path, 'http')) return $path;

        // Просим систему саму собрать правильную ссылку для нашего S3 диска
        return Storage::disk('s3')->url($path);
    }

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
                $lastMsg = $conv->messages->first();

                // 1. ЕСЛИ ЭТО ГРУППА
                if ($conv->is_group) {
                    return [
                        'id' => $conv->id,
                        'is_group' => true,
                        'name' => $conv->name,
                        'avatar' => $this->getFileUrl($conv->avatar),
                        'invite_token' => $conv->invite_token,
                        'lastMessage' => $lastMsg ? $lastMsg->body : 'Нет сообщений',
                        'time' => $lastMsg ? $lastMsg->created_at->format('H:i') : '',
                        'favoriteGifs' => $this->getSortedGifs($user),
                        'can_reply' => true,
                        'user' => null
                    ];
                }

                // 2. ЕСЛИ ЭТО ЛИЧНЫЙ ЧАТ
                $otherUser = $conv->users->where('id', '!=', $user->id)->first();
                if (!$otherUser) return null;

                $otherUser->load(['followers', 'following', 'blockers', 'mutedBy']);

                // Подставляем красивую ссылку к аватару собеседника
                $otherUser->avatar = $this->getFileUrl($otherUser->avatar);

                $iFollowThem = DB::table('follows')->where('follower_id', $user->id)->where('followed_id', $otherUser->id)->exists();
                $theyFollowMe = DB::table('follows')->where('follower_id', $otherUser->id)->where('followed_id', $user->id)->exists();
                $iBlockedThem = DB::table('blocks')->where('blocker_id', $user->id)->where('blocked_id', $otherUser->id)->exists();
                $theyBlockedMe = DB::table('blocks')->where('blocker_id', $otherUser->id)->where('blocked_id', $user->id)->exists();

                $canReply = ($iFollowThem && $theyFollowMe) && !$iBlockedThem && !$theyBlockedMe;
                $isEmpty = $conv->messages_count === 0;

                if (!$canReply && $isEmpty) return null;

                return [
                    'id' => $conv->id,
                    'is_group' => false,
                    'user' => $otherUser,
                    'name' => $otherUser->name,
                    'avatar' => $otherUser->avatar,
                    'lastMessage' => $lastMsg ? $lastMsg->body : 'Нет сообщений',
                    'time' => $lastMsg ? $lastMsg->created_at->format('H:i') : '',
                    'favoriteGifs' => $this->getSortedGifs($user),
                    'can_reply' => $canReply,
                ];
            })
            ->filter()
            ->values();

        return inertia('Messenger', [
            'initialChats' => $chats,
            'activeChatId' => $request->query('chat'),
            'initialFavoriteGifs' => $this->getSortedGifs($user),
        ]);
    }

    public function messages(Conversation $conversation, Request $request)
    {
        $user = Auth::user();
        $offset = $request->query('offset', 0);
        $limit = ($offset === 0) ? 10 : 19;

        $canReply = true;

        if (!$conversation->is_group) {
            $otherUser = $conversation->users->where('id', '!=', $user->id)->first();
            if (!$otherUser) return response()->json(['messages' => [], 'can_reply' => false]);

            $iFollowThem = DB::table('follows')->where('follower_id', $user->id)->where('followed_id', $otherUser->id)->exists();
            $theyFollowMe = DB::table('follows')->where('follower_id', $otherUser->id)->where('followed_id', $user->id)->exists();
            $iBlockedThem = DB::table('blocks')->where('blocker_id', $user->id)->where('blocked_id', $otherUser->id)->exists();
            $theyBlockedMe = DB::table('blocks')->where('blocker_id', $otherUser->id)->where('blocked_id', $user->id)->exists();

            $canReply = ($iFollowThem && $theyFollowMe) && !$iBlockedThem && !$theyBlockedMe;
        }

        $messages = $conversation->messages()
            ->with(['parent.user', 'reactions', 'user'])
            ->latest()
            ->skip($offset)
            ->take($limit)
            ->get()
            ->reverse()
            ->values()
            ->map(function ($msg) use ($user) {
                return $this->transformMessage($msg, $user);
            });

        return response()->json([
            'messages' => $messages,
            'has_more' => $messages->count() >= $limit,
            'can_reply' => $canReply
        ]);
    }

    // --- ПОЛНЫЙ КОД ЗАГРУЗКИ КАРТИНКИ (ТЕПЕРЬ В S3) ---
    public function store(Request $request, Conversation $conversation)
    {
        $request->validate([
            'text'      => 'nullable|string',
            'image'     => 'nullable|image|max:10240', // Лимит 10 МБ
            'gif_url'   => 'nullable|string',
            'parent_id' => 'nullable|exists:messages,id'
        ]);

        $user = Auth::user();

        if (!$request->filled('text') && !$request->hasFile('image') && !$request->filled('gif_url')) {
            return response()->json(['message' => 'Empty message', 'errors' => ['text' => ['Сообщение пустое']]], 422);
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            // Сохраняем картинку напрямую в облако S3 в папку messages
            $imagePath = $request->file('image')->store('messages', 's3');
        }

        $msg = $conversation->messages()->create([
            'user_id'   => $user->id,
            'body'      => (string)($request->text ?? ''),
            'image'     => $imagePath,
            'gif_url'   => $request->gif_url,
            'parent_id' => $request->parent_id
        ]);

        $msg->load(['parent.user', 'reactions', 'user']);

        return response()->json($this->transformMessage($msg, $user));
    }

    public function react(Request $request, Message $message)
    {
        $request->validate(['emoji' => 'required|string']);
        $user = Auth::user();
        $emoji = $request->emoji;

        $existing = $message->reactions()->where('user_id', $user->id)->first();

        if ($existing) {
            if ($existing->emoji === $emoji) {
                $existing->delete();
            } else {
                $existing->update(['emoji' => $emoji]);
            }
        } else {
            $uniqueCount = $message->reactions()->distinct()->count('emoji');
            $alreadyHasThisEmoji = $message->reactions()->where('emoji', $emoji)->exists();

            if ($uniqueCount >= 4 && !$alreadyHasThisEmoji) {
                return response()->json(['error' => 'Max 4 reactions types per message'], 422);
            }

            $message->reactions()->create([
                'user_id' => $user->id,
                'emoji' => $emoji
            ]);
        }

        return response()->json($this->formatReactions($message->fresh('reactions'), $user->id));
    }

    public function update(Request $request, $id)
    {
        $message = Message::findOrFail($id);
        if ($message->user_id !== Auth::id()) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $request->validate(['text' => 'required|string']);
        $message->update(['body' => $request->text]);

        return response()->json($this->transformMessage($message->fresh(['parent.user', 'reactions', 'user']), Auth::user()));
    }

    public function destroy($id)
    {
        $message = Message::findOrFail($id);
        if ($message->user_id !== Auth::id()) return response()->json(['error' => 'Forbidden'], 403);

        // Если у сообщения была картинка, аккуратно удаляем её из S3
        if ($message->image) {
            Storage::disk('s3')->delete($message->image);
        }

        $message->delete();
        return response()->json(['success' => true]);
    }

    public function getPins(Conversation $conversation)
    {
        $pins = $conversation->messages()->whereNotNull('pinned_at')->orderBy('pinned_at', 'desc')->get()->map(function ($msg) {
            return ['id' => $msg->id, 'text' => $msg->body, 'pinned_at' => $msg->pinned_at];
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

        $before = $conversation->messages()->with(['parent.user', 'reactions', 'user'])->where('id', '<', $message->id)->latest()->take(20)->get();
        $after = $conversation->messages()->with(['parent.user', 'reactions', 'user'])->where('id', '>', $message->id)->oldest()->take(20)->get();

        $messages = $before->reverse()->push($message)->concat($after)->map(function ($msg) use ($user) {
            return $this->transformMessage($msg, $user);
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
            ->with(['parent.user', 'reactions', 'user'])
            ->where('id', '>', $afterId)
            ->oldest()
            ->take(19)
            ->get()
            ->map(function ($msg) use ($user) {
                return $this->transformMessage($msg, $user);
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

        if (!$conversation) {
            $conversation = Conversation::create();
            $conversation->users()->attach([$me->id, $user->id]);
        }
        return redirect()->route('messages', ['chat' => $conversation->id]);
    }

    public function destroyConversation(Conversation $conversation)
    {
        $user = Auth::user();
        if (!$conversation->users->contains($user->id)) return response()->json(['error' => 'Forbidden'], 403);
        $conversation->messages()->delete();
        return response()->json(['success' => true]);
    }

    public function createGroup(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);
        $user = Auth::user();

        $conversation = Conversation::create([
            'is_group' => true,
            'name' => $request->name,
            'invite_token' => Str::random(15)
        ]);

        $conversation->users()->attach($user->id);
        return response()->json(['success' => true, 'chat_id' => $conversation->id]);
    }

    public function joinGroup($token)
    {
        $user = Auth::user();
        if (!$user) return redirect()->route('login');

        $conversation = Conversation::where('invite_token', $token)->firstOrFail();
        if (!$conversation->users->contains($user->id)) {
            $conversation->users()->attach($user->id);
        }
        return redirect()->route('messages', ['chat' => $conversation->id]);
    }

    // --- ПЕРЕСЫЛКА ---
    public function forwardMessage(Request $request) {
        $request->validate([
            'message_id' => 'required|exists:messages,id',
            'conversation_ids' => 'required|array',
            'include_author' => 'required|boolean'
        ]);

        $originalMsg = Message::with('user')->findOrFail($request->message_id);
        $user = Auth::user();
        $authorName = ($request->include_author && $originalMsg->user) ? $originalMsg->user->name : null;

        foreach ($request->conversation_ids as $convId) {
            $conversation = Conversation::findOrFail($convId);
            $conversation->messages()->create([
                'user_id' => $user->id,
                'body' => $originalMsg->body,
                'image' => $originalMsg->image, // Оставляем путь как есть, он уже лежит в S3
                'gif_url' => $originalMsg->gif_url,
                'forwarded_from' => $authorName,
            ]);
        }

        return response()->json(['success' => true]);
    }

    // --- ИЗБРАННЫЕ ГИФКИ ---
    public function toggleFavoriteGif(Request $request) {
        $request->validate(['gif_url' => 'required|string']);
        $user = Auth::user();

        $gif = \App\Models\FavoriteGif::where('user_id', $user->id)
            ->where('gif_url', $request->gif_url)
            ->first();

        if ($gif) {
            $gif->delete();
        } else {
            \App\Models\FavoriteGif::create([
                'user_id' => $user->id,
                'gif_url' => $request->gif_url
            ]);
        }

        return response()->json(['favorite_gifs' => $this->getSortedGifs($user)]);
    }

    private function getSortedGifs($user) {
        return \DB::table('favorite_gifs')
            ->where('user_id', $user->id)
            ->orderBy('updated_at', 'desc')
            ->pluck('gif_url');
    }

    // --- СБОРКА И ОТОБРАЖЕНИЕ СООБЩЕНИЯ (С ПОДДЕРЖКОЙ S3) ---
    private function transformMessage($msg, $user)
    {
        $isReplyToMe = $msg->parent && $msg->parent->user_id === $user->id;
        $isMention = str_contains($msg->body ?? '', '@' . $user->name);

        return [
            'id' => $msg->id,
            'senderId' => $msg->user_id,
            'senderName' => $msg->user ? $msg->user->name : 'Unknown',
            'senderAvatar' => $msg->user ? $this->getFileUrl($msg->user->avatar) : null,
            'reactions' => $this->formatReactions($msg, $user->id),
            'image' => $this->getFileUrl($msg->image), // Используем нашу функцию для получения ссылки
            'text' => $msg->body,
            'gif_url' => $msg->gif_url,
            'time' => $msg->created_at->format('H:i'),
            'is_pinned' => (bool)$msg->pinned_at,
            'is_mention' => $isMention || $isReplyToMe,
            'forwarded_from' => $msg->forwarded_from,
            'reply_to' => ($msg->parent && $msg->parent->user) ? [
                'name' => $msg->parent->user->name,
                'text' => $msg->parent->body
            ] : null,
        ];
    }

    private function formatReactions($message, $userId) {
        if (!$message->relationLoaded('reactions')) {
            $message->load('reactions');
        }

        return $message->reactions
            ->groupBy('emoji')
            ->map(function ($group, $emoji) use ($userId) {
                return [
                    'emoji' => $emoji,
                    'count' => $group->count(),
                    'reacted_by_me' => $group->contains('user_id', $userId)
                ];
            })->values();
    }
}
