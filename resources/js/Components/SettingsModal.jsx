import React, { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { ThemeProvider } from '@mui/material/styles';
import {
    Dialog, DialogContent, Typography, TextField, Button, Avatar,
    Box, IconButton, Alert, Snackbar, Grid
} from '@mui/material';
import { PhotoCamera, Close, Save, Key, AlternateEmail, Person, Lock } from '@mui/icons-material';
import theme from '../theme';

export default function SettingsModal({ open, onClose }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const [openSnack, setOpenSnack] = useState(false);

    // --- ФОРМА ПРОФИЛЯ ---
    const { data, setData, post, errors, processing } = useForm({
        name: user?.name || '',
        username: user?.username || '',
        email: user?.email || '',
        avatar: null,
        _method: 'patch',
    });

const getFullAvatarUrl = (path) => {
    if (!path) return null;

    // Если это уже полная ссылка или blob, отдаем сразу
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    // 1. Убираем "storage/" или "/storage/" из начала, если они там есть
    // 2. Убираем лишний слэш в самом начале, чтобы не было двойных //
    const cleanPath = path.replace(/^\/?storage\//, '')
        .replace(/^\//, '');

    // Склеиваем с CDN
    return `https://cdn.sonzaiigi.com/${cleanPath}`;
};

    const [avatarPreview, setAvatarPreview] = useState(getFullAvatarUrl(user?.avatar));

    useEffect(() => {
        setAvatarPreview(getFullAvatarUrl(user?.avatar));
    }, [user]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('avatar', file);
            const reader = new FileReader();
            reader.onload = (e) => setAvatarPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const submitProfile = (e) => {
        e.preventDefault();
        post(route('profile.update'), {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setOpenSnack(true),
        });
    };

    // --- ФОРМА ПАРОЛЯ ---
    const {
        data: passData, setData: setPassData, put: putPass,
        errors: passErrors, processing: passProcessing, reset: resetPass
    } = useForm({
        current_password: '', password: '', password_confirmation: '',
    });

    const submitPassword = (e) => {
        e.preventDefault();
        putPass(route('password.update'), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                resetPass();
                setOpenSnack(true);
            },
        });
    };

    if (!user) return null;

    return (
        <ThemeProvider theme={theme}>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="sm" // Делаем окно компактнее, как в мессенджерах
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        bgcolor: '#0f172a', // Глубокий темный фон-подложка
                        border: '1px solid rgba(255,255,255,0.1)',
                        backgroundImage: 'none',
                        maxHeight: '90vh'
                    }
                }}
            >
                {/* Фиксированная шапка */}
                <Box sx={{ display: 'flex', alignItems: 'center', px: 3, py: 2, bgcolor: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', flex: 1 }}>
                        Настройки
                    </Typography>
                    <IconButton onClick={onClose} sx={{ color: '#94a3b8', '&:hover': { color: 'white' } }}>
                        <Close />
                    </IconButton>
                </Box>

                <DialogContent sx={{ p: 0, bgcolor: '#0f172a' }}>

                    {/* --- АВАТАР И СТАТУС (Как в Telegram) --- */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 5, pb: 4, bgcolor: '#1e293b', mb: 1 }}>
                        <Box sx={{ position: 'relative', mb: 2 }}>
                            <Avatar
                                src={avatarPreview}
                                sx={{ width: 120, height: 120, fontSize: 48, bgcolor: '#38bdf8', color: '#0f172a' }}
                            >
                                {user.name?.[0]}
                            </Avatar>
                            <IconButton
                                component="label"
                                sx={{
                                    position: 'absolute', bottom: 0, right: 0,
                                    bgcolor: '#38bdf8', color: '#0f172a',
                                    '&:hover': { bgcolor: '#0ea5e9' },
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                }}
                            >
                                <PhotoCamera fontSize="small" />
                                <input hidden accept="image/*" type="file" onChange={handleAvatarChange} />
                            </IconButton>
                        </Box>
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {data.name || user.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#38bdf8', mt: 0.5 }}>
                            в сети
                        </Typography>
                    </Box>

                    {/* --- АККАУНТ --- */}
                    <Box component="form" onSubmit={submitProfile} sx={{ p: 3, bgcolor: '#1e293b', mb: 1 }}>
                        <Typography sx={{ color: '#38bdf8', fontWeight: 'bold', mb: 3, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                            Аккаунт
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth label="Отображаемое имя" variant="outlined"
                                    value={data.name} onChange={e => setData('name', e.target.value)}
                                    error={!!errors.name} helperText={errors.name}
                                    InputProps={{ startAdornment: <Person sx={{ color: '#64748b', mr: 1 }} /> }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth label="Имя пользователя" variant="outlined"
                                    value={data.username} onChange={e => setData('username', e.target.value)}
                                    error={!!errors.username} helperText={errors.username}
                                    InputProps={{ startAdornment: <Typography sx={{ color: '#64748b', mr: 1.5, fontWeight: 'bold' }}>@</Typography> }}
                                />
                                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 1, ml: 1 }}>
                                    По этому имени (нику) вас смогут найти другие художники.
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth label="Email" variant="outlined"
                                    value={data.email} onChange={e => setData('email', e.target.value)}
                                    error={!!errors.email} helperText={errors.email}
                                    InputProps={{ startAdornment: <AlternateEmail sx={{ color: '#64748b', mr: 1 }} /> }}
                                />
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 3 }}>
                            <Button
                                type="submit" variant="contained" fullWidth
                                disabled={processing} startIcon={<Save />}
                                sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', textTransform: 'none', borderRadius: 2, py: 1.5, '&:hover': { bgcolor: '#0ea5e9' } }}
                            >
                                Сохранить профиль
                            </Button>
                        </Box>
                    </Box>

                    {/* --- БЕЗОПАСНОСТЬ (ПАРОЛЬ) --- */}
                    <Box component="form" onSubmit={submitPassword} sx={{ p: 3, bgcolor: '#1e293b' }}>
                        <Typography sx={{ color: '#38bdf8', fontWeight: 'bold', mb: 3, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                            Безопасность
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth type="password" label="Текущий пароль"
                                    value={passData.current_password} onChange={e => setPassData('current_password', e.target.value)}
                                    error={!!passErrors.current_password} helperText={passErrors.current_password}
                                    InputProps={{ startAdornment: <Lock sx={{ color: '#64748b', mr: 1 }} /> }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth type="password" label="Новый пароль"
                                    value={passData.password} onChange={e => setPassData('password', e.target.value)}
                                    error={!!passErrors.password} helperText={passErrors.password}
                                    InputProps={{ startAdornment: <Key sx={{ color: '#64748b', mr: 1 }} /> }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth type="password" label="Повторите новый пароль"
                                    value={passData.password_confirmation} onChange={e => setPassData('password_confirmation', e.target.value)}
                                    InputProps={{ startAdornment: <Key sx={{ color: '#64748b', mr: 1 }} /> }}
                                />
                            </Grid>
                        </Grid>
                        <Box sx={{ mt: 3 }}>
                            <Button
                                type="submit" variant="outlined" color="error" fullWidth
                                disabled={passProcessing}
                                sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold', py: 1.5 }}
                            >
                                Обновить пароль
                            </Button>
                        </Box>
                    </Box>

                </DialogContent>
            </Dialog>

            <Snackbar open={openSnack} autoHideDuration={4000} onClose={() => setOpenSnack(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity="success" variant="filled" onClose={() => setOpenSnack(false)} sx={{ borderRadius: 3 }}>
                    Изменения успешно сохранены!
                </Alert>
            </Snackbar>
        </ThemeProvider>
    );
}
