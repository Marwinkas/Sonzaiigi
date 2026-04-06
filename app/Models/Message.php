<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    // Вместо guarded пишем fillable
    protected $fillable = [
        'user_id',
        'conversation_id',
        'body',
        'image',
        'gif_url', // Тот самый филд для гифок
        'parent_id',
        'pinned_at'
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function conversation() { return $this->belongsTo(Conversation::class); }
    public function parent() {
        return $this->belongsTo(Message::class, 'parent_id')->with('user');
    }
public function reactions() {
        return $this->hasMany(Reaction::class);
    }
}
