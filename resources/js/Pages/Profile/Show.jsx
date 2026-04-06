import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ThemeProvider } from '@mui/material/styles';
import { 
    Box, Container, Avatar, Typography, Button, Grid, Paper, Chip, Divider 
} from '@mui/material';
import { Edit, Email, Brush } from '@mui/icons-material';
import theme from '../../theme';

export default function Show({ profileUser }) {
    const { auth } = usePage().props;
    const isMyProfile = auth?.user && auth.user.username === profileUser.username;

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ 
                minHeight: '100vh', 
                bgcolor: '#0f172a',
                backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(165, 243, 252, 0.1) 0%, transparent 20%)',
                backgroundBlendMode: 'overlay'
            }}>
                <Head title={`${profileUser.name} (@${profileUser.username})`} />

                {/* 1. БАННЕР */}
                <Box sx={{ 
                    height: 200, 
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)',
                    position: 'relative',
                    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
                }}>
                    <Button 
                        component={Link} href="/" 
                        sx={{ 
                            position: 'absolute', 
                            top: 16, 
                            left: 16, 
                            color: 'white', 
                            backdropFilter: 'blur(10px)', 
                            bgcolor: 'rgba(15, 23, 42, 0.7)',
                            border: '1px solid rgba(233, 213, 255, 0.3)',
                            px: 2,
                            py: 1,
                            borderRadius: 8,
                            fontWeight: 'medium'
                        }}
                    >
                        ← Sonzaiigi
                    </Button>
                </Box>

                <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 }, py: 6 }}>
                    
                    {/* 2. ИНФО О ЮЗЕРЕ */}
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', md: 'row' }, 
                        alignItems: { xs: 'center', md: 'flex-end' }, 
                        mt: -8, 
                        mb: 6, 
                        gap: 3,
                        position: 'relative'
                    }}>
                        
                        <Avatar 
                            src={profileUser.avatar}
                            sx={{ 
                                width: 160, 
                                height: 160, 
                                border: '6px solid #0f172a', 
                                bgcolor: '#1e293b',
                                fontSize: 64,
                                boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
                                zIndex: 1
                            }}
                        >
                            {profileUser.name[0]}
                        </Avatar>

                        <Box sx={{ 
                            flex: 1, 
                            textAlign: { xs: 'center', md: 'left' }, 
                            pb: 1,
                            position: 'relative'
                        }}>
                            <Typography variant="h4" fontWeight="bold" color="#f1f5f9" sx={{ mb: 1 }}>
                                {profileUser.name}
                            </Typography>
                            <Typography variant="h6" color="#e2e8f0" sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                justifyContent: { xs: 'center', md: 'flex-start' },
                                mb: 2
                            }}>
                                @{profileUser.username}
                                <Chip 
                                    label="Художник" 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined" 
                                    sx={{ 
                                        ml: 1, 
                                        height: 20,
                                        borderColor: '#e9d5ff',
                                        color: '#e9d5ff',
                                        bgcolor: 'rgba(233, 213, 255, 0.1)'
                                    }} 
                                />
                            </Typography>
                            
                            <Box sx={{ 
                                display: 'flex', 
                                gap: 2,
                                justifyContent: { xs: 'center', md: 'flex-start' },
                                mt: 2
                            }}>
                                {isMyProfile ? (
                                    <Button 
                                        component={Link} href="/settings"
                                        variant="outlined" 
                                        startIcon={<Edit />} 
                                        color="inherit"
                                        sx={{ 
                                            borderColor: '#e9d5ff',
                                            color: '#e9d5ff',
                                            px: 3,
                                            py: 1,
                                            borderRadius: 8,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                bgcolor: 'rgba(233, 213, 255, 0.1)',
                                                transform: 'translateY(-2px)'
                                            }
                                        }}
                                    >
                                        Редактировать
                                    </Button>
                                ) : (
                                    <>
                                        <Button 
                                            variant="contained" 
                                            startIcon={<Brush />} 
                                            sx={{ 
                                                borderRadius: 8, 
                                                px: 4, 
                                                py: 1.5,
                                                background: 'linear-gradient(45deg, #a855f7, #ec4899)',
                                                boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)',
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 6px 20px rgba(168, 85, 247, 0.6)'
                                                }
                                            }}
                                        >
                                            Подписаться
                                        </Button>
                                        <Button 
                                            variant="outlined" 
                                            startIcon={<Email />} 
                                            color="inherit" 
                                            sx={{ 
                                                borderRadius: 8,
                                                px: 3,
                                                py: 1.5,
                                                borderColor: '#a5f3fc',
                                                color: '#a5f3fc',
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    bgcolor: 'rgba(165, 243, 252, 0.1)',
                                                    transform: 'translateY(-2px)'
                                                }
                                            }}
                                        >
                                            Написать
                                        </Button>
                                    </>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {/* 3. ГАЛЕРЕЯ РАБОТ */}
                    <Box sx={{ mt: 6 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            color: '#f1f5f9'
                        }}>
                            <Box component="span" sx={{ 
                                width: 6, 
                                height: 32, 
                                bgcolor: '#e9d5ff', 
                                borderRadius: 1 
                            }} />
                            Галерея
                        </Typography>
                        
                        <Divider sx={{ 
                            mb: 4, 
                            borderColor: 'rgba(233, 213, 255, 0.2)',
                            height: '2px'
                        }} />

                        <Grid container spacing={3}>
                            {[1, 2, 3, 4, 5, 6].map((item) => (
                                <Grid item xs={12} sm={6} md={4} key={item}>
                                    <Paper 
                                        elevation={0}
                                        sx={{ 
                                            aspectRatio: '1/1', 
                                            bgcolor: 'rgba(30, 41, 59, 0.9)',
                                            borderRadius: 4,
                                            border: '1px solid rgba(233, 213, 255, 0.2)',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                borderColor: '#e9d5ff',
                                                boxShadow: '0 8px 20px rgba(233, 213, 255, 0.2)',
                                                cursor: 'pointer'
                                            }
                                        }}
                                    >
                                        <Box sx={{ 
                                            position: 'absolute', 
                                            inset: 0, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            color: 'text.secondary', 
                                            opacity: 0.3, 
                                            fontWeight: 'bold',
                                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%)'
                                        }}>
                                            ARTWORK #{item}
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                        
                        <Typography 
                            textAlign="center" 
                            color="#94a3b8" 
                            sx={{ 
                                mt: 6, 
                                mb: 10,
                                fontWeight: 'medium'
                            }}
                        >
                            Это всё... пока что.
                        </Typography>
                    </Box>

                </Container>
            </Box>
        </ThemeProvider>
    );
}