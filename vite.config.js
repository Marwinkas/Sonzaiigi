import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    // Настраиваем сервер для работы внутри Docker без конфликтов
    server: {
        host: '0.0.0.0', // Позволяет Docker контейнеру "видеть" запросы
        port: 5173,
        cors: true, // Самое главное: разрешаем cross-origin запросы!
        hmr: {
            host: 'localhost', // Говорим браузеру, где искать обновления
        },
    },
});
