import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Box,
  Button,
  Card,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import type { SwaggerTag } from '../../types/swagger';
import { SortableItem } from './SortableItem';

interface TagsTabProps {
  tags: SwaggerTag[];
  onAdd: () => void;
  onUpdate: (index: number, field: keyof SwaggerTag, value: string) => void;
  onRemove: (index: number) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
}

export const TagsTab: React.FC<TagsTabProps> = ({ tags, onAdd, onUpdate, onRemove, onReorder }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tags.findIndex((_, i) => `tag-${i}` === active.id);
      const newIndex = tags.findIndex((_, i) => `tag-${i}` === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
          API Tags
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAdd}
          sx={{ bgcolor: '#1976d2' }}
        >
          Add Tag
        </Button>
      </Box>
      {tags.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: '#6b7280' }}>
          <DescriptionIcon sx={{ fontSize: 48, opacity: 0.5 }} />
          <Typography>No tags added yet. Click "Add Tag" to create one.</Typography>
        </Box>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tags.map((_, i) => `tag-${i}`)} strategy={verticalListSortingStrategy}>
            <Stack spacing={2} sx={{ pl: 4 }}>
              {tags.map((tag, index) => (
                <SortableItem key={`tag-${index}`} id={`tag-${index}`}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <TextField
                        label="Tag Name"
                        value={tag.name}
                        onChange={(e) => onUpdate(index, 'name', e.target.value)}
                        placeholder="e.g., payment-plans"
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Description"
                        value={tag.description}
                        onChange={(e) => onUpdate(index, 'description', e.target.value)}
                        placeholder="Operations related to..."
                        size="small"
                        sx={{ flex: 2 }}
                      />
                      <IconButton onClick={() => onRemove(index)} color="error" size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Card>
                </SortableItem>
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      )}
    </Stack>
  );
};