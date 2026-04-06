import React, { useState, useRef, useEffect } from 'react';
import {
    Container, Box, Typography, TextField, Button, Grid,
    IconButton, Stack, Chip, Switch, FormControlLabel, Paper,
    Select, MenuItem, InputLabel, FormControl, Autocomplete
} from '@mui/material';
import {
    CloudUpload, AddPhotoAlternate, Delete,
    Movie, AudioFile, MusicNote, Save,
    ArrowBack, ArrowForward, Copyright, VisibilityOff,
    AccessibilityNew // Иконка для Alt Text
} from '@mui/icons-material';
import { Head } from '@inertiajs/react';
import Header from '../Components/Header';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';

export default function CreatePost() {
    // ... (Все предыдущие стейты оставляем как были)
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [altText, setAltText] = useState(''); // НОВОЕ: Alt Text
    const [mediaFiles, setMediaFiles] = useState([]);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

    const [tags, setTags] = useState([]);
    const [currentTag, setCurrentTag] = useState('');
    const [tools, setTools] = useState('');

    const [series, setSeries] = useState(null);
    const mySeries = [{ label: 'Inktober 2026', id: 1 }, { label: 'Мой веб-комикс', id: 2 }];

    const [license, setLicense] = useState('standard');
    const [workStatus, setWorkStatus] = useState('finished');
    const [scheduledTime, setScheduledTime] = useState('');

    const [allowComments, setAllowComments] = useState(true);
    const [allowDownload, setAllowDownload] = useState(false);
    const [addWatermark, setAddWatermark] = useState(false);
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [isNSFW, setIsNSFW] = useState(false);

    const fileInputRef = useRef(null);
    const mediaFilesRef = useRef([]);
    const PREVIEW_SIZE = { xs: '340px', md: '550px', lg: '600px' };

    useEffect(() => { mediaFilesRef.current = mediaFiles; }, [mediaFiles]);
    useEffect(() => { return () => mediaFilesRef.current.forEach(file => URL.revokeObjectURL(file.preview)); }, []);

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newMedia = files.map(file => {
                let type = 'image';
                if (file.type.startsWith('video/')) type = 'video';
                else if (file.type.startsWith('audio/')) type = 'audio';
                return {
                    id: Math.random().toString(36).substr(2, 9) + Date.now(),
                    file,
                    preview: URL.createObjectURL(file),
                    type
                };
            });
            if (mediaFiles.length === 0) setSelectedMediaIndex(0);
            setMediaFiles(prev => [...prev, ...newMedia]);
        }
    };

    const moveMedia = (index, direction, e) => {
        e.stopPropagation();
        const newIndex = direction === 'left' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= mediaFiles.length) return;
        const newMedia = [...mediaFiles];
        [newMedia[index], newMedia[newIndex]] = [newMedia[newIndex], newMedia[index]];
        setMediaFiles(newMedia);
        setSelectedMediaIndex(newIndex);
    };

    const removeMedia = (indexToRemove, e) => {
        if (e) e.stopPropagation();
        const newMedia = [...mediaFiles];
        URL.revokeObjectURL(newMedia[indexToRemove].preview);
        newMedia.splice(indexToRemove, 1);
        setMediaFiles(newMedia);
        if (newMedia.length === 0) setSelectedMediaIndex(0);
        else if (indexToRemove <= selectedMediaIndex) setSelectedMediaIndex(prev => Math.max(0, prev - 1));
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.target.value.trim().toLowerCase();
            if (val.length > 30) return;
            if (val && !tags.includes(val) && tags.length < 15) {
                setTags(prev => [...prev, val]);
                setCurrentTag('');
            }
        }
    };

    const activeMedia = mediaFiles[selectedMediaIndex];

    const renderPreviewContent = () => {
        if (!activeMedia) return null;
        const contentKey = activeMedia.id;
        const mediaStyle = { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', zIndex: 1, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' };

        switch (activeMedia.type) {
            case 'video':
                return <Box key={contentKey} component="video" src={activeMedia.preview} controls preload="metadata" sx={mediaStyle} />;
            case 'audio':
                return (
                    <Box key={contentKey} sx={{ textAlign: 'center', zIndex: 1, width: '80%' }}>
                        <MusicNote sx={{ fontSize: 80, color: '#3b82f6', mb: 2 }} />
                        <Typography variant="body1" color="white" sx={{ mb: 2 }}>{activeMedia.file.name}</Typography>
                        <audio controls src={activeMedia.preview} style={{ width: '100%' }} />
                    </Box>
                );
            default:
                return <Box key={contentKey} component="img" src={activeMedia.preview} sx={mediaStyle} />;
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ minHeight: '100vh', bgcolor: '#0b1120', pb: 10 }}>
                <Head title="Создать пост" />
                <Header color={0} />

                <Container maxWidth={false} sx={{ width: '95%', mt: 4 }}>
                    <Grid container spacing={4} alignItems="flex-start">

                        {/* ЛЕВАЯ КОЛОНКА (ПРЕВЬЮ) */}
                        <Grid item xs={12} lg={4} xl={4} sx={{ minWidth: 0 }}>
                            <Paper elevation={0} sx={{ bgcolor: '#1e293b', borderRadius: 4, p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '600px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Box sx={{
                                    width: PREVIEW_SIZE, height: PREVIEW_SIZE, maxWidth: '100%', bgcolor: '#0f172a', borderRadius: 3,
                                    border: mediaFiles.length === 0 ? '2px dashed #334155' : '1px solid #334155',
                                    position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0
                                }} onClick={() => mediaFiles.length === 0 && fileInputRef.current.click()}>
                                    {mediaFiles.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', cursor: 'pointer' }}>
                                            <CloudUpload sx={{ fontSize: 64, color: '#3b82f6', mb: 2 }} />
                                            <Typography variant="h6" color="white">Загрузить файлы</Typography>
                                            <Typography color="#64748b" variant="body2">JPG, PNG, MP4, MP3</Typography>
                                        </Box>
                                    ) : (
                                        <>
                                            {activeMedia?.type === 'image' && <Box component="img" src={activeMedia.preview} sx={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(40px) brightness(0.3)', zIndex: 0 }} />}
                                            {renderPreviewContent()}
                                            <IconButton onClick={(e) => removeMedia(selectedMediaIndex, e)} sx={{ position: 'absolute', top: 16, right: 16, bgcolor: 'rgba(0,0,0,0.6)', color: '#ef4444', zIndex: 10, '&:hover': { bgcolor: 'rgba(255,0,0,0.4)' } }}>
                                                <Delete />
                                            </IconButton>
                                        </>
                                    )}
                                </Box>
                                <Box sx={{ width: '100%', mt: 3 }}>
                                    {mediaFiles.length > 0 && (
                                        <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 2, '&::-webkit-scrollbar': { height: '6px' }, '&::-webkit-scrollbar-thumb': { bgcolor: '#334155', borderRadius: '3px' } }}>
                                            <Box onClick={() => fileInputRef.current.click()} sx={{ minWidth: 80, height: 80, borderRadius: 2, border: '1px dashed #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: '#64748b', bgcolor: '#0f172a' }}>
                                                <AddPhotoAlternate />
                                            </Box>
                                            {mediaFiles.map((item, idx) => (
                                                <Box key={item.id} onClick={() => setSelectedMediaIndex(idx)} sx={{
                                                    minWidth: 80, width: 80, height: 80, borderRadius: 2, overflow: 'hidden', cursor: 'pointer',
                                                    border: selectedMediaIndex === idx ? '2px solid #3b82f6' : '2px solid transparent',
                                                    position: 'relative', bgcolor: '#0f172a'
                                                }}>
                                                    {item.type === 'image' ? <img src={item.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>{item.type === 'video' ? <Movie sx={{ color: '#94a3b8' }} /> : <AudioFile sx={{ color: '#94a3b8' }} />}</Box>}
                                                    <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.7)', px: 0.5, py: 0.2, textAlign: 'center' }}>
                                                        <Typography variant="caption" sx={{ color: 'white', fontSize: '0.65rem' }}>{formatSize(item.file.size)}</Typography>
                                                    </Box>
                                                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.4)', opacity: 0, '&:hover': { opacity: 1 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
                                                        <IconButton size="small" onClick={(e) => moveMedia(idx, 'left', e)} disabled={idx === 0} sx={{ color: 'white', p: 0 }}><ArrowBack fontSize="small" /></IconButton>
                                                        <IconButton size="small" onClick={(e) => moveMedia(idx, 'right', e)} disabled={idx === mediaFiles.length - 1} sx={{ color: 'white', p: 0 }}><ArrowForward fontSize="small" /></IconButton>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}
                                </Box>
                                <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept="image/*,video/*,audio/*" />
                            </Paper>
                        </Grid>

                        {/* ПРАВАЯ КОЛОНКА (ДЕТАЛИ) */}
                        <Grid item xs={12} lg={8} xl={8} sx={{ minWidth: 0 }}>
                            <Paper sx={{ bgcolor: '#1e293b', borderRadius: 4, p: 5, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                {/* Оборачиваем Stack в Box с width: 100% для гарантии */}
                                <Box sx={{ width: '100%' }}>
                                    <Stack spacing={3}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2 }}>
                                            <Typography variant="h5" color="white" fontWeight="bold">Публикация</Typography>
                                            <Button startIcon={<Save />} sx={{ color: '#94a3b8', '&:hover': { color: 'white' } }}>Черновик</Button>
                                        </Box>

                                        <Grid container spacing={3}>
                                            <Grid item xs={12} md={8}>
                                                <TextField label="Название" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} sx={inputStyles} />
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <TextField label="Инструменты" fullWidth value={tools} onChange={(e) => setTools(e.target.value)} sx={inputStyles} />
                                            </Grid>
                                        </Grid>

                                        <Autocomplete
                                            options={mySeries}
                                            value={series}
                                            onChange={(event, newValue) => setSeries(newValue)}
                                            freeSolo
                                            renderInput={(params) => (
                                                <TextField {...params} label="Серия / Подборка (необязательно)" placeholder="Например: Inktober 2026" sx={inputStyles} />
                                            )}
                                            sx={{ '& .MuiAutocomplete-input': { color: 'white' }, '& .MuiAutocomplete-clearIndicator': { color: '#64748b' } }}
                                        />

                                        <TextField label="Описание" fullWidth multiline minRows={5} value={description} onChange={(e) => setDescription(e.target.value)} sx={inputStyles} />

                                        {/* === ТЕГИ: ЖЕЛЕЗОБЕТОННЫЙ ФИКС === */}
                                        {/* ТЕГИ: ЖЕЛЕЗОБЕТОННЫЙ ФИКС */}
                                        <Box sx={{ bgcolor: '#0f172a', p: 2, borderRadius: 2, border: '1px solid #334155' }}>
                                            <TextField
                                                label={tags.length >= 15 ? "Максимум 15 тегов" : "Теги (через Enter)"}
                                                fullWidth variant="standard"
                                                value={currentTag}
                                                disabled={tags.length >= 15}
                                                onChange={(e) => setCurrentTag(e.target.value)}
                                                onKeyDown={handleTagKeyDown}
                                                InputProps={{ disableUnderline: true }}
                                                sx={{ ...inputStyles, '& .MuiInputBase-root': { bgcolor: 'transparent', p: 0 } }}
                                            />

                                            {/* КОНТЕЙНЕР: Важно layout: 'fixed' для flexbox */}
                                            <Box sx={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 1,
                                                mt: 2,
                                                width: '100%',        // Занимаем всю ширину
                                                maxWidth: '100%',     // 🛑 ЗАПРЕЩАЕМ вылезать за пределы родителя
                                            }}>
                                                {tags.map(t => (
                                                    <Chip
                                                        key={t}
                                                        label={`#${t}`}
                                                        onDelete={() => setTags(tags.filter(i => i !== t))}
                                                        sx={{
                                                            bgcolor: '#334155',
                                                            color: 'white',
                                                            maxWidth: '100%', // Чип не шире контейнера

                                                            // 🛑 ГЛАВНЫЙ ФИКС: Делаем чип гибким контейнером
                                                            display: 'flex',

                                                            '& .MuiChip-label': {
                                                                display: 'block',       // Блочный элемент
                                                                whiteSpace: 'nowrap',   // Текст в одну строку
                                                                overflow: 'hidden',     // Обрезаем лишнее
                                                                textOverflow: 'ellipsis', // Ставим ...
                                                                flexGrow: 1,            // Занимаем доступное место
                                                                minWidth: 0,            // 🛑 Разрешаем сжиматься в 0, если места нет
                                                                maxWidth: '100%'
                                                            },
                                                            // Фикс для кнопки удаления, чтобы её не сплющило
                                                            '& .MuiChip-deleteIcon': {
                                                                flexShrink: 0
                                                            }
                                                        }}
                                                    />
                                                ))}
                                                {tags.length === 0 && <Typography variant="caption" color="#64748b">Например: #3d, #original, #oc, #cyberpunk</Typography>}
                                            </Box>
                                        </Box>

                                        {/* Настройки */}
                                        <Box sx={{ bgcolor: '#161e2e', p: 3, borderRadius: 2 }}>
                                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                                <Grid item xs={12} md={4}>
                                                    <FormControl fullWidth sx={inputStyles} size="small">
                                                        <InputLabel>Лицензия</InputLabel>
                                                        <Select value={license} label="Лицензия" onChange={(e) => setLicense(e.target.value)}>
                                                            <MenuItem value="standard">Standard Copyright</MenuItem>
                                                            <MenuItem value="cc_by">CC BY</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <FormControl fullWidth sx={inputStyles} size="small">
                                                        <InputLabel>Статус</InputLabel>
                                                        <Select value={workStatus} label="Статус" onChange={(e) => setWorkStatus(e.target.value)}>
                                                            <MenuItem value="finished">Завершено</MenuItem>
                                                            <MenuItem value="sketch">Скетч</MenuItem>
                                                            <MenuItem value="wip">В процессе</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <TextField
                                                        label="Дата публикации"
                                                        type="datetime-local"
                                                        size="small"
                                                        fullWidth
                                                        value={scheduledTime}
                                                        onChange={(e) => setScheduledTime(e.target.value)}
                                                        InputLabelProps={{ shrink: true }}
                                                        sx={{ ...inputStyles, '& input::-webkit-calendar-picker-indicator': { filter: 'invert(1)', cursor: 'pointer' } }}
                                                    />
                                                </Grid>
                                            </Grid>

                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', borderTop: '1px solid #334155', pt: 2, mb: 3 }}>
                                                <FormControlLabel control={<Switch checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} size="small" />} label={<Typography color="white" variant="body2">Комменты</Typography>} />
                                                <FormControlLabel control={<Switch checked={allowDownload} onChange={(e) => setAllowDownload(e.target.checked)} size="small" />} label={<Typography color="white" variant="body2">Скачивание</Typography>} />
                                                <FormControlLabel control={<Switch checked={addWatermark} onChange={(e) => setAddWatermark(e.target.checked)} size="small" color="info" />} label={<Typography color="#38bdf8" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Copyright fontSize="inherit" /> Водяной знак</Typography>} />
                                                <Box sx={{ flexGrow: 1 }} />
                                                <FormControlLabel control={<Switch checked={isSpoiler} onChange={(e) => setIsSpoiler(e.target.checked)} size="small" color="warning" />} label={<Typography color="#f59e0b" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><VisibilityOff fontSize="inherit" /> Спойлер</Typography>} />
                                                <FormControlLabel control={<Switch checked={isNSFW} onChange={(e) => setIsNSFW(e.target.checked)} size="small" color="error" />} label={<Typography color="#ef4444" variant="body2" fontWeight="bold">NSFW (18+)</Typography>} />
                                            </Box>

                                            <Button variant="contained" size="large" fullWidth disabled={mediaFiles.length === 0 || !title} sx={{ bgcolor: '#3b82f6', height: '45px', fontWeight: 'bold', fontSize: '1rem' }}>
                                                {scheduledTime ? 'Запланировать публикацию' : 'Опубликовать'}
                                            </Button>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </ThemeProvider>
    );
}

const inputStyles = {
    '& .MuiOutlinedInput-root': {
        color: 'white', bgcolor: '#0f172a', borderRadius: 2,
        '& fieldset': { borderColor: '#334155' },
        '&:hover fieldset': { borderColor: '#475569' },
        '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
    },
    '& .MuiInputLabel-root': { color: '#64748b' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
    '& .MuiSelect-icon': { color: '#64748b' }
};
