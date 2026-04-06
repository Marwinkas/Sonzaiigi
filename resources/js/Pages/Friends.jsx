import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { ThemeProvider } from '@mui/material/styles';
import {
    Box, Container, Typography, Avatar, Grid, Card, CardContent, Button, IconButton, Tab, Tabs, Badge
} from '@mui/material';
import { ChatBubbleOutline, PersonRemove, PersonAdd, Check, Close } from '@mui/icons-material';
import theme from '../theme';
import Header from '../Components/Header';

export default function Friends({ friends, requests, otherUsers }) {
    const [value] = useState(30);
    const [currentTab, setCurrentTab] = useState(0);

    const handleAddFriend = (friendId) => {
        router.post(route('friends.store'), { friend_id: friendId }, { preserveScroll: true });
    };

    const handleAcceptRequest = (friendId) => {
        router.post(route('friends.accept', friendId), {}, { preserveScroll: true });
    };

    const handleRemoveOrDecline = (friendId) => {
        router.delete(route('friends.destroy', friendId), { preserveScroll: true });
    };

    // Выбираем, какой список людей сейчас показывать
    let displayUsers = [];
    if (currentTab === 0) displayUsers = friends;
    if (currentTab === 1) displayUsers = requests;
    if (currentTab === 2) displayUsers = otherUsers;

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ minHeight: '100vh', bgcolor: `hsl(${214 + value}, 67%, 5%)`, pb: 10 }}>
                <Head title="Друзья" />
                <Header color={value} />

                <Container maxWidth="lg" sx={{ mt: 6 }}>

                    <Box sx={{ mb: 4, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>
                            Люди
                        </Typography>
                        <Tabs
                            value={currentTab}
                            onChange={(e, newValue) => setCurrentTab(newValue)}
                            sx={{
                                '& .MuiTab-root': { color: '#94a3b8', textTransform: 'none', fontSize: '1rem' },
                                '& .Mui-selected': { color: '#38bdf8 !important' },
                                '& .MuiTabs-indicator': { backgroundColor: '#38bdf8' }
                            }}
                        >
                            <Tab label={`Мои друзья (${friends.length})`} />

                            {/* Добавили бейдж для новых заявок */}
                            <Tab label={
                                <Badge color="error" badgeContent={requests.length} sx={{ '& .MuiBadge-badge': { right: -15, top: 5 } }}>
                                    Заявки
                                </Badge>
                            } />

                            <Tab label={`Поиск (${otherUsers.length})`} />
                        </Tabs>
                    </Box>

                    {displayUsers.length === 0 && (
                        <Typography sx={{ color: '#94a3b8', textAlign: 'center', mt: 10, fontSize: '1.1rem' }}>
                            {currentTab === 0 && 'У вас пока нет друзей в списке. Загляните во вкладку поиска!'}
                            {currentTab === 1 && 'Новых заявок пока нет.'}
                            {currentTab === 2 && 'Похоже, здесь пока никого нет.'}
                        </Typography>
                    )}

                    <Grid container spacing={3}>
                        {displayUsers.map((user) => (
                            <Grid item xs={12} sm={6} md={4} key={user.id}>
                                <Card sx={{
                                    bgcolor: '#1e293b',
                                    borderRadius: 4,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-4px)', borderColor: 'rgba(56, 189, 248, 0.3)' }
                                }}>
                                    <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                                        <Avatar
                                            src={user.avatar}
                                            sx={{ width: 80, height: 80, bgcolor: '#38bdf8', color: '#0f172a', fontSize: '2rem', fontWeight: 'bold', mb: 2 }}
                                        >
                                            {user.name ? user.name[0].toUpperCase() : 'U'}
                                        </Avatar>

                                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                                            {user.name}
                                        </Typography>

                                        <Box sx={{ display: 'flex', gap: 1, width: '100%', mt: 3 }}>

                                            {/* Кнопки для вкладки "Мои друзья" */}
                                            {currentTab === 0 && (
                                                <>
                                                    <Button variant="contained" fullWidth startIcon={<ChatBubbleOutline />} sx={{ bgcolor: '#38bdf8', color: '#0f172a', borderRadius: 3, textTransform: 'none', fontWeight: 'bold', '&:hover': { bgcolor: '#0ea5e9' } }}>
                                                        Написать
                                                    </Button>
                                                    <IconButton onClick={() => handleRemoveOrDecline(user.id)} sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#ef4444', borderRadius: 3, '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}>
                                                        <PersonRemove />
                                                    </IconButton>
                                                </>
                                            )}

                                            {/* Кнопки для вкладки "Заявки" */}
                                            {currentTab === 1 && (
                                                <>
                                                    <Button onClick={() => handleAcceptRequest(user.id)} variant="contained" fullWidth startIcon={<Check />} sx={{ bgcolor: '#10b981', color: 'white', borderRadius: 3, textTransform: 'none', fontWeight: 'bold', '&:hover': { bgcolor: '#059669' } }}>
                                                        Принять
                                                    </Button>
                                                    <IconButton onClick={() => handleRemoveOrDecline(user.id)} sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#94a3b8', borderRadius: 3, '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' } }}>
                                                        <Close />
                                                    </IconButton>
                                                </>
                                            )}

                                            {/* Кнопки для вкладки "Поиск" */}
                                            {currentTab === 2 && (
                                                <Button onClick={() => handleAddFriend(user.id)} variant="contained" fullWidth startIcon={<PersonAdd />} sx={{ bgcolor: '#38bdf8', color: '#0f172a', borderRadius: 3, textTransform: 'none', fontWeight: 'bold', '&:hover': { bgcolor: '#0ea5e9' } }}>
                                                    Добавить
                                                </Button>
                                            )}

                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                </Container>
            </Box>
        </ThemeProvider>
    );
}
