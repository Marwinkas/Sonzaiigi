<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reaction extends Model
{
    // Разрешаем массовое заполнение полей
    protected $fillable = ['message_id', 'user_id', 'emoji'];

    // Связь с сообщением
    public function message()
    {
        return $this->belongsTo(Message::class);
    }

    // Связь с пользователем (кто поставил)
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
