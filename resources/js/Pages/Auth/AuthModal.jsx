import React, { useState } from 'react';
import axios from 'axios';

// Настрой базовый URL, если еще нет
axios.defaults.baseURL = 'http://sonzaiigi.art/api'; 
axios.defaults.withCredentials = true;

export default function AuthModal() {
    // Три состояния: 'login' (вход), 'verify' (код), 'nickname' (ник)
    const [step, setStep] = useState('login'); 
    
    // Данные формы
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [username, setUsername] = useState('');
    
    // Ошибки и загрузка
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // 1. ОТПРАВКА ДАННЫХ (Регистрация/Вход)
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Предполагаем, что бэк вернет { status: 'verify_needed' }
            const response = await axios.post('/register', { email, password });
            
            // Сохраняем токен (пока черновой)
            localStorage.setItem('token', response.data.token);
            
            if (response.data.status === 'verify_needed') {
                setStep('verify');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка входа');
        } finally {
            setLoading(false);
        }
    };

    // 2. ОТПРАВКА КОДА
    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/verify-code', { code }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 'nickname_needed') {
                setStep('nickname');
            } else {
                window.location.href = '/profile'; // Успех!
            }
        } catch (err) {
            setError('Неверный код');
        } finally {
            setLoading(false);
        }
    };

    // 3. УСТАНОВКА НИКА
    const handleNickname = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('/set-username', { username }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            window.location.href = '/profile'; // Финиш!
        } catch (err) {
            setError('Этот ник занят или недопустим');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg mt-10">
            <h2 className="text-2xl font-bold mb-4 text-center">
                {step === 'login' && 'Вход в Sonzaiigi'}
                {step === 'verify' && 'Проверка почты'}
                {step === 'nickname' && 'Выбор Ника'}
            </h2>

            {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}

            {/* ЭТАП 1: ВХОД */}
            {step === 'login' && (
                <form onSubmit={handleLogin} className="flex flex-col gap-3">
                    <input 
                        type="email" 
                        placeholder="Email" 
                        className="border p-2 rounded"
                        value={email} onChange={e => setEmail(e.target.value)}
                    />
                    <input 
                        type="password" 
                        placeholder="Пароль" 
                        className="border p-2 rounded"
                        value={password} onChange={e => setPassword(e.target.value)}
                    />
                    <button disabled={loading} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                        {loading ? 'Загрузка...' : 'Продолжить'}
                    </button>
                    
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
                        <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Или</span></div>
                    </div>

                    {/* КНОПКА GOOGLE - Просто ссылка на бэкенд */}
                    <a href="http://localhost/api/auth/google" className="flex items-center justify-center gap-2 border p-2 rounded hover:bg-gray-50">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                        Войти через Google
                    </a>
                </form>
            )}

            {/* ЭТАП 2: КОД */}
            {step === 'verify' && (
                <form onSubmit={handleVerify} className="flex flex-col gap-3">
                    <p className="text-sm text-gray-600">Мы отправили код на {email}</p>
                    <input 
                        type="text" 
                        placeholder="123456" 
                        className="border p-2 rounded text-center text-xl tracking-widest"
                        value={code} onChange={e => setCode(e.target.value)}
                    />
                    <button disabled={loading} className="bg-green-600 text-white p-2 rounded">Подтвердить</button>
                </form>
            )}

            {/* ЭТАП 3: НИКНЕЙМ */}
            {step === 'nickname' && (
                <form onSubmit={handleNickname} className="flex flex-col gap-3">
                    <p className="text-sm text-gray-600">Придумайте уникальный ID для своего творчества</p>
                    <input 
                        type="text" 
                        placeholder="username" 
                        className="border p-2 rounded"
                        value={username} onChange={e => setUsername(e.target.value)}
                    />
                    <button disabled={loading} className="bg-purple-600 text-white p-2 rounded">Завершить</button>
                </form>
            )}
        </div>
    );
}