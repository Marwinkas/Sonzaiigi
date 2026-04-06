import React from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { ThemeProvider } from '@mui/material/styles';
import {
    Box, Avatar, Typography, Button, Dialog, DialogContent, IconButton, Tooltip
} from '@mui/material';
import { Edit, Email, PersonAdd, PersonRemove, Block, VolumeOff, Close, Handshake, OpenInNew } from '@mui/icons-material';
import theme from '../theme';

export default function ProfileModal({ open, onClose, profileUser, onOpenSettings }) {
    const { auth } = usePage().props;
    const isMyProfile = auth?.user && profileUser && auth.user.username === profileUser.username;

    const isFollowing = profileUser?.followers?.some(f => f.id === auth.user.id) || false;
    const isFollowedByThem = profileUser?.following?.some(f => f.id === auth.user.id) || false;
    const isMutual = isFollowing && isFollowedByThem;

    // Проверяем блокировки и муты
    const isBlocking = profileUser?.blockers?.some(b => b.id === auth.user.id) || false;
    const isMuted = profileUser?.mutedBy?.some(m => m.id === auth?.user?.id) || false;

    const handleMute = () => {
        router.post(route('users.mute', profileUser.id), {}, { preserveScroll: true, preserveState: true });
    };

    const handleFollow = () => {
        router.post(route('users.follow', profileUser.id), {}, { preserveScroll: true, preserveState: true });
    };

    const handleBlock = () => {
        router.post(route('users.block', profileUser.id), {}, { preserveScroll: true, preserveState: true });
    };

    if (!profileUser) return null;

    // Общие стили для кнопок, чтобы они были строго одного размера
    const commonButtonStyles = {
        height: '44px',
        borderRadius: 1.5,
        textTransform: 'none',
        fontWeight: 'bold',
        fontSize: { xs: '0.65rem', sm: '0.75rem' }, // Адаптивный шрифт для 4-х кнопок в ряд
        boxShadow: 'none',
        minWidth: 0,
        px: 0.5, // Минимальный паддинг
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap'
    };

    return (
        <ThemeProvider theme={theme}>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        maxWidth: "610px",
                        borderRadius: 4,
                        bgcolor: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backgroundImage: 'none',
                        overflow: 'hidden'
                    }
                }}
            >
                {/* ШАПКА МОДАЛКИ */}
                <Box sx={{ display: 'flex', alignItems: 'center', px: 3, py: 2, bgcolor: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', flex: 1 }}>Профиль</Typography>
                    <IconButton onClick={onClose} sx={{ color: '#94a3b8', '&:hover': { color: 'white' } }}><Close /></IconButton>
                </Box>

                {/* ТЕЛО МОДАЛКИ */}
                <DialogContent sx={{ p: 0, bgcolor: '#0f172a' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 5, px: 4, pb: 4, bgcolor: '#1e293b', mb: 1 }}>

                        <Avatar src={profileUser.avatar && "https://cdn.sonzaiigi.com" + profileUser.avatar.replace('/storage/', '/')} sx={{ width: 120, height: 120, bgcolor: '#38bdf8', color: '#0f172a', fontSize: 48, mb: 2, opacity: isBlocking ? 0.5 : 1 }}>
                            {profileUser.name[0]}
                        </Avatar>

                        <Typography variant="h5" fontWeight="bold" color={isBlocking ? '#64748b' : '#f1f5f9'} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {profileUser.name}
                            {isMutual && !isMyProfile && !isBlocking && (
                                <Tooltip title="Вы друзья (взаимная подписка)">
                                    <Handshake sx={{ color: '#f59e0b', fontSize: '1.2rem' }} />
                                </Tooltip>
                            )}
                        </Typography>

                        <Typography component={Link} href={`/u/${profileUser.username}`} onClick={onClose} variant="body2" sx={{ color: isBlocking ? '#64748b' : '#38bdf8', opacity: 0.8, mb: 3, textDecoration: 'none', transition: '0.2s', '&:hover': { opacity: 1, textDecoration: 'underline' } }}>
                            @{profileUser.username}
                        </Typography>

                        {/* БЛОК КНОПОК */}
                        <Box sx={{ width: '100%', mb: 2 }}>
                            {isMyProfile ? (
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => { onClose(); if (onOpenSettings) onOpenSettings(); }}
                                    sx={{ ...commonButtonStyles, borderColor: '#38bdf8', color: '#38bdf8', '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.1)' } }}
                                >
                                    <Edit sx={{ fontSize: '1.2rem', mr: 1 }} /> Редактировать
                                </Button>
                            ) : isBlocking ? (
                                /* ТОЛЬКО РАЗБЛОКИРОВАТЬ */
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={handleBlock}
                                    sx={{ ...commonButtonStyles, bgcolor: '#ef4444', color: 'white', '&:hover': { bgcolor: '#dc2626' } }}
                                >
                                    <Block sx={{ fontSize: '1.2rem', mr: 1 }} /> Разблокировать
                                </Button>
                            ) : (
                                /* ОБЫЧНЫЕ КНОПКИ — СТРОГО В ОДИН РЯД */
                                <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>

                                    {/* 1. Написать */}
                                    <Tooltip title={!isMutual ? "Вы сможете написать, когда подписка станет взаимной" : ""}>
                                        <Box sx={{ flex: 1, display: 'flex' }}>
                                            <Button
                                                variant="contained"
                                                disabled={!isMutual}
                                                onClick={() => {
                                                    if (onClose) onClose();
                                                    router.post(route('messages.start', profileUser.id));
                                                }}
                                                sx={{
                                                    ...commonButtonStyles,
                                                    width: '100%',
                                                    bgcolor: isMutual ? '#f97316' : '#334155', // Убран градиент, сплошной цвет
                                                    color: isMutual ? 'white' : '#94a3b8',
                                                    '&:hover': {
                                                        bgcolor: isMutual ? '#ea580c' : '#334155',
                                                        transform: isMutual ? 'translateY(-1px)' : 'none'
                                                    },
                                                    '&.Mui-disabled': { bgcolor: '#334155', color: '#64748b' }
                                                }}
                                            >
                                                <Email sx={{ fontSize: '1.1rem', mr: 0.5 }} /> Написать
                                            </Button>
                                        </Box>
                                    </Tooltip>

                                    {/* 2. Подписка */}
                                    <Button
                                        variant={isFollowing ? "outlined" : "contained"}
                                        onClick={handleFollow}
                                        sx={{
                                            ...commonButtonStyles,
                                            flex: 1,
                                            bgcolor: isFollowing ? 'transparent' : '#38bdf8',
                                            color: isFollowing ? '#94a3b8' : '#0f172a',
                                            borderColor: isFollowing ? '#64748b' : 'transparent',
                                            '&:hover': {
                                                bgcolor: isFollowing ? 'rgba(100, 116, 139, 0.1)' : '#0ea5e9',
                                                transform: 'translateY(-1px)'
                                            }
                                        }}
                                    >
                                        {isFollowing ? <PersonRemove sx={{ fontSize: '1.1rem', mr: 0.5 }} /> : <PersonAdd sx={{ fontSize: '1.1rem', mr: 0.5 }} />}
                                        {isFollowing ? 'Отписка' : 'Подписка'}
                                    </Button>

                                    {/* 3. Мут */}
                                    <Button
                                        variant={isMuted ? "contained" : "outlined"}
                                        onClick={handleMute}
                                        sx={{
                                            ...commonButtonStyles,
                                            flex: 1,
                                            borderColor: '#64748b',
                                            color: isMuted ? 'white' : '#94a3b8',
                                            bgcolor: isMuted ? '#64748b' : 'transparent',
                                            '&:hover': {
                                                bgcolor: isMuted ? '#475569' : 'rgba(100, 116, 139, 0.1)',
                                                transform: 'translateY(-1px)'
                                            }
                                        }}
                                    >
                                        <VolumeOff sx={{ fontSize: '1.1rem', mr: 0.5 }} />
                                        {isMuted ? 'Снять мут' : 'Мут'}
                                    </Button>

                                    {/* 4. Блок */}
                                    <Button
                                        variant="outlined"
                                        onClick={handleBlock}
                                        sx={{
                                            ...commonButtonStyles,
                                            flex: 1,
                                            borderColor: '#ef4444',
                                            color: '#ef4444',
                                            '&:hover': {
                                                bgcolor: 'rgba(239, 68, 68, 0.1)',
                                                transform: 'translateY(-1px)'
                                            }
                                        }}
                                    >
                                        <Block sx={{ fontSize: '1.1rem', mr: 0.5 }} />
                                        Блок
                                    </Button>

                                </Box>
                            )}
                        </Box>

                        <Button
                            component={Link}
                            href={`/u/${profileUser.username}`}
                            onClick={onClose}
                            endIcon={<OpenInNew />}
                            sx={{ textTransform: 'none', color: '#94a3b8', '&:hover': { color: '#38bdf8', bgcolor: 'transparent' } }}
                        >
                            Посмотреть профиль
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </ThemeProvider>
    );
}
