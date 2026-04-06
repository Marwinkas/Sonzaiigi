import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function VerifyCode() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/auth/verify');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <Head title="Код подтверждения" />
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 text-center">
                <h2 className="text-2xl font-bold mb-2">Проверь почту 📧</h2>
                <p className="text-gray-400 mb-6">Мы отправили секретный код. Введи его ниже.</p>

                <form onSubmit={submit} className="space-y-4">
                    <input 
                        type="text" 
                        maxLength="6"
                        placeholder="123456"
                        className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-center text-2xl tracking-[0.5em] focus:ring-2 focus:ring-green-500 outline-none"
                        value={data.code}
                        onChange={e => setData('code', e.target.value)}
                    />
                    {errors.code && <div className="text-red-400 text-sm">{errors.code}</div>}

                    <button disabled={processing} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition">
                        Подтвердить
                    </button>
                </form>
            </div>
        </div>
    );
}