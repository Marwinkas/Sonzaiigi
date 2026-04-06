import React, { useState } from 'react'
import { Head, Link, usePage, router } from '@inertiajs/react';
import {
    Box, Container, Avatar, IconButton, Typography,
} from '@mui/material';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import InputBase from '@mui/material/InputBase';
import { styled, alpha } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import PersonAdd from '@mui/icons-material/PersonAdd';
import Settings from '@mui/icons-material/Settings';
import Logout from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

import Search from './SearchWithButton'
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HistoryIcon from '@mui/icons-material/History';
import Notification from './NotificationBellю'
import HeaderLogo from './HeaderLogo'
export default function Header({ color }) {
    const { auth } = usePage().props;
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <Box sx={{
            position: 'sticky', top: 0, zIndex: 10,
            backdropFilter: 'blur(10px)', bgcolor: `hsla(${224 + color}, 71%, 4%, 0.80)`,
        }}>
            <Container maxWidth="100%" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: "56px" }}>
                <HeaderLogo  color={color}/>

                <Search  color={color} />
                {auth.user ? (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{
                                // Градиент в стиле киберпанк/аниме
                                background: `linear-gradient(45deg, hsl(${210 + color}, 100%, 60%) 30%, hsl(${186 + color}, 100%, 50%) 90%)`,
                                color: '#040B14', // Темный текст для читаемости
                                fontWeight: 'bold',
                                borderRadius: '20px', // Скругленная кнопка (pill shape)
                                padding: '8px 24px',
                                textTransform: 'none',
                                border: `1px solid hsla(${0 + color}, 0%, 100%, 0.20)`, // Легкий блик
                                boxShadow: `0 0 10px hsla(${210 + color}, 100%, 60%, 0.50)`, // СВЕЧЕНИЕ (Glow effect)
                                transition: '0.3s',
                                '&:hover': {
                                    // При наведении свечение усиливается
                                    boxShadow: `0 0 20px hsla(${210 + color}, 100%, 60%, 0.80)`,
                                }
                            }}
                        >
                            Create
                        </Button>
                        <Notification color={color}/>
                        <Tooltip title="Account">
                            <IconButton
                                onClick={handleClick}
                                size="small"
                                aria-controls={open ? 'account-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={open ? 'true' : undefined}
                                sx={{
                                    width: "40px",
                                    height: "40px",
                                    transition: '0.3s',
                                    '&:hover': {
                                        // Эффект свечения аватара при наведении
                                        filter: `drop-shadow(0 0 8px hsla(${210 + color}, 100%, 60%, 0.60))`
                                    }
                                }}
                            >
                                <Avatar
                                    src={auth.user.avatar}
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        // Меняем фиолетовую рамку на твою фирменную голубую
                                        border: `2px solid hsl(${210 + color}, 100%, 60%)`,
                                        bgcolor: `hsl(${211 + color}, 61%, 10%)`
                                    }}
                                >
                                    {auth.user.name[0]}
                                </Avatar>
                            </IconButton>
                        </Tooltip>

                        <Menu
                            anchorEl={anchorEl}
                            id="account-menu"
                            open={open}
                            onClose={handleClose}
                            onClick={handleClose}
                            // Анимация появления
                            TransitionProps={{ timeout: 200 }}
                            slotProps={{
                                paper: {
                                    elevation: 0,
                                    sx: {
                                        overflow: 'visible',
                                        // 🎨 Глубокий темно-синий фон + легкая прозрачность
                                        backgroundColor: `hsla(${211 + color}, 61%, 10%, 0.95)`,
                                        backdropFilter: 'blur(10px)', // Размытие фона за меню
                                        border: `1px solid hsla(${210 + color}, 100%, 60%, 0.20)`, // Тонкая кибер-рамка
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)', // Глубокая тень
                                        mt: 1.5,
                                        color: '#F3F6F9', // Белый текст
                                        minWidth: '200px', // Чуть шире для красоты

                                        // Стиль для треугольника (стрелочки) сверху
                                        '&::before': {
                                            content: '""',
                                            display: 'block',
                                            position: 'absolute',
                                            top: 0,
                                            right: 14,
                                            width: 10,
                                            height: 10,
                                            bgcolor: `hsl(${211 + color}, 61%, 10%)`, // Цвет должен совпадать с фоном меню
                                            borderTop: `1px solid hsla(${210 + color}, 100%, 60%, 0.20)`, // Граница стрелочки
                                            borderLeft: `1px solid hsla(${210 + color}, 100%, 60%, 0.20)`,
                                            transform: 'translateY(-50%) rotate(45deg)',
                                            zIndex: 0,
                                        },

                                        // 🎨 Стилизация пунктов меню (MenuItem)
                                        '& .MuiMenuItem-root': {
                                            fontSize: '0.95rem',
                                            color: '#B2BAC2', // Серый текст по умолчанию
                                            transition: '0.2s',
                                            margin: '4px 8px', // Отступы для эффекта "парящих кнопок"
                                            borderRadius: '8px', // Скругление пунктов

                                            // Иконки
                                            '& .MuiListItemIcon-root': {
                                                color: `hsl(${210 + color}, 100%, 60%)`, // Синие иконки
                                                minWidth: '32px',
                                            },

                                            // Ховер (Наведение)
                                            '&:hover': {
                                                backgroundColor: `hsla(${210 + color}, 100%, 60%, 0.10)`, // Подсветка фона
                                                color: `hsl(${186 + color}, 100%, 50%)`, // Текст становится неоново-циановым

                                                '& .MuiListItemIcon-root': {
                                                    color: `hsl(${186 + color}, 100%, 50%)`, // Иконка тоже загорается
                                                }
                                            }
                                        },
                                    },
                                },
                            }}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        >
                            {/* Пункты меню */}
                            <MenuItem onClick={handleClose}>
                                <ListItemIcon>
                                    <AccountCircleIcon fontSize="small" />
                                </ListItemIcon>
                                Profile
                            </MenuItem>

                            <MenuItem onClick={handleClose}>
                                <ListItemIcon>
                                    <DashboardIcon fontSize="small" />
                                </ListItemIcon>
                                Dashboard
                            </MenuItem>

                            <MenuItem onClick={handleClose}>
                                <ListItemIcon>
                                    <PersonIcon fontSize="small" />
                                </ListItemIcon>
                                Following
                            </MenuItem>

                            <MenuItem onClick={handleClose}>
                                <ListItemIcon>
                                    <FavoriteIcon fontSize="small" />
                                </ListItemIcon>
                                Liked Works
                            </MenuItem>

                            <MenuItem onClick={handleClose}>
                                <ListItemIcon>
                                    <HistoryIcon fontSize="small" />
                                </ListItemIcon>
                                History
                            </MenuItem>

                            {/* Разделитель стал темно-синим/прозрачным */}
                            <Divider sx={{ my: 1, borderColor: `hsla(${210 + color}, 100%, 60%, 0.10)` }} />

                            <MenuItem onClick={handleClose}>
                                <ListItemIcon>
                                    <Settings fontSize="small" />
                                </ListItemIcon>
                                Settings
                            </MenuItem>

                            {/* Кнопка выхода с красным ховером для предупреждения */}
                            <MenuItem
                                onClick={handleClose}
                                sx={{
                                    '&:hover': {
                                        // Перебиваем стандартный синий ховер на красный для выхода
                                        backgroundColor: 'rgba(255, 61, 0, 0.1) !important',
                                        color: '#FF3D00 !important',
                                        '& .MuiListItemIcon-root': {
                                            color: '#FF3D00 !important',
                                        }
                                    }
                                }}
                            >
                                <ListItemIcon>
                                    <Logout fontSize="small" />
                                </ListItemIcon>
                                Logout
                            </MenuItem>
                        </Menu>
                    </Box>

                ) : (
                    <Link href="/login" className="text-white hover:text-purple-400 font-bold">Вход</Link>
                )}
            </Container>
        </Box>
    );
}
