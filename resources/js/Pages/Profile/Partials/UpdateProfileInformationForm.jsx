import React, { useRef, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Box, Button, TextField, Avatar, Typography, IconButton } from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';

export default function UpdateProfileInformation({ className = '' }) {
    const user = usePage().props.auth.user;
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(user.avatar || '');

    const { data, setData, post, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
        avatar: null,
        _method: 'patch', // Подсказываем серверу правильный метод
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('avatar', file);
            setPreview(URL.createObjectURL(file)); // Показываем превью сразу
        }
    };

    const submit = (e) => {
        e.preventDefault();
        // Используем post, так как файлы лучше передаются через POST запрос
        post(route('profile.update'));
    };

    return (
        <Box component="section" className={className} sx={{ bgcolor: '#1e293b', p: 4, borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
            <header>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Информация профиля
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
                    Обновите имя, почту и аватарку вашей учетной записи.
                </Typography>
            </header>

            <Box component="form" onSubmit={submit} sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>

                {/* Блок с аватаркой */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            src={preview}
                            sx={{ width: 100, height: 100, bgcolor: '#38bdf8', color: '#0f172a', fontSize: '2.5rem' }}
                        >
                            {user.name[0].toUpperCase()}
                        </Avatar>
                        <IconButton
                            onClick={() => fileInputRef.current.click()}
                            sx={{ position: 'absolute', bottom: -5, right: -5, bgcolor: '#38bdf8', color: '#0f172a', '&:hover': { bgcolor: '#0ea5e9' } }}
                        >
                            <PhotoCamera fontSize="small" />
                        </IconButton>
                        <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        Формат JPG или PNG, до 5 MB.<br/>
                        Картинка будет автоматически обрезана.
                    </Typography>
                </Box>
                {errors.avatar && <Typography color="error" variant="caption">{errors.avatar}</Typography>}

                {/* Поле Имя */}
                <TextField
                    label="Имя (Никнейм)"
                    variant="outlined"
                    fullWidth
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    error={!!errors.name}
                    helperText={errors.name}
                    sx={{ '& .MuiOutlinedInput-root': { color: 'white' }, '& .MuiInputLabel-root': { color: '#94a3b8' }, '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }}
                />

                {/* Поле Почта */}
                <TextField
                    label="Email"
                    type="email"
                    variant="outlined"
                    fullWidth
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    error={!!errors.email}
                    helperText={errors.email}
                    sx={{ '& .MuiOutlinedInput-root': { color: 'white' }, '& .MuiInputLabel-root': { color: '#94a3b8' }, '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={processing}
                        sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', textTransform: 'none', '&:hover': { bgcolor: '#0ea5e9' } }}
                    >
                        Сохранить
                    </Button>
                    {recentlySuccessful && <Typography variant="body2" sx={{ color: '#10b981' }}>Сохранено.</Typography>}
                </Box>
            </Box>
        </Box>
    );
}
