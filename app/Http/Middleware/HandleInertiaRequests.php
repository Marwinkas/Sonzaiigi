<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    // ВОТ ЭТО САМЫЙ ВАЖНЫЙ МЕТОД
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'username' => $request->user()->username,
                    'email' => $request->user()->email,
                    // Если аватарки нет, возвращаем null, если есть — полный путь
                    'avatar' => $request->user()->avatar ? '/storage/' . $request->user()->avatar : null,
                ] : null,
            ],
            // Сообщения об успехе/ошибках (например "Пароль обновлен")
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ]);
    }
}