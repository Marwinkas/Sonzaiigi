import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { 
    Box, Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, 
    DialogActions, Typography, Grid 
} from '@mui/material';
import { PhotoCamera, Close, DragIndicator, Add } from '@mui/icons-material';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Мини-компонент для сортируемой картинки
function SortableImage({ id, file, onRemove }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group aspect-square bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
            <img 
                src={URL.createObjectURL(file)} 
                alt="preview" 
                className="w-full h-full object-cover" 
            />
            {/* Кнопка удаления */}
            <IconButton 
                size="small" 
                onClick={() => onRemove(id)}
                sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'red' } }}
            >
                <Close fontSize="small" />
            </IconButton>
            {/* Ручка для перетаскивания */}
            <div 
                {...attributes} 
                {...listeners} 
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 cursor-grab active:cursor-grabbing transition"
            >
                <DragIndicator sx={{ color: 'white', fontSize: 40 }} />
            </div>
        </div>
    );
}

export default function CreatePost({ open, onClose }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        images: [],
    });

    // Уникальные ID для dnd-kit (так как File объекты не имеют id)
    const [filesWithId, setFilesWithId] = useState([]);

    const handleImageChange = (e) => {
        const newFiles = Array.from(e.target.files).map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file
        }));
        setFilesWithId([...filesWithId, ...newFiles]);
        setData('images', [...filesWithId, ...newFiles].map(f => f.file));
    };

    const handleRemove = (id) => {
        const updated = filesWithId.filter(f => f.id !== id);
        setFilesWithId(updated);
        setData('images', updated.map(f => f.file));
    };

    // Логика перетаскивания
    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setFilesWithId((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                
                // Обновляем данные формы для отправки в правильном порядке
                setData('images', newOrder.map(f => f.file));
                return newOrder;
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('posts.store'), {
            onSuccess: () => {
                reset();
                setFilesWithId([]);
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: '#111827', color: 'white', borderRadius: 3 } }}>
            <DialogTitle sx={{ borderBottom: '1px solid #374151' }}>Новый шедевр</DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
                <form id="create-post-form" onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <TextField
                        fullWidth label="Название" variant="outlined"
                        value={data.title} onChange={e => setData('title', e.target.value)}
                        error={!!errors.title} helperText={errors.title}
                        sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: '#4b5563' } }, '& .MuiInputLabel-root': { color: '#9ca3af' } }}
                    />
                    
                    <TextField
                        fullWidth multiline rows={3} label="Описание" variant="outlined"
                        value={data.description} onChange={e => setData('description', e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: '#4b5563' } }, '& .MuiInputLabel-root': { color: '#9ca3af' } }}
                    />

                    {/* Зона загрузки и сортировки */}
                    <Box sx={{ border: '2px dashed #374151', borderRadius: 2, p: 2, minHeight: 100 }}>
                        {filesWithId.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-4">
                                <PhotoCamera sx={{ fontSize: 40, mb: 1 }} />
                                <Typography variant="body2">Добавьте картинки</Typography>
                            </div>
                        ) : (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={filesWithId.map(f => f.id)} strategy={rectSortingStrategy}>
                                    <div className="grid grid-cols-3 gap-2">
                                        {filesWithId.map((item) => (
                                            <SortableImage key={item.id} id={item.id} file={item.file} onRemove={handleRemove} />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                        
                        <Button
                            component="label" fullWidth variant="outlined" startIcon={<Add />}
                            sx={{ mt: 2, color: '#a855f7', borderColor: '#a855f7' }}
                        >
                            Добавить файлы
                            <input type="file" hidden multiple accept="image/*" onChange={handleImageChange} />
                        </Button>
                        {errors.images && <Typography color="error" variant="caption">{errors.images}</Typography>}
                    </Box>
                </form>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid #374151' }}>
                <Button onClick={onClose} sx={{ color: '#9ca3af' }}>Отмена</Button>
                <Button 
                    type="submit" form="create-post-form" variant="contained" disabled={processing}
                    sx={{ background: 'linear-gradient(45deg, #a855f7, #ec4899)' }}
                >
                    Опубликовать
                </Button>
            </DialogActions>
        </Dialog>
    );
}