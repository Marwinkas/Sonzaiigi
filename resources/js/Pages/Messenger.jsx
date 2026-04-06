import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { ThemeProvider } from '@mui/material/styles';
import {
    Box, Container, Paper, Typography, Avatar, IconButton,
    InputBase, List, ListItem, ListItemAvatar, ListItemText,
    Divider, ListItemButton, Tooltip, CircularProgress,
    Menu, MenuItem, Dialog, Popover,Button,Checkbox,FormControlLabel
} from '@mui/material';
import {
    Send, Search, Reply, Close as CloseIcon,
    ContentCopy, Delete, Check, Edit, PushPin, ArrowDownward,
    MoreVert, Person, AttachFile, Mood, GifBox,AddCircle,
    AddReaction, Download, Star, StarBorder,Forward  // <-- Добавили Mood и GifBox
} from '@mui/icons-material';

// --- НОВЫЕ ИМПОРТЫ ДЛЯ ЭМОДЗИ И GIF ---
import EmojiPicker from 'emoji-picker-react';
import { Grid } from '@giphy/react-components';
import { GiphyFetch } from '@giphy/js-fetch-api';

import theme from '../theme';
import Header from '../Components/Header';
import ProfileModal from '../Components/ProfileModal';
import axios from 'axios';

// Инициализация Giphy (пока используем публичный бета-ключ Giphy, ниже расскажу как получить свой)
const gf = new GiphyFetch('fkmVTY91WMHE0sB6SihowYEqcmYKn8qi');

export default function Messenger({ initialChats, activeChatId, initialFavoriteGifs }) {
    const { auth } = usePage().props;
    const [value] = useState(30);

    const [chats, setChats] = useState(initialChats || []);
    const [activeChat, setActiveChat] = useState(chats.find(c => c.id == activeChatId) || chats[0] || null);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMore, setLoadingMore] = useState(false);
