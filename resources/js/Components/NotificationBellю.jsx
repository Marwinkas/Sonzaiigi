import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import SvgIcon from '@mui/material/SvgIcon';
import { keyframes } from '@mui/system';

// 1. Анимация "тряски" колокольчика при наведении (как в аниме)
const shakeAnimation = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(10deg); }
  50% { transform: rotate(-10deg); }
  75% { transform: rotate(5deg); }
  100% { transform: rotate(0deg); }
`;

export default function NotificationBell({color}) {
  const messageCount = 655; // Твое значение

  return (
    <Tooltip title={messageCount > 0 ? `You have ${messageCount} new notification` : "No new notifications"}>
      <IconButton
        aria-label="show new notifications"
        sx={{
          marginRight: "12px",
          color: `hsl(${210 + color}, 100%, 60%)`, // Базовый цвет иконки (голубой)
          transition: '0.3s',
          '&:hover': {
            backgroundColor: `hsla(${210 + color}, 100%, 60%, 0.10)`, // Легкий фон
            color: `hsl(${186 + color}, 100%, 84%)`, // Иконка становится ярко-циановой
            // Применяем анимацию тряски
            animation: `${shakeAnimation} 0.5s ease-in-out both`,
            // Свечение вокруг кнопки
            filter: `drop-shadow(0 0 5px hsla(${210 + color}, 100%, 60%, 0.50))`,
          }
        }}
      >
        <Badge
            badgeContent={messageCount}
            max={99} // Если больше 99, покажет "99+" (чтобы не ломать верстку цифрой 655)
            sx={{
                '& .MuiBadge-badge': {
                    backgroundColor: `hsl(${303 + color}, 100%, 42%)`, // Неоновый розовый (Magenta)
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    // Магическое розовое свечение бейджа
                    boxShadow: `0 0 8px hsla(${303 + color}, 100%, 42%, 0.80)`,
                    border: '1px solid hsla(0, 0%, 100%, 0.20)',
                }
            }}
        >
          {/* Обернул твой SVG в SvgIcon для правильной работы с цветами MUI */}
          <SvgIcon inheritViewBox sx={{ fontSize: 26 }}>
             <path d="M16 19a4 4 0 11-8 0H4.765C3.21 19 2.25 17.304 3.05 15.97l1.806-3.01A1 1 0 005 12.446V8a7 7 0 0114 0v4.446c0 .181.05.36.142.515l1.807 3.01c.8 1.333-.161 3.029-1.716 3.029H16ZM12 3a5 5 0 00-5 5v4.446a3 3 0 01-.428 1.543L4.765 17h14.468l-1.805-3.01A3 3 0 0117 12.445V8a5 5 0 00-5-5Zm-2 16a2 2 0 104 0h-4Z" />
          </SvgIcon>
        </Badge>
      </IconButton>
    </Tooltip>
  );
}
