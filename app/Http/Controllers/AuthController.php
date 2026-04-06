<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Laravel\Socialite\Facades\Socialite;
use Inertia\Inertia;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    // ---------------------------------------------------------------------
    // СТРАНИЦЫ (INERTIA)
    // ---------------------------------------------------------------------

    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    public function showRegister()
    {
        return Inertia::render('Auth/Register');
    }

    // ---------------------------------------------------------------------
    // 1. GOOGLE AUTH
    // ---------------------------------------------------------------------

    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            // Ищем пользователя по email (чтобы объединить аккаунты, если он уже есть)
            // Или создаем нового
            $user = User::updateOrCreate(
                ['email' => $googleUser->email], // Поиск по email
                [
                    'name' => $googleUser->name,
                    'google_id' => $googleUser->id,
                    'email_verified_at' => now(), // Google доверяем
                    'password' => null, // При входе через соцсеть пароль не нужен
                ]
            );

            Auth::login($user);

            // Если username еще не задан (новый юзер) — отправляем выбирать ник
            if (!$user->username) {
                return redirect()->route('auth.nickname');
            }

            return redirect()->route('home');

        } catch (\Exception $e) {
            // Логируем ошибку для себя, пользователю показываем редирект
            // \Log::error($e->getMessage()); 
            return redirect()->route('login')->with('error', 'Ошибка входа через Google');
        }
    }

    // ---------------------------------------------------------------------
    // 2. EMAIL РЕГИСТРАЦИЯ
    // ---------------------------------------------------------------------

    public function register(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
        ]);

        $code = rand(100000, 999999);

        // Чтобы не было ошибки "Field 'name' doesn't have a default value",
        // берем имя из части email до собачки (например, alex из alex@mail.ru)
        $tempName = Str::before($request->email, '@');

        $user = User::create([
            'name' => $tempName, 
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'verification_code' => $code,
            // username пока null
        ]);

        Auth::login($user);

        // Отправка письма
        try {
            // Лучше вынести в Mailable класс, но пока оставим так
            Mail::raw("Твой код подтверждения Sonzaiigi: $code", function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('Подтверждение регистрации');
            });
        } catch (\Exception $e) {
            dd($e->getMessage()); // <--- Это покажет ошибку на экране
        }

        return redirect()->route('auth.verify');
    }

    // ---------------------------------------------------------------------
    // 3. ПОДТВЕРЖДЕНИЕ КОДА
    // ---------------------------------------------------------------------

    public function showVerify()
    {
        // Если уже подтвержден — сразу к нику
        if (Auth::user()->email_verified_at) {
            return redirect()->route('auth.nickname');
        }
        return Inertia::render('Auth/VerifyCode');
    }

    public function verifyCode(Request $request)
    {
        $request->validate(['code' => 'required|numeric']);
        
        $user = Auth::user();

        // Проверка кода
        if ($user->verification_code == $request->code) {
            $user->email_verified_at = now();
            $user->verification_code = null; // Сбрасываем код после использования
            $user->save();
            
            return redirect()->route('auth.nickname');
        }

        return back()->withErrors(['code' => 'Неверный код подтверждения']);
    }

    // ---------------------------------------------------------------------
    // 4. ВЫБОР НИКНЕЙМА (USERNAME)
    // ---------------------------------------------------------------------

    public function showNicknameForm()
    {
        // Если ник уже есть — домой
        if (Auth::user()->username) {
            return redirect()->route('home');
        }
        return Inertia::render('Auth/Nickname');
    }

    public function saveNickname(Request $request)
    {
        $request->validate([
            // regex проверяет, что только латиница, цифры и подчеркивание
            'username' => 'required|string|min:3|max:20|unique:users,username|regex:/^[a-zA-Z0-9_]+$/'
        ]);

        $user = Auth::user();
        $user->username = $request->username;
        $user->save();

        return redirect()->route('home');
    }

    // ---------------------------------------------------------------------
    // 5. ВЫХОД
    // ---------------------------------------------------------------------

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }

    public function login(Request $request)
    {
        // 1. Валидация входных данных
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // 2. Попытка авторизации
        // Auth::attempt сам хеширует пароль и сверяет с базой
        // $request->boolean('remember') — если у тебя есть чекбокс "Запомнить меня"
        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            
            // 3. Фиксация сессии (защита)
            $request->session()->regenerate();

            $user = Auth::user();

            // 4. Сценарии редиректа (бизнес-логика)

            // Если почта не подтверждена -> на ввод кода
            if (!$user->email_verified_at) {
                return redirect()->route('auth.verify');
            }

            // Если нет никнейма -> на выбор никнейма
            if (!$user->username) {
                return redirect()->route('auth.nickname');
            }

            // Всё отлично -> на главную (или туда, куда он хотел зайти)
            return redirect()->intended(route('home'));
        }

        // 5. Если пароль неверный -> возвращаем ошибку
        return back()->withErrors([
            'email' => 'Неверный email или пароль.',
        ])->onlyInput('email');
    }
}