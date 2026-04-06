import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { ThemeProvider } from '@mui/material/styles';
import {
    Box, Container, Avatar, Typography, Button, Grid, Paper, Divider, Tooltip, IconButton
} from '@mui/material';
import { Edit, Email, PersonAdd, PersonRemove, Block, VolumeOff, Handshake, ArrowBack } from '@mui/icons-material';
import theme from '../../theme';
import SettingsModal from '../../Components/SettingsModal';

// ДОБАВЛЯЕМ interactions СЮДА:
export default function Show({ profileUser, interactions }) {
    const { auth } = usePage().props;
    const isMyProfile = auth?.user && profileUser && auth.user.username === profileUser.username;

    const [settingsOpen, setSettingsOpen] = useState(false);

    // Теперь мы читаем статусы из готового и надежного объекта interactions
    const isFollowing = interactions?.isFollowing || false;
    const isFollowedByThem = interactions?.isFollowedByThem || false;
    const isMutual = isFollowing && isFollowedByThem;
    const isMuted = interactions?.isMuted || false;
    const isBlocking = interactions?.isBlocking || false;

    const handleFollow = () => {
        router.post(route('users.follow', profileUser.id), {}, { preserveScroll: true, preserveState: true });
    };

    const handleBlock = () => {
        router.post(route('users.block', profileUser.id), {}, { preserveScroll: true, preserveState: true });
    };

    const handleMute = () => {
        router.post(route('users.mute', profileUser.id), {}, { preserveScroll: true, preserveState: true });
    };

    if (!profileUser) return null;
    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', pb: 10 }}>
                <Head title={isBlocking ? "Пользователь заблокирован" : `${profileUser.name} (@${profileUser.username})`} />

                {/* Шапка страницы */}
                <Box sx={{ display: 'flex', alignItems: 'center', px: 4, py: 2, bgcolor: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <IconButton component={Link} href="/" sx={{ mr: 2, color: '#94a3b8', '&:hover': { color: 'white' } }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        Профиль
                    </Typography>
                </Box>

                <Container maxWidth="md" sx={{ mt: 4 }}>

                    {/* КАРТОЧКА ПОЛЬЗОВАТЕЛЯ */}
                    <Box sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        pt: 5, px: 4, pb: 5, bgcolor: '#1e293b', borderRadius: 4,
                        border: '1px solid rgba(255,255,255,0.05)', mb: 6
                    }}>
                        <Avatar
                            src={profileUser.avatar}
                            sx={{ width: 140, height: 140, bgcolor: '#38bdf8', color: '#0f172a', fontSize: 64, mb: 3, opacity: isBlocking ? 0.5 : 1 }}
                        >
                            {profileUser.name[0]}
                        </Avatar>

                        <Typography variant="h4" fontWeight="bold" color={isBlocking ? '#64748b' : '#f1f5f9'} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {profileUser.name}
                            {isMutual && !isMyProfile && !isBlocking && (
                                <Tooltip title="Вы друзья (взаимная подписка)">
                                    <Handshake sx={{ color: '#f59e0b', fontSize: '1.8rem' }} />
                                </Tooltip>
                            )}
                        </Typography>

                        {/* Кликабельный никнейм */}
                        <Typography
                            component={Link}
                            href={`/u/${profileUser.username}`}
                            variant="h6"
                            sx={{
                                color: isBlocking ? '#64748b' : '#38bdf8',
                                opacity: 0.8,
                                mb: 4,
                                textDecoration: 'none',
                                transition: '0.2s',
                                '&:hover': { opacity: 1, textDecoration: 'underline' }
                            }}
                        >
                            @{profileUser.username}
                        </Typography>

                        <Box sx={{ width: '100%', maxWidth: 500 }}>
                            {isMyProfile ? (
                                <Button
                                    variant="outlined" startIcon={<Edit />} fullWidth
                                    onClick={() => setSettingsOpen(true)}
                                    sx={{
                                        borderColor: '#38bdf8', color: '#38bdf8', borderRadius: 1, py: 1.5,
                                        textTransform: 'none', fontWeight: 'bold', '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.1)' }
                                    }}
                                >
                                    Редактировать
                                </Button>
                            ) : isBlocking ? (
                                /* Если пользователь заблокирован - только одна кнопка */
                                <Button
                                    variant="contained" startIcon={<Block />} fullWidth
                                    onClick={handleBlock}
                                    sx={{
                                        bgcolor: '#ef4444', color: 'white', borderRadius: 1, py: 1.5,
                                        textTransform: 'none', fontWeight: 'bold', '&:hover': { bgcolor: '#dc2626' }
                                    }}
                                >
                                    Разблокировать
                                </Button>
                            ) : (
                                /* Стандартные кнопки для обычного профиля */
                                <Grid container spacing={2}>
                                    <Grid item xs={6} sm={3}> {/* Если это Show.jsx, оставь sm={3}, если ProfileModal, там нет sm */}
                                        <Tooltip title={!isMutual ? "Вы сможете написать, когда подписка станет взаимной" : ""}>
                                            <span>
                                                <Button
                                                    variant="contained" startIcon={<Email />} fullWidth
                                                    disabled={!isMutual}
                                                    // ДОБАВЛЯЕМ ЭТО:
                                                    onClick={() => {
                                                        router.post(route('messages.start', profileUser.id));
                                                    }}
                                                    sx={{
                                                        borderRadius: 1, py: 1.5, textTransform: 'none',
                                                        background: isMutual ? 'linear-gradient(45deg, #f97316, #f59e0b)' : '#334155',
                                                        color: isMutual ? 'white' : '#94a3b8',
                                                        boxShadow: isMutual ? '0 4px 15px rgba(249, 115, 22, 0.3)' : 'none',
                                                        '&:hover': { transform: isMutual ? 'translateY(-2px)' : 'none', boxShadow: isMutual ? '0 6px 20px rgba(249, 115, 22, 0.5)' : 'none' },
                                                        '&.Mui-disabled': { background: '#334155', color: '#64748b' }
                                                    }}
                                                >
                                                    Написать
                                                </Button>
                                            </span>
                                        </Tooltip>
                                    </Grid>

                                    <Grid item xs={6} sm={3}>
                                        <Button
                                            variant={isFollowing ? "outlined" : "contained"}
                                            startIcon={isFollowing ? <PersonRemove /> : <PersonAdd />}
                                            fullWidth
                                            onClick={handleFollow}
                                            sx={{
                                                borderRadius: 1, py: 1.5, textTransform: 'none', fontWeight: 'bold',
                                                bgcolor: isFollowing ? 'transparent' : '#38bdf8',
                                                color: isFollowing ? '#94a3b8' : '#0f172a',
                                                borderColor: isFollowing ? '#64748b' : 'transparent',
                                                '&:hover': { bgcolor: isFollowing ? 'rgba(100, 116, 139, 0.1)' : '#0ea5e9', transform: 'translateY(-2px)' }
                                            }}
                                        >
                                            {isFollowing ? 'Отписаться' : 'Подписаться'}
                                        </Button>
                                    </Grid>

                                    <Grid item xs={6} sm={3}>
                                        <Button
                                            variant={isMuted ? "contained" : "outlined"}
                                            startIcon={<VolumeOff />}
                                            fullWidth
                                            onClick={handleMute}
                                            sx={{
                                                borderRadius: 1, py: 1.5, textTransform: 'none',
                                                borderColor: '#64748b',
                                                color: isMuted ? 'white' : '#94a3b8',
                                                bgcolor: isMuted ? '#64748b' : 'transparent',
                                                '&:hover': { bgcolor: isMuted ? '#475569' : 'rgba(100, 116, 139, 0.1)' }
                                            }}
                                        >
                                            {isMuted ? 'Размьютить' : 'Мут'}
                                        </Button>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Button
                                            variant="outlined" startIcon={<Block />} fullWidth
                                            onClick={handleBlock} // Функция блокировки!
                                            sx={{ borderRadius: 1, py: 1.5, textTransform: 'none', borderColor: '#ef4444', color: '#ef4444', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
                                        >
                                            Блок
                                        </Button>
                                    </Grid>
                                </Grid>
                            )}
                        </Box>
                    </Box>

                    {/* ГАЛЕРЕЯ скрывается, если профиль заблокирован */}
                    {!isBlocking && (
                        <Box>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                <Box component="span" sx={{ width: 6, height: 28, bgcolor: '#f59e0b', borderRadius: 1 }} />
                                Галерея
                            </Typography>

                            <Divider sx={{ mb: 4, borderColor: 'rgba(255,255,255,0.05)', height: '2px' }} />

                            <Grid container spacing={3}>
                                {[1, 2, 3, 4, 5, 6].map((item) => (
                                    <Grid item xs={12} sm={6} md={4} key={item}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                aspectRatio: '1/1', bgcolor: 'rgba(30, 41, 59, 0.9)',
                                                borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)',
                                                overflow: 'hidden', position: 'relative', transition: 'all 0.3s ease',
                                                '&:hover': { transform: 'translateY(-4px)', borderColor: '#f59e0b', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.15)', cursor: 'pointer' }
                                            }}
                                        >
                                            <Box sx={{
                                                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'text.secondary', opacity: 0.3, fontWeight: 'bold',
                                                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, transparent 100%)'
                                            }}>
                                                ARTWORK #{item}
                                            </Box>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>

                            <Typography textAlign="center" color="#64748b" sx={{ mt: 8, fontWeight: 'medium' }}>
                                Это всё... пока что.
                            </Typography>
                        </Box>
                    )}

                </Container>

                {/* Окно настроек */}
                <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
            </Box>
        </ThemeProvider>
    );
}
