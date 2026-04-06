<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $fillable = ['is_group', 'name', 'avatar', 'invite_token'];
    protected $guarded = [];

    // Кто состоит в чате
    public function users() { return $this->belongsToMany(User::class); }

    // Сообщения внутри чата
    public function messages() { return $this->hasMany(Message::class); }
}
