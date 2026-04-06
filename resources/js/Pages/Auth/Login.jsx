import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login'); // Отправляем на обычный маршрут Laravel
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Head title="Вход" />
            
            <div className="bg-white p-8 rounded-xl shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6 text-center">Вход в Sonzaiigi</h1>

                {/* Кнопка Google */}
                <a 
                    href="/auth/google" 
                    className="flex items-center justify-center gap-2 w-full border p-3 rounded-lg mb-6 hover:bg-gray-50 transition"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                    Войти через Google
                </a>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">или почта</span></div>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <input 
                            type="email" 
                            placeholder="Email" 
                            className="w-full border p-2 rounded"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                        />
                        {errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
                    </div>

                    <div>
                        <input 
                            type="password" 
                            placeholder="Пароль" 
                            className="w-full border p-2 rounded"
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                        />
                    </div>

                    <button disabled={processing} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                        Войти
                    </button>
                </form>
            </div>
        </div>
    );
}