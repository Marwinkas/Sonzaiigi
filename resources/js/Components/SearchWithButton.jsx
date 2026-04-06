import React from 'react';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';

export default function SearchBar({color}) {
    return (
        <Paper
            component="form"
            sx={{
                p: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                width: 400, // Ширина поиска
                borderRadius: '12px', // Скругление всего блока
                // Цвета фона и границы (Темная тема)
                backgroundColor: `hsla(${211 + color}, 61%, 10%, 0.60)`, // Полупрозрачный темно-синий
                border: `1px solid hsla(${210 + color}, 100%, 60%, 0.20)`, // Тусклая синяя рамка
                boxShadow: 'none',
                transition: '0.3s',
                // Эффект при наведении на ВЕСЬ блок
                '&:hover': {
                    border: `1px solid hsla(${210 + color}, 100%, 60%, 0.50)`,
                    boxShadow: `0 0 8px hsla(${210 + color}, 100%, 60%, 0.10)`,
                },
                // Эффект когда печатаешь внутри (Focus-within)
                '&:focus-within': {
                    border: `1px solid hsl(${210 + color}, 100%, 60%)`, // Яркая неон-граница
                    boxShadow: `0 0 15px hsla(${210 + color}, 100%, 60%, 0.20)`, // Свечение
                }
            }}
        >
            {/* Поле ввода (теперь слева) */}
            <InputBase
                sx={{
                    ml: 2, // Отступ текста от левого края
                    flex: 1, // Занимает все свободное место
                    color: '#F3F6F9', // Белый текст
                    // 👇 ВОТ ЭТА ЧАСТЬ УБИРАЕТ ОБВОДКУ
                    '& .MuiInputBase-input': {
                        outline: 'none',      // Убирает синюю линию браузера
                        boxShadow: 'none',    // Убирает внутренние тени (на всякий случай)
                    },
                    '& input::placeholder': {
                        color: '#B2BAC2', // Цвет плейсхолдера
                        opacity: 0.7,
                    },
                }}
                placeholder="Поиск артов, тегов..."
                inputProps={{ 'aria-label': 'search sonzaiigi' }}
            />

            {/* Разделитель (вертикальная черта), опционально */}
            <div style={{ width: '1px', height: '28px', background: `hsla(${210 + color}, 100%, 60%, 0.20)`, margin: '0 4px' }} />

            {/* Кнопка поиска (справа) */}
            <IconButton
                type="button"
                sx={{
                    p: '10px',
                    color: 'hsl(${210 + color}, 100%, 60%)', // Синяя иконка
                    transition: '0.2s',
                    '&:hover': {
                        color: `hsl(${186 + color}, 100%, 50%)`, // При наведении становится циановой (светлее)
                        background: `hsla(${210 + color}, 100%, 60%, 0.10)`, // Легкий фон при наведении
                    }
                }}
                aria-label="search"
            >
                <SearchIcon />
            </IconButton>
        </Paper>
    );
}
