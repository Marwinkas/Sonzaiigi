import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import myImage from '../logo2.webp';
// 1. Стилизуем Логотип (Текст)
const LogoText = styled(Typography)(({ theme,color }) => ({
    // Убираем variant отсюда, ставим настройки шрифта вручную для точности
    fontWeight: 900,
    fontSize: '1.5rem', // Размер h5/h6
    textTransform: 'uppercase', // Делаем капсом, как серьезный бренд
    letterSpacing: '0.1rem', // Немного воздуха между буквами

    // Градиент текста

    background: `linear-gradient(45deg, hsl(${210+color}, 100%, 60%) 30%, hsl(${186+color} , 100%, 50%) 90%)`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',

    // Важно: обычный text-shadow не работает с прозрачным текстом (transparent text fill).
    // Используем drop-shadow фильтр для свечения
    filter: 'drop-shadow(0 0 2px rgba(51, 153, 255, 0.5))',

    cursor: 'pointer', // Чтобы было понятно, что можно кликнуть (домой)
    userSelect: 'none', // Чтобы не выделялся при клике
}));

// 2. Стилизуем Иконку Логотипа (Картинку)
const LogoIcon = styled(Box)(({ theme,color }) => ({
    height: '40px',
    width: '40px',
    transition: 'transform 0.4s ease', // Плавная анимация
    // При наведении иконка чуть поворачивается (игривый эффект)
    '&:hover': {
        transform: 'rotate(10deg) scale(1.1)',
        filter: `drop-shadow(0 0 8px hsla(${186 + color}, 100%, 50%, 0.60))`,
    }
}));

// 3. Использование в компоненте
export default function HeaderLogo({ color }) {
    return (
        <Box display={"flex"} alignItems={"center"} gap={1.5}>
            {/* Картинка */}
            <LogoIcon
                component="img"
                src={myImage} // Твой импорт
                alt="Sonzaiigi Logo"
            />

            {/* Текст */}
            <LogoText variant="h6" component="span" color={color}>
                SONZAIIGI
            </LogoText>
        </Box>
    );
}
