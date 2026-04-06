import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <Head title="Регистрация" />
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
                <h1 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                    Join Sonzaiigi
                </h1>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Email</label>
                        <input 
                            type="email" 
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                        />
                        {errors.email && <div className="text-red-400 text-sm mt-1">{errors.email}</div>}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Пароль</label>
                        <input 
                            type="password" 
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                        />
                        {errors.password && <div className="text-red-400 text-sm mt-1">{errors.password}</div>}
                    </div>

                    <button disabled={processing} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition">
                        Создать аккаунт
                    </button>
                </form>
                
                <div className="mt-4 text-center text-sm text-gray-400">
                    Уже есть аккаунт? <Link href="/login" className="text-blue-400 hover:underline">Войти</Link>
                </div>
            </div>
        </div>
    );
}