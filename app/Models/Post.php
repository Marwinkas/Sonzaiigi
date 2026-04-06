<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $fillable = ['user_id', 'title', 'description'];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function images() {
        return $this->hasMany(PostImage::class)->orderBy('sort_order');
    }

    public function likes() {
        return $this->belongsToMany(User::class, 'post_user_likes');
    }
    
    // Атрибут: Лайкнул ли текущий юзер?
    protected $appends = ['is_liked_by_me'];

    public function getIsLikedByMeAttribute()
    {
        // auth('web') нужен, чтобы работало и в api, и в web
        return auth('web')->check() 
            ? $this->likes()->where('user_id', auth('web')->id())->exists() 
            : false;
    }
}