const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
const [newGroupName, setNewGroupName] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [hasMoreDown, setHasMoreDown] = useState(false);
    const [isHistoryMode, setIsHistoryMode] = useState(false);

    const scrollRef = useRef(null);
    const lastScrollHeight = useRef(0);
    const lastMessageId = useRef(null);

    const [replyTo, setReplyTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    const fileInputRef = useRef(null);
    const [attachment, setAttachment] = useState(null);
    const [attachmentPreview, setAttachmentPreview] = useState(null);
    const [fullScreenImage, setFullScreenImage] = useState(null);

    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [currentPinIndex, setCurrentPinIndex] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState([]);
    const [mentionIds, setMentionIds] = useState([]);
    const [showScrollDown, setShowScrollDown] = useState(false);

    const [headerMenuAnchor, setHeaderMenuAnchor] = useState(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // --- СТЕЙТЫ ДЛЯ ЭМОДЗИ И GIF ---
    const [emojiAnchor, setEmojiAnchor] = useState(null);
    const [gifAnchor, setGifAnchor] = useState(null);
    const [gifSearch, setGifSearch] = useState('');

    const [reactionPickerAnchor, setReactionPickerAnchor] = useState(null);
    const [reactingMessageId, setReactingMessageId] = useState(null);

// --- ИЗБРАННЫЕ ГИФКИ ---
// Внутри Messenger
const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
const [selectedChatsForForward, setSelectedChatsForForward] = useState([]);
const [includeAuthor, setIncludeAuthor] = useState(true);
const [forwardMessageId, setForwardMessageId] = useState(null);

// Заменяем старый стейт гифок на пропсы от сервера
const [favoriteGifs, setFavoriteGifs] = useState(initialFavoriteGifs || []);
const handleForward = () => {
    axios.post('/messages/forward', {
        message_id: forwardMessageId,
        conversation_ids: selectedChatsForForward,
        include_author: includeAuthor
    }).then(() => {
        setIsForwardModalOpen(false);
        setSelectedChatsForForward([]);
        alert('Сообщение переслано!');
    });
};
    // Сохраняем в память браузера при любом изменении
    useEffect(() => {
        localStorage.setItem('favoriteGifs', JSON.stringify(favoriteGifs));
    }, [favoriteGifs]);
const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    axios.post('/groups/create', { name: newGroupName }).then(res => {
        setIsCreateGroupOpen(false);
        setNewGroupName('');
        // Обновляем страницу, чтобы загрузить новый чат
        router.reload({ only: ['initialChats'] });
    });
};

const handleToggleFavoriteGif = () => {
    const url = contextMenu.msg.gif_url;
    axios.post('/messages/toggle-favorite-gif', { gif_url: url }).then(res => {
        setFavoriteGifs(res.data.favorite_gifs); // Получаем уже отсортированный список
        handleCloseMenu();
    });
};
// --- СКАЧАТЬ И СКОПИРОВАТЬ КАРТИНКУ ---
    const handleDownloadImage = async () => {
        const url = contextMenu.msg.image || contextMenu.msg.gif_url;
        if (!url) return;

        try {
            // Скачиваем файл как Blob, чтобы задать ему нормальное имя
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            const ext = blob.type.split('/')[1] || 'png'; // Узнаем формат (webp, gif, png)
            link.download = `image_${Date.now()}.${ext}`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            // Если политика безопасности браузера (CORS) не даст скачать напрямую (бывает с Giphy),
            // просто откроем картинку в новой вкладке, чтобы юзер мог её сохранить.
            window.open(url, '_blank');
        }
        handleCloseMenu();
    };

    const handleCopyImage = () => {
        const url = contextMenu.msg.image || contextMenu.msg.gif_url;
        if (!url) return;

        // Буфер обмена браузеров обычно принимает только PNG.
        // Поэтому мы рисуем нашу картинку (даже WebP) на невидимом холсте и копируем как PNG.
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Важно для чужих серверов (Giphy)
        img.src = url;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    // Можно добавить красивый toast-уведомление, но пока обойдемся alert
                    // alert('Изображение скопировано в буфер!');
                } catch (e) {
                    console.error('Ошибка буфера:', e);
                    alert('Браузер заблокировал копирование. Попробуйте скачать.');
                }
            }, 'image/png');
        };
        handleCloseMenu();
    };

    // --- ЛОГИКА СЖАТИЯ КАРТИНКИ (WEBP) ---
    const processImage = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                const isPortrait = height > width;
                const maxW = isPortrait ? 1080 : 1920;
                const maxH = isPortrait ? 1920 : 1080;

                if (width > maxW || height > maxH) {
                    const ratio = Math.min(maxW / width, maxH / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                    const compressedFile = new File([blob], newFileName, { type: 'image/webp' });
                    setAttachment(compressedFile);
                    setAttachmentPreview(URL.createObjectURL(compressedFile));
                }, 'image/webp', 0.80);
            };
        };
    };

    const handleFileSelect = (e) => processImage(e.target.files[0]);
    const handlePaste = (e) => {
        if (e.clipboardData.files.length > 0) {
            e.preventDefault();
            processImage(e.clipboardData.files[0]);
        }
    };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) processImage(e.dataTransfer.files[0]);
    };

    const clearAttachment = () => {
        setAttachment(null);
        setAttachmentPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- ФУНКЦИИ ЗАГРУЗКИ ---
    const loadMessagesDown = () => {
        if (!activeChat || loadingMore || !hasMoreDown) return;
        const lastId = messages[messages.length - 1]?.id;
        setLoadingMore(true);

        axios.get(`/messages/${activeChat.id}/more-down?after_id=${lastId}`).then(res => {
            setMessages(prev => {
                const uniqueNew = res.data.messages.filter(nm => !prev.some(p => p.id === nm.id));
                return [...prev, ...uniqueNew];
            });
            setHasMoreDown(res.data.has_more_down);
            setLoadingMore(false);
            if (!res.data.has_more_down) setIsHistoryMode(false);
        });
    };

    const loadMessages = (isFirstLoad = false) => {
        if (!activeChat || (loadingMore && !isFirstLoad)) return;
        const currentOffset = isFirstLoad ? 0 : messages.length;
        if (!isFirstLoad) setLoadingMore(true);

        axios.get(`/messages/${activeChat.id}?offset=${currentOffset}`).then(res => {
            if (isFirstLoad) {
                setMessages(res.data.messages);
                lastMessageId.current = res.data.messages[res.data.messages.length - 1]?.id;
                scrollToBottom(true);
            } else {
                lastScrollHeight.current = scrollRef.current.scrollHeight;
                setMessages(prev => {
                    const uniqueNew = res.data.messages.filter(nm => !prev.some(p => p.id === nm.id));
                    return [...uniqueNew, ...prev];
                });
            }
            setHasMore(res.data.has_more);
            setLoadingMore(false);
        });
    };

    useEffect(() => {
        if (activeChat) axios.get(`/messages/${activeChat.id}/pins`).then(res => setPinnedMessages(res.data));
    }, [activeChat]);

    useEffect(() => {
        setChats(initialChats);
        if (activeChat) {
            const freshActiveChat = initialChats.find(c => c.id === activeChat.id);
            if (freshActiveChat && JSON.stringify(freshActiveChat) !== JSON.stringify(activeChat)) {
                setActiveChat(freshActiveChat);
            }
        }
    }, [initialChats]);

    useEffect(() => {
        setMessages([]);
        setHasMore(true);
        setHasMoreDown(false);
        setIsHistoryMode(false);
        setReplyTo(null);
        setEditingMessage(null);
        setUnreadMessages([]);
        setMentionIds([]);
        clearAttachment();
        loadMessages(true);
    }, [activeChat?.id]);

    // --- ПОЛЛИНГ ---
    useEffect(() => {
        if (!activeChat?.id) return;
        const interval = setInterval(() => {
            axios.get(`/messages/${activeChat.id}?offset=0&limit=10`).then(res => {
                setActiveChat(prev => prev ? { ...prev, can_reply: res.data.can_reply } : null);
                const newMsgs = res.data.messages;

                if (newMsgs.length === 0) {
                    setMessages(prev => {
                        if (prev.length > 0) {
                            setPinnedMessages([]); setUnreadMessages([]); setMentionIds([]); setIsHistoryMode(false);
                            return [];
                        }
                        return prev;
                    });
                    return;
                }

                const latestId = newMsgs[newMsgs.length - 1].id;
                if (latestId !== lastMessageId.current) {
                    setMessages(prev => {
                        if (isHistoryMode) return prev;
                        const filtered = newMsgs.filter(nm => !prev.some(p => p.id === nm.id));
                        return [...prev, ...filtered];
                    });
                    lastMessageId.current = latestId;
                    const newMsgsFromServer = newMsgs.filter(nm => !messages.some(p => p.id === nm.id));

                    if (!showScrollDown && !isHistoryMode) {
                        scrollToBottom(newMsgs[newMsgs.length - 1].senderId === auth.user.id);
                    } else {
                        const newUnread = newMsgsFromServer.filter(m => m.senderId !== auth.user.id).map(m => m.id);
                        if (newUnread.length > 0) setUnreadMessages(prev => [...new Set([...prev, ...newUnread])]);

                        const newMentions = newMsgsFromServer.filter(m => m.is_mention && m.senderId !== auth.user.id).map(m => m.id);
                        if (newMentions.length > 0) setMentionIds(prev => [...new Set([...prev, ...newMentions])]);
                    }
                }
            }).catch(err => console.error("Polling error:", err));
        }, 2000);
        return () => clearInterval(interval);
    }, [activeChat?.id, isHistoryMode, showScrollDown, messages]);

    // --- СКРОЛЛ ---
    const handleScroll = (e) => {
        const container = e.target;
        const scrollFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        setShowScrollDown(scrollFromBottom > 300);

        const clearVisible = (list, setList) => {
            if (list.length === 0) return;
            setList(prev => prev.filter(id => {
                const el = document.getElementById(`msg-${id}`);
                if (!el) return true;
                const rect = el.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                return !(rect.top >= containerRect.top && rect.bottom <= containerRect.bottom);
            }));
        };
        clearVisible(mentionIds, setMentionIds);
        clearVisible(unreadMessages, setUnreadMessages);

        if (pinnedMessages.length > 0 && messages.length > 0) {
            let closestIndex = currentPinIndex;
            let minDistance = Infinity;
            let isAnyPinInDom = false;

            pinnedMessages.forEach((pin, index) => {
                const el = document.getElementById(`msg-${pin.id}`);
                if (el) {
                    isAnyPinInDom = true;
                    const rect = el.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    const distance = Math.abs(rect.top - containerRect.top);
                    if (distance < minDistance) { minDistance = distance; closestIndex = index; }
                }
            });

            if (!isAnyPinInDom) {
                const centerMsg = messages[Math.floor(messages.length / 2)];
                if (centerMsg) {
                    let minIdDiff = Infinity;
                    pinnedMessages.forEach((pin, index) => {
                        const diff = Math.abs(pin.id - centerMsg.id);
                        if (diff < minIdDiff) { minIdDiff = diff; closestIndex = index; }
                    });
                }
            }
            if (closestIndex !== currentPinIndex) setCurrentPinIndex(closestIndex);
        }

        if (container.scrollTop === 0 && hasMore && !loadingMore) loadMessages();
        if (scrollFromBottom < 100 && hasMoreDown && !loadingMore) loadMessagesDown();
        if (scrollFromBottom < 50) { setIsHistoryMode(false); setUnreadMessages([]); }
    };

    const scrollToBottom = (force = false) => {
        const container = scrollRef.current;
        if (!container) return;
        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (force || isAtBottom) {
            setTimeout(() => { container.scrollTo({ top: container.scrollHeight, behavior: force ? 'smooth' : 'auto' }); }, 100);
        }
    };

    // --- ПИНЫ И МЕНШНЫ ---
    const handleTogglePin = () => {
        const msg = contextMenu?.msg;
        if (!msg) return;
        axios.post(`/messages/${msg.id}/pin`).then(res => {
            const pinnedAt = res.data.pinned_at;
            if (pinnedAt) { setPinnedMessages(prev => [{ id: msg.id, text: msg.text, pinned_at: pinnedAt }, ...prev]); }
            else { setPinnedMessages(prev => prev.filter(p => p.id !== msg.id)); setCurrentPinIndex(0); }
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_pinned: !!pinnedAt } : m));
            handleCloseMenu();
        });
    };

    const handleJumpToPin = (pin) => {
        const element = document.getElementById(`msg-${pin.id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.style.backgroundColor = 'rgba(56, 189, 248, 0.3)';
            setTimeout(() => element.style.transition = 'background-color 0.5s', 100);
            setTimeout(() => element.style.backgroundColor = '', 1500);
        } else {
            setLoadingMore(true);
            axios.get(`/messages/${activeChat.id}/context/${pin.id}`).then(res => {
                setMessages(res.data.messages);
                setHasMore(res.data.has_more_up);
                setHasMoreDown(res.data.has_more_down);
                setIsHistoryMode(true);
                setLoadingMore(false);
                setTimeout(() => {
                    const newEl = document.getElementById(`msg-${pin.id}`);
                    newEl?.scrollIntoView({ block: 'center' });
                }, 100);
            });
        }
    };

    const handleJumpToMention = () => { if (mentionIds.length > 0) handleJumpToPin({ id: mentionIds[0] }); };

    // --- ВЗАИМОДЕЙСТВИЕ С СООБЩЕНИЯМИ ---
    const handleContextMenu = (event, msg) => { event.preventDefault(); setContextMenu({ mouseX: event.clientX, mouseY: event.clientY, msg }); };
    const handleCloseMenu = () => setContextMenu(null);
    const handleCopyText = () => { navigator.clipboard.writeText(contextMenu.msg.text); handleCloseMenu(); };
    const handleReplyClick = () => { setReplyTo(contextMenu.msg); handleCloseMenu(); };
    const handleEditClick = () => { setEditingMessage(contextMenu.msg); setNewMessage(contextMenu.msg.text); setReplyTo(null); handleCloseMenu(); };

    const handleDeleteMessage = () => {
        const msgId = contextMenu.msg.id;
        axios.delete(`/messages/${msgId}`).then(() => setMessages(prev => prev.filter(m => m.id !== msgId)));
        handleCloseMenu();
    };
    const handleReact = (messageId, emoji) => {
        axios.post(`/messages/${messageId}/react`, { emoji }).then(res => {
            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, reactions: res.data } : m
            ));
            handleCloseMenu();
        });
    };
    const handleDeleteChat = () => {
        if (!activeChat) return;
        if (window.confirm("Вы уверены, что хотите удалить всю историю переписки? Контакт останется, но сообщения исчезнут навсегда.")) {
            axios.delete(`/conversations/${activeChat.id}`).then(() => {
                setMessages([]); setPinnedMessages([]);
                setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, lastMessage: 'Нет сообщений', time: '' } : c));
                setHeaderMenuAnchor(null);
            });
        }
    };

    // --- ОТПРАВКА ---
    const handleSendMessage = (e, gifUrl = null) => {
        if (e) e.preventDefault();

        // Позволяем отправить, если есть текст, картинка ИЛИ гифка
        if (!newMessage.trim() && !attachment && !gifUrl && !activeChat) return;

        if (editingMessage && !gifUrl) {
            axios.patch(`/messages/${editingMessage.id}`, { text: newMessage }).then(res => {
                setMessages(prev => prev.map(m => m.id === res.data.id ? { ...m, text: res.data.text, is_edited: true } : m));
                setEditingMessage(null);
                setNewMessage('');
            });
        } else {
            const formData = new FormData();
            // Важно: если текста нет, шлем пустую строку, чтобы Laravel не ругался
            formData.append('text', newMessage || '');
            if (replyTo) formData.append('parent_id', replyTo.id);
            if (attachment) formData.append('image', attachment);
            if (gifUrl) formData.append('gif_url', gifUrl);

            setNewMessage('');
            setReplyTo(null);
            clearAttachment();

            axios.post(`/messages/${activeChat.id}`, formData)
                .then(res => {
                    if (isHistoryMode) {
                        setIsHistoryMode(false);
                        setHasMoreDown(false);
                        loadMessages(true);
                    } else {
                        setMessages(prev => [...prev, res.data]);
                        setTimeout(() => scrollToBottom(true), 100);
                    }
                })
                .catch(err => {
                    // ТЕПЕРЬ ТЫ УВИДИШЬ ТОЧНУЮ ПРИЧИНУ В КОНСОЛИ (например, какой именно файл не подошел)
                    if (err.response && err.response.status === 422) {
                        console.error('Ошибка валидации:', err.response.data.errors);
                        alert('Ошибка: ' + Object.values(err.response.data.errors).flat().join(', '));
                    } else {
                        console.error('Ошибка сервера:', err);
                    }
                });
        }
    };

    // Отправка GIF по клику в пикере
    const handleGifClick = (gif, e) => {
        e.preventDefault();
        setGifAnchor(null); // Закрываем пикер
        handleSendMessage(null, gif.images.fixed_height.url); // Отправляем как GIF
    };

    useEffect(() => {
        if (lastScrollHeight.current > 0 && !loadingMore) {
            const newHeight = scrollRef.current.scrollHeight;
            scrollRef.current.scrollTop = newHeight - lastScrollHeight.current;
            lastScrollHeight.current = 0;
        }
    }, [messages, loadingMore]);

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ height: '100vh', bgcolor: `hsl(${214 + value}, 67%, 5%)`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onDragOver={handleDragOver} onDrop={handleDrop}>
                <Head title="Сообщения" />
                <Header color={value} />

                <Container maxWidth={false} sx={{ mt: 2, mb: 2, flex: 1, display: 'flex', overflow: 'hidden' }}>
                    <Paper sx={{ flex: 1, display: 'flex', borderRadius: 4, overflow: 'hidden', bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', height: 'calc(100vh - 120px)' }}>

                        {/* ЛЕВАЯ ПАНЕЛЬ ЧАТОВ */}
                        <Box sx={{ width: { xs: '80px', md: '350px' }, borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a' }}>
                            <Box sx={{ p: 2, display: { xs: 'none', md: 'block' } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#1e293b', borderRadius: 5, px: 2, py: 1 }}>
                                    <Search sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />
                                    <InputBase placeholder="Поиск..." sx={{ color: 'white', flex: 1, fontSize: '0.9rem' }} />
                                </Box>
                                <Button
                                fullWidth
                                startIcon={<AddCircle />}
                                onClick={() => setIsCreateGroupOpen(true)}
                                sx={{ mt: 1, bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', textTransform: 'none', '&:hover': { bgcolor: '#0ea5e9' } }}
                            >
                                Создать группу
                            </Button>
                            </Box>
                            <List sx={{ flex: 1, overflowY: 'auto' }}>
                                {chats.map((chat) => (
                                    <ListItemButton key={chat.id} selected={activeChat?.id === chat.id} onClick={() => setActiveChat(chat)} sx={{ px: 2, py: 1.5 }}>
                                        <ListItemAvatar>
                                            <Avatar src={chat.avatar}>{chat.name?.[0]}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            sx={{ display: { xs: 'none', md: 'block' } }}
                                            primary={<Typography noWrap sx={{ color: 'white', fontWeight: 600 }}>{chat.name}</Typography>}
                                            secondary={<Typography noWrap sx={{ color: '#64748b', fontSize: '0.8rem' }}>{chat.lastMessage}</Typography>}
                                        />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Box>

                        {/* ПРАВАЯ ПАНЕЛЬ (ЧАТ) */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#1e293b', position: 'relative' }}>
                            {activeChat ? (
                                <>
                                    {/* ИНТЕРАКТИВНАЯ ШАПКА ЧАТА */}
                                    <Box sx={{ p: 1.5, px: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box onClick={() => {
    if (activeChat.is_group) {
        const link = `${window.location.origin}/join/${activeChat.invite_token}`;
        navigator.clipboard.writeText(link);
        alert('Ссылка-приглашение скопирована!');
    } else {
        setIsProfileModalOpen(true);
    }
}} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { opacity: 0.8 }, transition: 'opacity 0.2s' }}>
    <Avatar src={activeChat.avatar} sx={{ mr: 2, bgcolor: activeChat.is_group ? '#f59e0b' : '#38bdf8', color: '#0f172a' }}>
        {activeChat.name?.[0]}
    </Avatar>
    <Box>
        <Typography sx={{ color: 'white', fontWeight: 'bold', lineHeight: 1.2 }}>{activeChat.name}</Typography>
        <Typography sx={{ color: activeChat.is_group ? '#f59e0b' : '#38bdf8', fontSize: '0.75rem' }}>
            {activeChat.is_group ? 'Кликни, чтобы скопировать ссылку' : 'Посмотреть профиль'}
        </Typography>
    </Box>
</Box>
                                    </Box>

                                    {/* ПАНЕЛЬ ЗАКРЕПА */}
                                    {pinnedMessages.length > 0 && (
                                        <Box sx={{
                                            bgcolor: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer',
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }
                                        }} onClick={() => handleJumpToPin(pinnedMessages[currentPinIndex])}>
                                            <PushPin sx={{ color: '#38bdf8', fontSize: 18, transform: 'rotate(45deg)' }} />
                                            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                                <Typography sx={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 'bold' }}>Закрепленное сообщение #{pinnedMessages.length - currentPinIndex}</Typography>
                                                <Typography noWrap sx={{ color: 'white', fontSize: '0.85rem', opacity: 0.8 }}>{pinnedMessages[currentPinIndex]?.text || 'Вложение'}</Typography>
                                            </Box>
                                            {pinnedMessages.length > 1 && (
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setCurrentPinIndex((prev) => (prev + 1) % pinnedMessages.length); }}>
                                                    <CloseIcon fontSize="small" sx={{ transform: 'rotate(45deg)', color: '#94a3b8' }} />
                                                </IconButton>
                                            )}
                                        </Box>
                                    )}

                                    {/* ОБЛАСТЬ СООБЩЕНИЙ */}
                                    <Box ref={scrollRef} onScroll={handleScroll} sx={{ flex: 1, p: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#0b1120', pb: 4 }}>
                                        {loadingMore && <Box sx={{ textAlign: 'center', py: 1 }}><CircularProgress size={20} color="primary" /></Box>}

                                        {messages.map((msg) => {
                                            const isMe = msg.senderId === auth.user.id;
                                            return (
                                                <Box key={msg.id} id={`msg-${msg.id}`} onContextMenu={(e) => handleContextMenu(e, msg)} sx={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%', cursor: 'context-menu' }}>
                                                    <Box sx={{
                                                        p: 1.5, borderRadius: 3, bgcolor: isMe ? '#38bdf8' : '#1e293b', color: isMe ? '#040b14' : 'white',
                                                        borderBottomRightRadius: isMe ? 4 : 12, borderBottomLeftRadius: !isMe ? 4 : 12, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                    }}>
                                                        {/* ИМЯ И АВАТАР В ГРУППЕ */}
{!isMe && activeChat.is_group && (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, ml: 1 }}>
        <Avatar src={msg.senderAvatar} sx={{ width: 20, height: 20, bgcolor: '#94a3b8' }}>{msg.senderName?.[0]}</Avatar>
        <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold' }}>{msg.senderName}</Typography>
    </Box>
)}
{msg.forwarded_from && (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3, ml: isMe ? 0 : 1, opacity: 0.6 }}>
        <Reply sx={{ fontSize: 14, transform: 'scaleX(-1)' }} />
        <Typography sx={{ fontSize: '0.7rem', fontStyle: 'italic' }}>
            Переслано от {msg.forwarded_from}
        </Typography>
    </Box>
)}
                                                        {msg.reply_to && (
                                                            <Box sx={{ mb: 1, p: 1, bgcolor: 'rgba(0,0,0,0.1)', borderLeft: '2px solid', borderColor: isMe ? '#040b14' : '#38bdf8', borderRadius: 1, opacity: 0.8 }}>
                                                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: isMe ? '#040b14' : '#38bdf8' }}>{msg.reply_to.name}</Typography>
                                                                <Typography noWrap sx={{ fontSize: '0.75rem' }}>{msg.reply_to.text || 'Вложение'}</Typography>
                                                            </Box>
                                                        )}

                                                        {/* ОТОБРАЖЕНИЕ ФОТОГРАФИИ ИЛИ GIF */}
                                                        {(msg.image || msg.gif_url) && (
                                                            <Box sx={{ mb: msg.text ? 1 : 0, borderRadius: 2, overflow: 'hidden', bgcolor: 'rgba(0,0,0,0.2)', display: 'inline-block' }}>
                                                                <img
                                                                    src={msg.gif_url || msg.image}
                                                                    alt="Attachment"
                                                                    onClick={() => setFullScreenImage(msg.gif_url || msg.image)}
                                                                    style={{ maxWidth: '350px', maxHeight: '350px', width: 'auto', height: 'auto', display: 'block', borderRadius: '8px', objectFit: 'contain', cursor: 'pointer', transition: 'opacity 0.2s' }}
                                                                    onMouseOver={(e) => e.target.style.opacity = 0.85}
                                                                    onMouseOut={(e) => e.target.style.opacity = 1}
                                                                />
                                                            </Box>
                                                        )}

                                                        {msg.text && (
                                                            <Typography sx={{ fontSize: '0.95rem', wordBreak: 'break-word' }}>
                                                                {msg.text.split(' ').map((word, i) => word.startsWith('@') ? <span key={i} style={{ color: isMe ? '#1e3a8a' : '#38bdf8', fontWeight: 'bold' }}>{word} </span> : word + ' ')}
                                                            </Typography>
                                                        )}
                                                        {/* РЕАКЦИИ ПОД ТЕКСТОМ */}
                                                        {msg.reactions && msg.reactions.length > 0 && (
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px', mt: 1 }}>
                                                                {msg.reactions.map((r) => {
                                                                    // Динамические цвета в зависимости от фона сообщения
                                                                    const bgColors = isMe
                                                                        ? { active: 'rgba(4, 11, 20, 0.15)', inactive: 'rgba(4, 11, 20, 0.05)', hover: 'rgba(4, 11, 20, 0.1)' }
                                                                        : { active: 'rgba(56, 189, 248, 0.2)', inactive: 'rgba(255, 255, 255, 0.05)', hover: 'rgba(255, 255, 255, 0.1)' };

                                                                    const textColors = isMe
                                                                        ? { active: '#040b14', inactive: 'rgba(4, 11, 20, 0.6)' }
                                                                        : { active: '#38bdf8', inactive: '#94a3b8' };

                                                                    const borderColors = isMe
                                                                        ? { active: 'rgba(4, 11, 20, 0.3)', inactive: 'transparent' }
                                                                        : { active: '#38bdf8', inactive: 'transparent' };

                                                                    return (
                                                                        <Box
                                                                            key={r.emoji}
                                                                            onClick={(e) => { e.stopPropagation(); handleReact(msg.id, r.emoji); }}
                                                                            sx={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: 0.5,
                                                                                px: 1, // Чуть шире по бокам
                                                                                py: 0.3,
                                                                                borderRadius: '12px', // Делаем их круглыми "таблеточками"
                                                                                bgcolor: r.reacted_by_me ? bgColors.active : bgColors.inactive,
                                                                                border: '1px solid',
                                                                                borderColor: r.reacted_by_me ? borderColors.active : borderColors.inactive,
                                                                                cursor: 'pointer',
                                                                                transition: 'all 0.2s',
                                                                                '&:hover': { bgcolor: bgColors.hover, transform: 'scale(1.05)' } // Легкое увеличение при наведении
                                                                            }}
                                                                        >
                                                                            <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>{r.emoji}</Typography>
                                                                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 'bold', color: r.reacted_by_me ? textColors.active : textColors.inactive }}>
                                                                                {r.count}
                                                                            </Typography>
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Box>
                                                        )}
                                                        <Typography sx={{ fontSize: '0.7rem', opacity: 0.6, textAlign: 'right', mt: 0.5 }}>{msg.time}</Typography>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>

                                    {/* ПЛАВАЮЩИЕ КНОПКИ (@ и Вниз) */}
                                    <Box sx={{ position: 'absolute', bottom: 120, right: 20, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                                        {mentionIds.length > 0 && (
                                            <Tooltip title="Перейти к упоминанию" placement="left">
                                                <Box sx={{ position: 'relative' }}>
                                                    <IconButton onClick={handleJumpToMention} sx={{ bgcolor: '#1e293b', color: '#38bdf8', border: '2px solid #38bdf8', '&:hover': { bgcolor: '#334155' }, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                                                        <Typography sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>@</Typography>
                                                    </IconButton>
                                                    <Box sx={{ position: 'absolute', top: -5, right: -5, bgcolor: '#ef4444', color: 'white', borderRadius: '50%', minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', px: 0.5 }}>{mentionIds.length}</Box>
                                                </Box>
                                            </Tooltip>
                                        )}
                                        {showScrollDown && (
                                            <Box sx={{ position: 'relative', mt: 1 }}>
                                                <IconButton onClick={() => { setIsHistoryMode(false); loadMessages(true); setShowScrollDown(false); setUnreadMessages([]); }} sx={{ bgcolor: '#38bdf8', color: '#0f172a', '&:hover': { bgcolor: '#7dd3fc' }, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                                                    <ArrowDownward />
                                                </IconButton>
                                                {unreadMessages.length > 0 && (
                                                    <Box sx={{ position: 'absolute', top: -8, left: -8, bgcolor: '#10b981', color: 'white', borderRadius: '10px', minWidth: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', px: 1, boxShadow: '0 2px 5px rgba(0,0,0,0.3)', border: '2px solid #1e293b' }}>
                                                        {unreadMessages.length}
                                                    </Box>
                                                )}
                                            </Box>
                                        )}
                                    </Box>

                                    {/* ПОДВАЛ (Поле ввода) */}
                                    <Box sx={{ p: 2, bgcolor: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        {attachmentPreview && (
                                            <Box sx={{ p: 1, px: 2, bgcolor: 'rgba(56, 189, 248, 0.05)', borderLeft: '3px solid #38bdf8', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1, borderRadius: '4px 4px 0 0' }}>
                                                <Box sx={{ display: 'flex', gap: 2 }}>
                                                    <img src={attachmentPreview} alt="Preview" style={{ height: '60px', borderRadius: '4px', objectFit: 'cover' }} />
                                                    <Box>
                                                        <Typography sx={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 'bold' }}>Прикрепленное изображение</Typography>
                                                        <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>{attachment.name}</Typography>
                                                    </Box>
                                                </Box>
                                                <IconButton size="small" onClick={clearAttachment} sx={{ color: '#64748b' }}><CloseIcon fontSize="small" /></IconButton>
                                            </Box>
                                        )}
                                        {editingMessage && (
                                            <Box sx={{ p: 1, px: 2, bgcolor: 'rgba(56, 189, 248, 0.05)', borderLeft: '3px solid #38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                                                    <Edit sx={{ color: '#38bdf8', fontSize: 18 }} />
                                                    <Box sx={{ overflow: 'hidden' }}>
                                                        <Typography sx={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 'bold' }}>Редактировать сообщение</Typography>
                                                        <Typography noWrap sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>{editingMessage.text}</Typography>
                                                    </Box>
                                                </Box>
                                                <IconButton size="small" onClick={() => { setEditingMessage(null); setNewMessage(''); }} sx={{ color: '#64748b' }}><CloseIcon fontSize="small" /></IconButton>
                                            </Box>
                                        )}
                                        {replyTo && !editingMessage && (
                                            <Box sx={{ p: 1, px: 2, bgcolor: 'rgba(255,255,255,0.05)', borderLeft: '3px solid #38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, borderRadius: '4px 4px 0 0' }}>
                                                <Box sx={{ overflow: 'hidden' }}>
                                                    <Typography sx={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: 'bold' }}>Ответ {replyTo.senderId === auth.user.id ? 'себе' : replyTo.name || activeChat.name}</Typography>
                                                    <Typography noWrap sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>{replyTo.text || 'Вложение'}</Typography>
                                                </Box>
                                                <IconButton size="small" onClick={() => setReplyTo(null)} sx={{ color: '#64748b' }}><CloseIcon fontSize="small" /></IconButton>
                                            </Box>
                                        )}

                                        {activeChat.can_reply ? (
                                            <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>

                                                {/* КНОПКА ЭМОДЗИ */}
                                                <IconButton onClick={(e) => setEmojiAnchor(e.currentTarget)} sx={{ color: '#94a3b8', '&:hover': { color: '#f59e0b' } }}>
                                                    <Mood />
                                                </IconButton>

                                                {/* КНОПКА GIF */}
                                                <IconButton onClick={(e) => setGifAnchor(e.currentTarget)} sx={{ color: '#94a3b8', '&:hover': { color: '#a855f7' } }}>
                                                    <GifBox />
                                                </IconButton>

                                                {/* КНОПКА СКРЕПКИ (ФОТО) */}
                                                <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileSelect} />
                                                <IconButton onClick={() => fileInputRef.current.click()} sx={{ color: '#94a3b8', '&:hover': { color: '#38bdf8' } }}>
                                                    <AttachFile />
                                                </IconButton>

                                                <InputBase
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    onPaste={handlePaste}
                                                    placeholder="Написать сообщение..."
                                                    fullWidth
                                                    sx={{ bgcolor: '#1e293b', color: 'white', px: 2, py: 1, borderRadius: 2 }}
                                                />
                                                <IconButton type="submit" disabled={!newMessage.trim() && !attachment} sx={{ bgcolor: '#38bdf8', color: '#040b14', '&:hover': { bgcolor: '#7dd3fc' }, '&.Mui-disabled': { bgcolor: 'rgba(56, 189, 248, 0.3)' } }}>
                                                    {editingMessage ? <Check /> : <Send />}
                                                </IconButton>
                                            </Box>
                                        ) : (
                                            <Typography align="center" color="error" sx={{ fontSize: '0.85rem', opacity: 0.8, py: 1 }}>Вы не можете писать в этот чат (требуется взаимная подписка)</Typography>
                                        )}
                                    </Box>
                                </>
                            ) : (
                                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Выберите чат для начала общения</Box>
                            )}
                        </Box>
                    </Paper>
                </Container>
            </Box>
<Dialog open={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} PaperProps={{ sx: { bgcolor: '#1e293b', color: 'white', borderRadius: 3, p: 2, minWidth: 300 } }}>
    <Typography variant="h6" fontWeight="bold" mb={2}>Новая группа</Typography>
    <InputBase
        value={newGroupName}
        onChange={e => setNewGroupName(e.target.value)}
        placeholder="Название группы..."
        fullWidth
        sx={{ bgcolor: '#0f172a', color: 'white', px: 2, py: 1, borderRadius: 2, mb: 3 }}
    />
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button onClick={() => setIsCreateGroupOpen(false)} sx={{ color: '#94a3b8', textTransform: 'none' }}>Отмена</Button>
        <Button onClick={handleCreateGroup} variant="contained" disabled={!newGroupName.trim()} sx={{ bgcolor: '#38bdf8', color: '#0f172a', textTransform: 'none', '&:hover': { bgcolor: '#0ea5e9' } }}>Создать</Button>
    </Box>
</Dialog>
            {/* МЕНЮ ШАПКИ ЧАТА */}
            <Menu anchorEl={headerMenuAnchor} open={Boolean(headerMenuAnchor)} onClose={() => setHeaderMenuAnchor(null)} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} PaperProps={{ sx: { bgcolor: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', minWidth: 150, mt: 1 } }}>
                <MenuItem onClick={() => { setIsProfileModalOpen(true); setHeaderMenuAnchor(null); }} sx={{ gap: 1.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                    <Person fontSize="small" sx={{ color: '#38bdf8' }} /> Посмотреть профиль
                </MenuItem>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                <MenuItem onClick={handleDeleteChat} sx={{ gap: 1.5, color: '#ef4444', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}>
                    <Delete fontSize="small" /> Очистить историю
                </MenuItem>
            </Menu>

            {/* КОНТЕКСТНОЕ МЕНЮ СООБЩЕНИЙ */}
            <Menu open={contextMenu !== null} onClose={handleCloseMenu} anchorReference="anchorPosition" anchorPosition={contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined} PaperProps={{ sx: { bgcolor: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', minWidth: 150 } }}>
                <Box sx={{ display: 'flex', gap: 0.5, px: 2, py: 1, bgcolor: 'rgba(255,255,255,0.02)', alignItems: 'center' }}>
                    {['❤️', '👍', '🔥', '😂', '😮', '😢'].map(emoji => (
                        <IconButton
                            key={emoji}
                            size="small"
                            onClick={() => handleReact(contextMenu.msg.id, emoji)}
                            sx={{ fontSize: '1.2rem', '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.1)' } }}
                        >
                            {emoji}
                        </IconButton>
                    ))}

                    <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 0.5 }} />

                    {/* КНОПКА "+" ДЛЯ ВСЕХ ЭМОДЗИ */}
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            setReactionPickerAnchor(e.currentTarget);
                            setReactingMessageId(contextMenu.msg.id);
                        }}
                        sx={{ bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.2)' } }}
                    >
                        <AddReaction fontSize="small" sx={{ color: '#94a3b8' }} />
                    </IconButton>
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                <MenuItem onClick={handleReplyClick} sx={{ gap: 1.5 }}><Reply fontSize="small" sx={{ color: '#38bdf8' }} /> Ответить</MenuItem>
                <MenuItem onClick={() => { setForwardMessageId(contextMenu.msg.id); setIsForwardModalOpen(true); handleCloseMenu(); }} sx={{ gap: 1.5 }}>
    <Forward fontSize="small" sx={{ color: '#38bdf8' }} /> Переслать
</MenuItem>
                <MenuItem onClick={handleCopyText} sx={{ gap: 1.5 }}><ContentCopy fontSize="small" sx={{ color: '#94a3b8' }} /> Копировать текст</MenuItem>
                {(contextMenu?.msg?.image || contextMenu?.msg?.gif_url) && [
                    <MenuItem key="download" onClick={handleDownloadImage} sx={{ gap: 1.5 }}>
                        <Download fontSize="small" sx={{ color: '#10b981' }} /> Скачать изображение
                    </MenuItem>,
                    <MenuItem key="copy-img" onClick={handleCopyImage} sx={{ gap: 1.5 }}>
                        <ContentCopy fontSize="small" sx={{ color: '#f59e0b' }} /> Копировать изображение
                    </MenuItem>
                ]}
                {contextMenu?.msg?.gif_url && (
                    <MenuItem key="fav-gif" onClick={handleToggleFavoriteGif} sx={{ gap: 1.5 }}>
                        {favoriteGifs.includes(contextMenu.msg.gif_url) ? (
                            <><Star fontSize="small" sx={{ color: '#f59e0b' }} /> Убрать из избранного</>
                        ) : (
                            <><StarBorder fontSize="small" sx={{ color: '#f59e0b' }} /> В избранное</>
                        )}
                    </MenuItem>
                )}
                <MenuItem onClick={handleTogglePin} sx={{ gap: 1.5 }}>
                    <PushPin fontSize="small" sx={{ color: contextMenu?.msg.is_pinned ? '#38bdf8' : '#94a3b8', transform: 'rotate(45deg)' }} />
                    <Typography>{contextMenu?.msg.is_pinned ? 'Открепить' : 'Закрепить'}</Typography>
                </MenuItem>
                {contextMenu?.msg?.senderId === auth.user.id && [
                    <Divider key="div" sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />,
                    <MenuItem key="edit" onClick={handleEditClick} sx={{ gap: 1.5 }}><Edit fontSize="small" sx={{ color: '#38bdf8' }} /> Редактировать</MenuItem>,
                    <MenuItem key="delete" onClick={handleDeleteMessage} sx={{ gap: 1.5, color: '#ef4444' }}><Delete fontSize="small" sx={{ color: '#ef4444' }} /> Удалить</MenuItem>
                ]}
            </Menu>

            {/* ВСПЛЫВАЮЩЕЕ ОКНО: EMOJI */}
            <Popover open={Boolean(emojiAnchor)} anchorEl={emojiAnchor} onClose={() => setEmojiAnchor(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} transformOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ mt: -1 }}>
                <EmojiPicker theme="dark" onEmojiClick={(e) => setNewMessage(prev => prev + e.emoji)} />
            </Popover>

            {/* ВСПЛЫВАЮЩЕЕ ОКНО: GIF (Giphy) */}
            {/* ВСПЛЫВАЮЩЕЕ ОКНО: GIF (Избранное + Поиск) */}
            <Popover open={Boolean(gifAnchor)} anchorEl={gifAnchor} onClose={() => setGifAnchor(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} transformOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ mt: -1 }} PaperProps={{ sx: { bgcolor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 } }}>
                <Box sx={{ p: 2, width: 300, height: 400, display: 'flex', flexDirection: 'column' }}>
                    <InputBase
                        placeholder="Поиск GIF..."
                        value={gifSearch}
                        onChange={(e) => setGifSearch(e.target.value)}
                        fullWidth
                        sx={{ mb: 2, color: 'white', bgcolor: '#1e293b', px: 1.5, py: 0.5, borderRadius: 2 }}
                    />

                    <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                        {!gifSearch ? (
                            // ПОКАЗЫВАЕМ ИЗБРАННОЕ (Если поиск пустой)
                            favoriteGifs.length > 0 ? (
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                                    {favoriteGifs.map(url => (
                                        <img
                                            key={url}
                                            src={url}
                                            alt="Favorite GIF"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setGifAnchor(null);
                                                handleSendMessage(null, url); // Отправляем в чат
                                            }}
                                            style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer' }}
                                        />
                                    ))}
                                </Box>
                            ) : (
                                <Typography sx={{ color: '#64748b', textAlign: 'center', mt: 4, fontSize: '0.85rem' }}>
                                    Здесь будут ваши любимые гифки.<br/><br/>Сохраняйте их через<br/>правую кнопку мыши в чате!
                                </Typography>
                            )
                        ) : (
                            // ПОКАЗЫВАЕМ ПОИСК GIPHY (Скрываем авторов через жесткий CSS)
                            <Box sx={{
                                '& [class*="attribution"]': { display: 'none !important' }, // Скрываем имя автора
                                '& [class*="overlay"]': { display: 'none !important' },     // Скрываем затемнение
                                '& .giphy-gif': { cursor: 'pointer' }
                            }}>
                                <Grid
                                    width={268}
                                    columns={2}
                                    fetchGifs={(offset) => gf.search(gifSearch, { offset, limit: 10 })}
                                    onGifClick={handleGifClick}
                                    key={gifSearch}
                                    noLink={true} // Отключаем ссылки Giphy
                                />
                            </Box>
                        )}
                    </Box>
                </Box>
            </Popover>
{/* ВСПЛЫВАЮЩЕЕ ОКНО: ЛЮБАЯ РЕАКЦИЯ ИЗ СПИСКА */}
            <Popover
                open={Boolean(reactionPickerAnchor)}
                anchorEl={reactionPickerAnchor}
                onClose={() => {
                    setReactionPickerAnchor(null);
                    setReactingMessageId(null);
                }}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{ mt: -1 }}
            >
                <EmojiPicker
                    theme="dark"
                    onEmojiClick={(e) => {
                        handleReact(reactingMessageId, e.emoji); // Отправляем выбранный эмодзи
                        setReactionPickerAnchor(null);           // Закрываем пикер
                        setReactingMessageId(null);              // Очищаем ID
                    }}
                />
            </Popover>
            {/* МОДАЛКА НА ВЕСЬ ЭКРАН (ФОТО И GIF) */}
            <Dialog open={Boolean(fullScreenImage)} onClose={() => setFullScreenImage(null)} maxWidth="xl" PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' } }}>
                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <IconButton onClick={() => setFullScreenImage(null)} sx={{ position: 'absolute', top: 8, right: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}><CloseIcon /></IconButton>
                    <img src={fullScreenImage} alt="Full screen view" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} />
                </Box>
            </Dialog>

            {activeChat && activeChat.user && (
                <ProfileModal open={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} profileUser={activeChat.user} />
            )}


            <Dialog open={isForwardModalOpen} onClose={() => setIsForwardModalOpen(false)} PaperProps={{ sx: { bgcolor: '#1e293b', color: 'white', borderRadius: 3, width: 400 } }}>
    <Box sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight="bold">Переслать сообщение</Typography>
        <List sx={{ maxHeight: 300, overflow: 'auto', my: 2 }}>
            {chats.map(chat => (
                <ListItemButton key={chat.id} onClick={() => {
                    setSelectedChatsForForward(prev =>
                        prev.includes(chat.id) ? prev.filter(id => id !== chat.id) : [...prev, chat.id]
                    );
                }}>
                    <Avatar src={chat.avatar} sx={{ mr: 2 }} />
                    <ListItemText primary={chat.name} />
                    <Checkbox checked={selectedChatsForForward.includes(chat.id)} sx={{ color: '#38bdf8' }} />
                </ListItemButton>
            ))}
        </List>

        <Box sx={{ px: 1, mb: 2 }}>
            <FormControlLabel
                control={<Checkbox checked={includeAuthor} onChange={e => setIncludeAuthor(e.target.checked)} sx={{ color: '#38bdf8' }} />}
                label={<Typography sx={{ fontSize: '0.9rem' }}>Показывать автора сообщения</Typography>}
            />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setIsForwardModalOpen(false)} sx={{ color: '#94a3b8' }}>Отмена</Button>
            <Button
                variant="contained"
                onClick={handleForward}
                disabled={selectedChatsForForward.length === 0}
                sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}
            >
                Переслать ({selectedChatsForForward.length})
            </Button>
        </Box>
    </Box>
</Dialog>

        </ThemeProvider>
    );
}
