<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostImage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
class PostController extends Controller
{
    // Главная страница с постами
    public function index()
    {
        $posts = Post::with(['user', 'images'])
            ->withCount('likes')
            ->latest()
            ->paginate(10); // Пагинация по 10 штук

        return Inertia::render('Home', [
            'posts' => $posts
        ]);
    }
    public function create()
    {

        return Inertia::render('CreatePost', [
        ]);
    }
    // Создание поста
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'images' => 'required|array|min:1',
            'images.*' => 'image|max:10240',
        ]);

        DB::transaction(function () use ($request) {
            $post = $request->user()->posts()->create([
                'title' => $request->title,
                'description' => $request->description,
            ]);

            foreach ($request->file('images') as $index => $file) {
                // 1. УБИРАЕМ 'public'. Теперь он возьмет диск 's3' из твоего .env
                $path = $file->store('posts');

                // 2. Генерируем правильную ссылку через драйвер (он сам подставит https://cdn...)
                // Вместо ручного '/storage/' . $path
                $fullUrl = Storage::url($path);

                PostImage::create([
                    'post_id' => $post->id,
                    'path' => $fullUrl, // В базу запишется https://cdn.sonzaiigi.com/artworks/posts/xyz.jpg
                    'sort_order' => $index,
                ]);
            }
        });

        return redirect()->back();
    }

    // Лайк / Дизлайк
    public function toggleLike(Post $post, Request $request)
    {
        $post->likes()->toggle($request->user()->id);
        return back();
    }
}
