import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Nickname() {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/auth/nickname');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Head title="Выбор ника" />
            
            <div className="bg-white p-8 rounded-xl shadow-md w-96">
                <h2 className="text-xl font-bold mb-2">Почти готово!</h2>
                <p className="text-gray-500 mb-6 text-sm">Придумайте уникальный ID для вашего профиля.</p>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <input 
                            type="text" 
                            placeholder="username" 
                            className="w-full border p-2 rounded text-lg"
                            value={data.username}
                            onChange={e => setData('username', e.target.value)}
                        />
                        {errors.username && <div className="text-red-500 text-sm mt-1">{errors.username}</div>}
                    </div>

                    <button disabled={processing} className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700">
                        Завершить регистрацию
                    </button>
                </form>
            </div>
        </div>
    );
}