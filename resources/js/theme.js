import { createTheme, alpha } from '@mui/material/styles';
const colors = {
    bgDark: '#040B14',    // Самый темный фон
    bgPaper: '#0A1929',   // Фон карточек
    primary: '#3399FF',   // Основной голубой
    secondary: '#D600CC', // Розовый акцент
    textMain: '#F3F6F9',  // Почти белый текст
    textSec: '#B2BAC2',   // Серый текст
};
const theme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: colors.bgDark,
            paper: colors.bgPaper,
        },
        primary: {
            main: colors.primary,
            light: '#66B2FF',
            dark: '#1769AA',
            contrastText: '#000000', // Черный текст на голубой кнопке читается лучше
        },
        secondary: {
            main: colors.secondary,
            light: '#FF61FF',
            dark: '#9E0099',
        },
        text: {
            primary: colors.textMain,
            secondary: colors.textSec,
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 800,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8, // Скругленные, но не круглые углы (техно-стиль)
                    textTransform: 'none', // Отключаем капс, чтобы выглядело дружелюбнее
                    fontWeight: 600,
                },
                containedPrimary: {
                    // Градиент для основной кнопки (очень по-анимешному)
                    background: `linear-gradient(45deg, ${colors.primary} 30%, #00E5FF 90%)`,
                    boxShadow: `0 3px 5px 2px ${alpha(colors.primary, 0.3)}`, // Свечение
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none', // Убираем дефолтный градиент MUI
                },
            },
        },
    },
});

export default theme;
