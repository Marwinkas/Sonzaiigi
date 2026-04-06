import React, { useState } from 'react';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import { ThemeProvider } from '@mui/material/styles';
import {
    Container, Grid, Paper, Typography, TextField, Button, Avatar,
    Box, Tabs, Tab, IconButton, Alert, Snackbar, Divider, CircularProgress
} from '@mui/material';
import { PhotoCamera, ArrowBack, Save, Lock, Person } from '@mui/icons-material';
import theme from '../../theme'; // Импорт нашей темы

export default function Edit() {
    const { auth, flash } = usePage().props;
    const user = auth?.user;

    // Состояние вкладок (0 - Профиль, 1 - Безопасность)
    const [tabValue, setTabValue] = useState(0);
    const [openSnack, setOpenSnack] = useState(false);

    if (!user) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    // --- ФОРМА ПРОФИЛЯ ---
    const { data, setData, post, errors, processing } = useForm({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        avatar: null,
        _method: 'patch',
    });

    const [avatarPreview, setAvatarPreview] = useState(user.avatar);

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
        forceFormData: true, // Принудительно используем FormData
        preserveScroll: true,
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
        putPass(route('profile.password'), {
            preserveScroll: true,
            onSuccess: () => {
                resetPass();
                setOpenSnack(true);
            },
        });
    };

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 4, pb: 8 }}>
                <Head title="Настройки" />
                <Container maxWidth="md">

                    {/* Хедер страницы */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                        <IconButton component={Link} href="/" sx={{ mr: 2, color: 'text.secondary' }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h4" sx={{
                            background: 'linear-gradient(45deg, #ec4899 30%, #a855f7 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            Настройки аккаунта
                        </Typography>
                    </Box>

                    <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Tabs
                            value={tabValue}
                            onChange={(e, v) => setTabValue(v)}
                            textColor="primary"
                            indicatorColor="primary"
                            variant="fullWidth"
                            sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}
                        >
                            <Tab icon={<Person />} label="Профиль" iconPosition="start" />
                            <Tab icon={<Lock />} label="Безопасность" iconPosition="start" />
                        </Tabs>

                        {/* ВКЛАДКА 1: ПРОФИЛЬ */}
                        {tabValue === 0 && (
                            <Box component="form" onSubmit={submitProfile} sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                                    <Box sx={{ position: 'relative' }}>
                                        <Avatar
                                            src={avatarPreview}
                                            sx={{ width: 100, height: 100, fontSize: 40, bgcolor: 'primary.main' }}
                                        >
                                            {user.name?.[0]}
                                        </Avatar>
                                        <IconButton
                                            component="label"
                                            sx={{
                                                position: 'absolute', bottom: -5, right: -5,
                                                bgcolor: 'background.paper', border: '1px solid #333'
                                            }}
                                        >
                                            <PhotoCamera color="primary" />
                                            <input hidden accept="image/*" type="file" onChange={handleAvatarChange} />
                                        </IconButton>
                                    </Box>
                                    <Box>
                                        <Typography variant="h6">Фото профиля</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            PNG, JPG до 5MB
                                        </Typography>
                                        {errors.avatar && <Typography color="error" variant="caption">{errors.avatar}</Typography>}
                                    </Box>
                                </Box>

                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth label="Отображаемое имя" variant="outlined"
                                            value={data.name} onChange={e => setData('name', e.target.value)}
                                            error={!!errors.name} helperText={errors.name}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth label="Никнейм" variant="outlined"
                                            value={data.username} onChange={e => setData('username', e.target.value)}
                                            error={!!errors.username} helperText={errors.username}
                                            InputProps={{ startAdornment: <Typography color="text.secondary" sx={{ mr: 0.5 }}>@</Typography> }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth label="Email" variant="outlined"
                                            value={data.email} onChange={e => setData('email', e.target.value)}
                                            error={!!errors.email} helperText={errors.email}
                                        />
                                    </Grid>
                                </Grid>

                                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        type="submit" variant="contained" size="large"
                                        disabled={processing} startIcon={<Save />}
                                        sx={{ background: 'linear-gradient(45deg, #a855f7, #ec4899)' }}
                                    >
                                        Сохранить изменения
                                    </Button>
                                </Box>
                            </Box>
                        )}

                        {/* ВКЛАДКА 2: ПАРОЛЬ */}
                        {tabValue === 1 && (
                            <Box component="form" onSubmit={submitPassword} sx={{ p: 4 }}>
                                <Typography variant="h6" gutterBottom>Смена пароля</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Используйте сложный пароль для защиты вашего творчества.
                                </Typography>

                                <Grid container spacing={3} maxWidth="sm">
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth type="password" label="Текущий пароль"
                                            value={passData.current_password} onChange={e => setPassData('current_password', e.target.value)}
                                            error={!!passErrors.current_password} helperText={passErrors.current_password}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth type="password" label="Новый пароль"
                                            value={passData.password} onChange={e => setPassData('password', e.target.value)}
                                            error={!!passErrors.password} helperText={passErrors.password}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth type="password" label="Повторите новый пароль"
                                            value={passData.password_confirmation} onChange={e => setPassData('password_confirmation', e.target.value)}
                                        />
                                    </Grid>
                                </Grid>

                                <Box sx={{ mt: 4 }}>
                                    <Button
                                        type="submit" variant="outlined" size="large" color="error"
                                        disabled={passProcessing}
                                    >
                                        Обновить пароль
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Paper>
                </Container>

                {/* Уведомление об успехе */}
                <Snackbar open={openSnack} autoHideDuration={4000} onClose={() => setOpenSnack(false)}>
                    <Alert severity="success" variant="filled" onClose={() => setOpenSnack(false)}>
                        Изменения успешно сохранены!
                    </Alert>
                </Snackbar>
            </Box>
        </ThemeProvider>
    );
}
