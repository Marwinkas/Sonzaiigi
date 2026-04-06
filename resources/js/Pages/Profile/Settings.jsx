import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function Edit({ auth }) {
    const user = auth.user;
    const fullAvatar = user.avatar ? user.avatar.replace('thumb_', 'full_') : null;
    // Форма профиля
    const { data, setData, post, errors, processing } = useForm({
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: null,
        _method: 'POST', // Трюк для отправки файлов в Laravel через Inertia
    });

    // Форма пароля
    const {
        data: passData,
        setData: setPassData,
        put: putPass,
        errors: passErrors,
        processing: passProcessing,
        reset: resetPass
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [avatarPreview, setAvatarPreview] = useState(user.avatar);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        setData('avatar', file);

        // Создаем превью локально
        const reader = new FileReader();
        reader.onload = (e) => setAvatarPreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const submitProfile = (e) => {
        e.preventDefault();
        post(route('profile.update'));
    };

    const submitPassword = (e) => {
        e.preventDefault();
        putPass(route('profile.password'), {
            onSuccess: () => resetPass(),
        });
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12">
            <Head title="Настройки профиля" />

            <div className="max-w-4xl mx-auto space-y-12">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
                    Настройки профиля
                </h1>

                {/* Секция 1: Основная информация */}
                <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl backdrop-blur-sm">
                    <h2 className="text-xl font-semibold mb-6">Публичный профиль</h2>

                    <form onSubmit={submitProfile} className="space-y-6">
                        {/* Аватар */}
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-gray-800 overflow-hidden border-2 border-gray-700 relative group">
                                {fullAvatar ? (
                                    <img src={fullAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-2xl font-bold text-gray-500">
                                        {user.name[0]}
                                    </div>
                                )}
                                {/* Оверлей для смены */}
                                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                                    <span className="text-xs font-bold">Изменить</span>
                                    <input type="file" className="hidden" onChange={handleAvatarChange} />
                                </label>
                            </div>
                            <div className="text-sm text-gray-400">
                                <p>Рекомендуется квадратное изображение.</p>
                                <p>JPG, PNG до 2MB.</p>
                                {errors.avatar && <p className="text-red-500 mt-1">{errors.avatar}</p>}
                            </div>
                        </div>

                        {/* Поля */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Отображаемое имя</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Никнейм (@username)</label>
                                <input
                                    type="text"
                                    value={data.username}
                                    onChange={e => setData('username', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                />
                                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                disabled={processing}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold transition disabled:opacity-50"
                            >
                                Сохранить изменения
                            </button>
                        </div>
                    </form>
                </div>

                {/* Секция 2: Безопасность */}
                <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl backdrop-blur-sm">
                    <h2 className="text-xl font-semibold mb-6">Смена пароля</h2>

                    <form onSubmit={submitPassword} className="space-y-6 max-w-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Текущий пароль</label>
                            <input
                                type="password"
                                value={passData.current_password}
                                onChange={e => setPassData('current_password', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            />
                            {passErrors.current_password && <p className="text-red-500 text-sm mt-1">{passErrors.current_password}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Новый пароль</label>
                            <input
                                type="password"
                                value={passData.password}
                                onChange={e => setPassData('password', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            />
                            {passErrors.password && <p className="text-red-500 text-sm mt-1">{passErrors.password}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Подтверждение нового пароля</label>
                            <input
                                type="password"
                                value={passData.password_confirmation}
                                onChange={e => setPassData('password_confirmation', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                disabled={passProcessing}
                                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition disabled:opacity-50"
                            >
                                Обновить пароль
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
