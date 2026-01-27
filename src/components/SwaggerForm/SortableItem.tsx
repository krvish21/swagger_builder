import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style} sx={{ position: 'relative' }}>
      <Box
        {...attributes}
        {...listeners}
        sx={{
          position: 'absolute',
          left: -28,
          top: '50%',
          transform: 'translateY(-50%)',
          cursor: 'grab',
          color: '#9ca3af',
          '&:hover': { color: '#6b7280' },
          zIndex: 1,
        }}
      >
        <DragIndicatorIcon />
      </Box>
      {children}
    </Box>
  );
};