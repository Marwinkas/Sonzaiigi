import React, { useState } from 'react'
import { Head, Link, usePage, router } from '@inertiajs/react';
import { ThemeProvider } from '@mui/material/styles';
import {
    Box, Container, Card, CardHeader, CardMedia, CardContent, CardActions,
    Avatar, IconButton, Typography, Fab, Chip, Pagination
} from '@mui/material';
import { Favorite, FavoriteBorder, ChatBubbleOutline, Add, MoreVert } from '@mui/icons-material';
import theme from '../theme';
import CreatePost from '@/Components/CreatePost';
import Header from '../Components/Header';




import { Masonry } from '@mui/lab'; // Важный импорт для сетки
import { FilterNone } from '@mui/icons-material';





import {
      Skeleton
} from '@mui/material';
import {
    BookmarkBorder, ShareOutlined
} from '@mui/icons-material';









import { Slider, Input, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';

// 1. Небольшая стилизация под темную тему (Dark Blue vibe)
// Если у тебя уже настроена глобальная тема MUI (ThemeProvider), эти цвета подтянутся оттуда.
const CustomSlider = styled(Slider)({
    color: '#38bdf8', // Светло-голубой акцент (как на логотипе)
    height: 8,
    '& .MuiSlider-track': {
        border: 'none',
    },
    '& .MuiSlider-thumb': {
        height: 24,
        width: 24,
        backgroundColor: '#fff',
        border: '2px solid currentColor',
        '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
            boxShadow: 'inherit',
        },
        '&:before': {
            display: 'none',
        },
    },
    '& .MuiSlider-valueLabel': {
        lineHeight: 1.2,
        fontSize: 12,
        background: 'unset',
        padding: 0,
        width: 32,
        height: 32,
        borderRadius: '50% 50% 50% 0',
        backgroundColor: '#38bdf8',
        transformOrigin: 'bottom left',
        transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
        '&:before': { display: 'none' },
        '&.MuiSlider-valueLabelOpen': {
            transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
        },
        '& > *': {
            transform: 'rotate(45deg)',
        },
    },
});


export default function Home({ posts }) {
    const { auth } = usePage().props;
    const [isCreateOpen, setCreateOpen] = useState(false);

    const handleLike = (post) => {
        if (!auth.user) return router.visit('/login');

        router.post(route('posts.like', post.id), {}, {
            preserveScroll: true,
        });
    };







    const [value, setValue] = useState(30);

    // Обработчик для слайдера
    const handleSliderChange = (event, newValue) => {
        setValue(newValue);
    };

    // Обработчик для ручного ввода цифр
    const handleInputChange = (event) => {
        setValue(event.target.value === '' ? '' : Number(event.target.value));
    };

    // Проверка границ (чтобы не ввели -500 или 9999)
    const handleBlur = () => {
        if (value < -255) {
            setValue(-255);
        } else if (value > 255) {
            setValue(255);
        }
    };


    return (


        <ThemeProvider theme={theme}>
            <Box sx={{ minHeight: '100vh', bgcolor: `hsl(${214 + value}, 67%, 5%)`, pb: 10 }}>
                <Head title="Главная" />

                <Header color={value} />



                {/* ЛЕНТА ПОСТОВ */}
                <Container maxWidth="xl" sx={{ mt: 4, pb: 10 }}>
            {posts.data.length === 0 ? (
                <Box className="text-center py-20 text-gray-500">
                    Лента пуста.
                </Box>
            ) : (
                // Masonry: адаптивная сетка (1 колонка на мобилках, 2 на планшете, 4 на десктопе)
                <Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} spacing={3}>
                    {posts.data.map((post) => (
                        <Card
                            key={post.id}
                            sx={{
                                borderRadius: 4,
                                bgcolor: '#1e293b', // Темно-синий фон карточки
                                color: 'white',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.05)',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
                                    // При наведении можно подсвечивать рамку
                                    borderColor: 'rgba(255,255,255,0.2)'
                                }
                            }}
                        >
                            {/* ОБЛАСТЬ ИЗОБРАЖЕНИЯ */}
                            <Box sx={{ position: 'relative' }}>
                                <Link href={route('profile.show', post.user.username)} underline="none">
                                    {post.images.length > 0 ? (
                                        <CardMedia
                                            component="img"
                                            image={post.images[0].path}
                                            alt={post.title}
                                            sx={{
                                                width: '100%',
                                                // Важно: auto height сохраняет пропорции как в Pinterest
                                                height: 'auto',
                                                display: 'block',
                                                minHeight: 150 // Чтобы пустые карточки не схлопывались
                                            }}
                                        />
                                    ) : (
                                        // Заглушка, если нет картинки (текстовый пост)
                                        <Box sx={{ p: 4, bgcolor: '#0f172a', minHeight: 150, display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body2" sx={{color: '#94a3b8'}}>{post.description}</Typography>
                                        </Box>
                                    )}
                                </Link>

                                {/* Бейдж если картинок несколько (галерея) */}
                                {post.images.length > 1 && (
                                    <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                                        <FilterNone sx={{ color: 'white', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))' }} />
                                    </Box>
                                )}
                            </Box>

                            {/* ИНФОРМАЦИЯ ПОД КАРТИНКОЙ (Минималистично) */}
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                {/* Заголовок (если есть) */}
                                {post.title && (
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight="bold"
                                        sx={{
                                            lineHeight: 1.2,
                                            mb: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2, // Максимум 2 строки заголовка
                                            WebkitBoxOrient: 'vertical',
                                        }}
                                    >
                                        {post.title}
                                    </Typography>
                                )}

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                    {/* Автор */}
                                    <Link href={route('profile.show', post.user.username)} underline="none" sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                                        {post.user.avatar && <Avatar
                                            src={post.user.avatar}
                                            sx={{ width: 24, height: 24, bgcolor: '#3b82f6', fontSize: 12 }}
                                        >
                                            {post.user.name[0]}
                                        </Avatar>}
                                        <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {post.user.name}
                                        </Typography>
                                    </Link>

                                    {/* Лайк */}
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => { e.preventDefault(); handleLike(post); }}
                                            sx={{
                                                color: post.is_liked_by_me ? '#ec4899' : '#64748b',
                                                padding: 0.5,
                                                '&:hover': { color: '#ec4899' }
                                            }}
                                        >
                                            {post.is_liked_by_me ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                                        </IconButton>
                                        <Typography variant="caption" sx={{ ml: 0.5, color: '#94a3b8', fontWeight: 'bold' }}>
                                            {post.likes_count}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Masonry>
            )}

            {/* Пагинация внизу */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                    count={posts.last_page}
                    page={posts.current_page}
                    onChange={(e, v) => router.get(posts.links[v].url)}
                    // Стилизация пагинации под темную тему
                    sx={{
                        '& .MuiPaginationItem-root': { color: '#94a3b8' },
                        '& .Mui-selected': { bgcolor: '#3b82f6 !important', color: 'white' }
                    }}
                />
            </Box>
        </Container>
            </Box>
        </ThemeProvider>
    );
}
