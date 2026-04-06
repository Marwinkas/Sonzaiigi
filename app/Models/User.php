<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'avatar',
        'google_id',
        'verification_code',
    ];
    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    public function posts() {
    return $this->hasMany(Post::class);
}
// Эта функция помогает пользователю найти всех своих друзей
// Уже подтвержденные друзья
// Мои подписки (на кого я подписан)
    public function following()
    {
        return $this->belongsToMany(User::class, 'follows', 'follower_id', 'followed_id');
    }

    // Мои подписчики (кто подписан на меня)
    public function followers()
    {
        return $this->belongsToMany(User::class, 'follows', 'followed_id', 'follower_id');
    }

    // Проверка: подписан ли я на этого человека?
    public function isFollowing(User $user)
    {
        return $this->following()->where('followed_id', $user->id)->exists();
    }

    // Проверка: взаимная ли это подписка? (Мы друзья?)
    public function isMutualFollow(User $user)
    {
        return $this->isFollowing($user) && $user->isFollowing($this);
    }
    // Кого заблокировал я
    public function blockedUsers()
    {
        return $this->belongsToMany(User::class, 'blocks', 'blocker_id', 'blocked_id');
    }

    // Кто заблокировал меня
    public function blockers()
    {
        return $this->belongsToMany(User::class, 'blocks', 'blocked_id', 'blocker_id');
    }
    // Кого замутил я
    public function mutedUsers()
    {
        return $this->belongsToMany(User::class, 'mutes', 'user_id', 'muted_user_id');
    }

    // Кто замутил меня (нужно для отображения статуса на клиенте)
    public function mutedBy()
    {
        return $this->belongsToMany(User::class, 'mutes', 'muted_user_id', 'user_id');
    }
    public function conversations() { return $this->belongsToMany(Conversation::class); }
    public function messages() { return $this->hasMany(Message::class); }
}
