<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FavoriteGif extends Model
{
    // Разрешаем массовое заполнение всех полей
    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
