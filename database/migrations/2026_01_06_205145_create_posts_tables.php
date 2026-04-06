<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
{
    // Таблица постов
    Schema::create('posts', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->string('title');
        $table->text('description')->nullable();
        $table->timestamps();
    });

    // Таблица картинок (отдельно, чтобы было много и можно сортировать)
    Schema::create('post_images', function (Blueprint $table) {
        $table->id();
        $table->foreignId('post_id')->constrained('posts')->onDelete('cascade');
        $table->string('path');
        $table->integer('sort_order')->default(0); // Для порядка сортировки
        $table->timestamps();
    });

    // Таблица лайков (Связь Многие-ко-Многим)
    Schema::create('post_user_likes', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->foreignId('post_id')->constrained()->onDelete('cascade');
        $table->unique(['user_id', 'post_id']); // Один юзер - один лайк на пост
    });
}

public function down(): void
{
    Schema::dropIfExists('post_user_likes');
    Schema::dropIfExists('post_images');
    Schema::dropIfExists('posts');
}
};
