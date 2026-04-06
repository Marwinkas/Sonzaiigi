import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { ThemeProvider } from '@mui/material/styles';
import {
    Box, Container, Paper, Typography, Avatar, IconButton,
    InputBase, List, ListItem, ListItemAvatar, ListItemText,
    Divider, ListItemButton, Tooltip, CircularProgress,
    Menu, MenuItem
} from '@mui/material';
import {
    Send, Search, Reply, Close as CloseIcon,
    ContentCopy, Delete, Check, Edit, PushPin, ArrowDownward,
    MoreVert, Person, AttachFile // <-- Добавили AttachFile
} from '@mui/icons-material';

import theme from '../theme';
import Header from '../Components/Header';
import ProfileModal from '../Components/ProfileModal';
import axios from 'axios';

export default function Messenger({ initialChats, activeChatId }) {
    const { auth } = usePage().props;
    const [value] = useState(30);

    const [chats, setChats] = useState(initialChats || []);
    const [activeChat, setActiveChat] = useState(chats.find(c => c.id == activeChatId) || chats[0] || null);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMore, setLoadingMore] = useState(false);

    const [hasMore, setHasMore] = useState(true);
    const [hasMoreDown, setHasMoreDown] = useState(false);
    const [isHistoryMode, setIsHistoryMode] = useState(false);

    const scrollRef = useRef(null);
    const lastScrollHeight = useRef(0);
    const lastMessageId = useRef(null);

    const [replyTo, setReplyTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    // --- СТЕЙТЫ ДЛЯ КАРТИНОК ---
    const fileInputRef = useRef(null);
    const [attachment, setAttachment] = useState(null); // Сама сжатая картинка (File)
    const [attachmentPreview, setAttachmentPreview] = useState(null); // URL для превью

    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [currentPinIndex, setCurrentPinIndex] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState([]);
    const [mentionIds, setMentionIds] = useState([]);
    const [showScrollDown, setShowScrollDown] = useState(false);

    const [headerMenuAnchor, setHeaderMenuAnchor] = useState(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // --- ЛОГИКА СЖАТИЯ И ДОБАВЛЕНИЯ КАРТИНКИ ---
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

                // Определяем ориентацию и макс. размеры
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

                // Конвертируем canvas обратно в файл (качество 85%)
                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, { type: file.type });
                    setAttachment(compressedFile);
                    setAttachmentPreview(URL.createObjectURL(compressedFile));
                }, file.type, 0.85);
            };
        };
    };

    const handleFileSelect = (e) => processImage(e.target.files[0]);

    // Ctrl+V
    const handlePaste = (e) => {
        if (e.clipboardData.files.length > 0) {
            e.preventDefault(); // Останавливаем вставку имени файла в текст
            processImage(e.clipboardData.files[0]);
        }
    };

    // Drag & Drop
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

    // Загрузка пинов при входе
    useEffect(() => {
        if (activeChat) {
            axios.get(`/messages/${activeChat.id}/pins`).then(res => setPinnedMessages(res.data));
        }
    }, [activeChat]);

    // Синхронизация данных
    useEffect(() => {
        setChats(initialChats);
        if (activeChat) {
            const freshActiveChat = initialChats.find(c => c.id === activeChat.id);
            if (freshActiveChat && JSON.stringify(freshActiveChat) !== JSON.stringify(activeChat)) {
                setActiveChat(freshActiveChat);
            }
        }
    }, [initialChats]);

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
        setMessages([]);
        setHasMore(true);
        setHasMoreDown(false);
        setIsHistoryMode(false);
        setReplyTo(null);
        setEditingMessage(null);
        setUnreadMessages([]);
        setMentionIds([]);
        clearAttachment(); // Очищаем картинку при смене чата
        loadMessages(true);
    }, [activeChat?.id]);

    // --- ПОЛЛИНГ ---
    // --- ПОЛЛИНГ ---
    useEffect(() => {
        if (!activeChat?.id) return;
        const interval = setInterval(() => {
            axios.get(`/messages/${activeChat.id}?offset=0&limit=10`).then(res => {
                setActiveChat(prev => prev ? { ...prev, can_reply: res.data.can_reply } : null);

                const newMsgs = res.data.messages;

                // МАГИЯ СИНХРОНИЗАЦИИ ОЧИСТКИ ЧАТА
                if (newMsgs.length === 0) {
                    setMessages(prev => {
                        // Если сервер вернул пустоту, а у нас на экране висят сообщения — чат удалили!
                        if (prev.length > 0) {
                            setPinnedMessages([]); // Сбрасываем закрепы
                            setUnreadMessages([]); // Сбрасываем непрочитанные
                            setMentionIds([]);     // Сбрасываем пинги
                            setIsHistoryMode(false);
                            return []; // Очищаем экран собеседнику мгновенно
                        }
                        return prev;
                    });
                    return; // Прерываем дальнейшее выполнение поллинга
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
        if (scrollFromBottom < 50) {
            setIsHistoryMode(false);
            setUnreadMessages([]);
        }
    };

    const scrollToBottom = (force = false) => {
        const container = scrollRef.current;
        if (!container) return;
        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (force || isAtBottom) {
            setTimeout(() => {
                container.scrollTo({ top: container.scrollHeight, behavior: force ? 'smooth' : 'auto' });
            }, 100);
        }
    };

    // --- ПИНЫ И МЕНШНЫ ---
    const handleTogglePin = () => {
        const msg = contextMenu?.msg;
        if (!msg) return;

        axios.post(`/messages/${msg.id}/pin`).then(res => {
            const pinnedAt = res.data.pinned_at;
            if (pinnedAt) {
                setPinnedMessages(prev => [{ id: msg.id, text: msg.text, pinned_at: pinnedAt }, ...prev]);
            } else {
                setPinnedMessages(prev => prev.filter(p => p.id !== msg.id));
                setCurrentPinIndex(0);
            }
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

    const handleJumpToMention = () => {
        if (mentionIds.length > 0) handleJumpToPin({ id: mentionIds[0] });
    };

    // --- ВЗАИМОДЕЙСТВИЕ С СООБЩЕНИЯМИ ---
    const handleContextMenu = (event, msg) => {
        event.preventDefault();
        setContextMenu({ mouseX: event.clientX, mouseY: event.clientY, msg });
    };
    const handleCloseMenu = () => setContextMenu(null);
    const handleCopyText = () => { navigator.clipboard.writeText(contextMenu.msg.text); handleCloseMenu(); };
    const handleReplyClick = () => { setReplyTo(contextMenu.msg); handleCloseMenu(); };
    const handleEditClick = () => {
        setEditingMessage(contextMenu.msg);
        setNewMessage(contextMenu.msg.text);
        setReplyTo(null);
        handleCloseMenu();
    };

    const handleDeleteMessage = () => {
        const msgId = contextMenu.msg.id;
        axios.delete(`/messages/${msgId}`).then(() => setMessages(prev => prev.filter(m => m.id !== msgId)));
        handleCloseMenu();
    };

    const handleDeleteChat = () => {
        if (!activeChat) return;
        if (window.confirm("Вы уверены, что хотите удалить всю историю переписки? Контакт останется, но сообщения исчезнут навсегда.")) {
            axios.delete(`/conversations/${activeChat.id}`).then(() => {
                setMessages([]);
                setPinnedMessages([]);
                setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, lastMessage: 'Нет сообщений', time: '' } : c));
                setHeaderMenuAnchor(null);
            });
        }
    };

    // --- ОТПРАВКА ---
    const handleSendMessage = (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() && !attachment && !activeChat) return;

        if (editingMessage) {
            axios.patch(`/messages/${editingMessage.id}`, { text: newMessage }).then(res => {
                setMessages(prev => prev.map(m => m.id === res.data.id ? { ...m, text: res.data.text, is_edited: true } : m));
                setEditingMessage(null);
                setNewMessage('');
            });
        } else {
            // ИСПОЛЬЗУЕМ FormData ДЛЯ ОТПРАВКИ ФАЙЛОВ
            const formData = new FormData();
            formData.append('text', newMessage);
            if (replyTo) formData.append('parent_id', replyTo.id);
            if (attachment) formData.append('image', attachment);

            // Мгновенная очистка полей
            setNewMessage('');
            setReplyTo(null);
            clearAttachment();

            axios.post(`/messages/${activeChat.id}`, formData).then(res => {
                if (isHistoryMode) {
                    setIsHistoryMode(false);
                    setHasMoreDown(false);
                    loadMessages(true);
                } else {
                    setMessages(prev => [...prev, res.data]);
                    setTimeout(() => scrollToBottom(true), 100);
                }
            }).catch(err => console.error('Upload Error:', err));
        }
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
                                        <Box onClick={() => setIsProfileModalOpen(true)} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { opacity: 0.8 }, transition: 'opacity 0.2s' }}>
                                            <Avatar src={activeChat.avatar} sx={{ mr: 2, bgcolor: '#38bdf8', color: '#0f172a' }}>{activeChat.name?.[0]}</Avatar>
                                            <Box>
                                                <Typography sx={{ color: 'white', fontWeight: 'bold', lineHeight: 1.2 }}>{activeChat.name}</Typography>
                                                <Typography sx={{ color: '#38bdf8', fontSize: '0.75rem' }}>Посмотреть профиль</Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <IconButton sx={{ color: '#94a3b8', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.05)' } }}><Search /></IconButton>
                                            <IconButton onClick={(e) => setHeaderMenuAnchor(e.currentTarget)} sx={{ color: '#94a3b8', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.05)' } }}><MoreVert /></IconButton>
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
                                                <Typography noWrap sx={{ color: 'white', fontSize: '0.85rem', opacity: 0.8 }}>{pinnedMessages[currentPinIndex]?.text || 'Фотография'}</Typography>
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
                                                        {msg.reply_to && (
                                                            <Box sx={{ mb: 1, p: 1, bgcolor: 'rgba(0,0,0,0.1)', borderLeft: '2px solid', borderColor: isMe ? '#040b14' : '#38bdf8', borderRadius: 1, opacity: 0.8 }}>
                                                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: isMe ? '#040b14' : '#38bdf8' }}>{msg.reply_to.name}</Typography>
                                                                <Typography noWrap sx={{ fontSize: '0.75rem' }}>{msg.reply_to.text || 'Фотография'}</Typography>
                                                            </Box>
                                                        )}

                                                        {/* ОТОБРАЖЕНИЕ КАРТИНКИ В СООБЩЕНИИ */}
                                                        {/* ОТОБРАЖЕНИЕ КАРТИНКИ В СООБЩЕНИИ */}
{msg.image && (
    <Box sx={{
        mb: msg.text ? 1 : 0,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'rgba(0,0,0,0.2)', // Чуть затемним фон под картинкой
        display: 'inline-block' // Чтобы Box не растягивался на всю ширину сообщения
    }}>
        <img
            src={msg.image}
            alt="Attachment"
            style={{
                maxWidth: '350px',
                maxHeight: '350px',
                width: 'auto',
                height: 'auto',
                display: 'block',
                borderRadius: '8px',
                objectFit: 'contain' // Это свойство не даст картинке сломать пропорции
            }}
        />
    </Box>
)}

                                                        {msg.text && (
                                                            <Typography sx={{ fontSize: '0.95rem', wordBreak: 'break-word' }}>
                                                                {msg.text.split(' ').map((word, i) => word.startsWith('@') ? <span key={i} style={{ color: isMe ? '#1e3a8a' : '#38bdf8', fontWeight: 'bold' }}>{word} </span> : word + ' ')}
                                                            </Typography>
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

                                        {/* ПРЕДПРОСМОТР ПРИКРЕПЛЕННОЙ КАРТИНКИ */}
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
                                                    <Typography noWrap sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>{replyTo.text || 'Фотография'}</Typography>
                                                </Box>
                                                <IconButton size="small" onClick={() => setReplyTo(null)} sx={{ color: '#64748b' }}><CloseIcon fontSize="small" /></IconButton>
                                            </Box>
                                        )}

                                        {activeChat.can_reply ? (
                                            <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                {/* СКРЫТЫЙ ИНПУТ И КНОПКА СКРЕПКИ */}
                                                <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileSelect} />
                                                <IconButton onClick={() => fileInputRef.current.click()} sx={{ color: '#94a3b8', '&:hover': { color: '#38bdf8' } }}>
                                                    <AttachFile />
                                                </IconButton>

                                                <InputBase
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    onPaste={handlePaste} // Вставка по Ctrl+V
                                                    placeholder="Написать сообщение или перетащить фото..."
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
                <MenuItem onClick={handleReplyClick} sx={{ gap: 1.5 }}><Reply fontSize="small" sx={{ color: '#38bdf8' }} /> Ответить</MenuItem>
                <MenuItem onClick={handleCopyText} sx={{ gap: 1.5 }}><ContentCopy fontSize="small" sx={{ color: '#94a3b8' }} /> Копировать текст</MenuItem>
                <MenuItem onClick={handleTogglePin} sx={{ gap: 1.5 }}>
                    <PushPin fontSize="small" sx={{ color: contextMenu?.msg.is_pinned ? '#38bdf8' : '#94a3b8', transform: 'rotate(45deg)' }} />
                    <Typography>{contextMenu?.msg.is_pinned ? 'Открепить' : 'Закрепить'}</Typography>
                </MenuItem>
                {contextMenu?.msg.senderId === auth.user.id && [
                    <Divider key="div" sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />,
                    <MenuItem key="edit" onClick={handleEditClick} sx={{ gap: 1.5 }}><Edit fontSize="small" sx={{ color: '#38bdf8' }} /> Редактировать</MenuItem>,
                    <MenuItem key="delete" onClick={handleDeleteMessage} sx={{ gap: 1.5, color: '#ef4444' }}><Delete fontSize="small" sx={{ color: '#ef4444' }} /> Удалить</MenuItem>
                ]}
            </Menu>

            {/* МОДАЛЬНОЕ ОКНО ПРОФИЛЯ */}
            {activeChat && activeChat.user && (
                <ProfileModal open={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} profileUser={activeChat.user} />
            )}
        </ThemeProvider>
    );
}
