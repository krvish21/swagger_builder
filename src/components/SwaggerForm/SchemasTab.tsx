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
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DescriptionIcon from '@mui/icons-material/Description';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import type { SwaggerSchema, SchemaProperty } from '../../types/swagger';
import { SortableItem } from './SortableItem';
import { PropertyRow } from './PropertyRow';

interface SchemasTabProps {
  schemas: SwaggerSchema[];
  onAdd: () => void;
  onAddTemplate: (templateKey: string) => void;
  onUpdate: (index: number, field: keyof SwaggerSchema, value: unknown) => void;
  onRemove: (index: number) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  onAddProperty: (schemaIndex: number) => void;
  onUpdateProperty: (schemaIndex: number, propIndex: number, field: keyof SchemaProperty, value: unknown) => void;
  onRemoveProperty: (schemaIndex: number, propIndex: number) => void;
}

export const SchemasTab: React.FC<SchemasTabProps> = ({
  schemas,
  onAdd,
  onAddTemplate,
  onUpdate,
  onRemove,
  onReorder,
  onAddProperty,
  onUpdateProperty,
  onRemoveProperty,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = schemas.findIndex((_, i) => `schema-${i}` === active.id);
      const newIndex = schemas.findIndex((_, i) => `schema-${i}` === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
          Component Schemas
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title="Add empty schema">
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={onAdd} sx={{ bgcolor: '#1976d2' }}>
              Add Schema
            </Button>
          </Tooltip>
          <Tooltip title="Add JSON API Error response (includes JsonApiVersion + ErrorDetail)">
            <Button variant="outlined" size="small" startIcon={<PlaylistAddIcon />} onClick={() => {
              onAddTemplate('jsonApiVersion');
              onAddTemplate('errorDetail');
              onAddTemplate('error');
            }}>
              Error Response
            </Button>
          </Tooltip>
          <Tooltip title="Add pre-built Pagination schema template">
            <Button variant="outlined" size="small" startIcon={<PlaylistAddIcon />} onClick={() => onAddTemplate('pagination')}>
              Pagination
            </Button>
          </Tooltip>
        </Box>
      </Box>
      {schemas.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: '#6b7280' }}>
          <DescriptionIcon sx={{ fontSize: 48, opacity: 0.5 }} />
          <Typography>No schemas added yet. Click "Add Schema" to create one.</Typography>
        </Box>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={schemas.map((_, i) => `schema-${i}`)} strategy={verticalListSortingStrategy}>
            <Stack spacing={2} sx={{ pl: 4 }}>
              {schemas.map((schema, schemaIndex) => (
                <SortableItem key={`schema-${schemaIndex}`} id={`schema-${schemaIndex}`}>
                  <Accordion defaultExpanded={!schema.isTemplate}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip label="object" size="small" color="secondary" />
                        <Typography sx={{ fontWeight: 600 }}>{schema.name || 'Unnamed Schema'}</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={3}>
                        <TextField
                          label="Schema Name"
                          value={schema.name}
                          onChange={(e) => onUpdate(schemaIndex, 'name', e.target.value)}
                          placeholder="e.g., PaymentPlan"
                          size="small"
                          fullWidth
                        />
                        <Divider />
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Properties</Typography>
                            <Button size="small" startIcon={<AddIcon />} onClick={() => onAddProperty(schemaIndex)}>
                              Add Property
                            </Button>
                          </Box>
                          <Stack spacing={1}>
                            {schema.properties.map((prop, propIndex) => (
                              <PropertyRow
                                key={propIndex}
                                prop={prop}
                                propIndex={propIndex}
                                schemaIndex={schemaIndex}
                                schema={schema}
                                schemas={schemas}
                                onUpdateProperty={onUpdateProperty}
                                onRemoveProperty={onRemoveProperty}
                              />
                            ))}
                          </Stack>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => onRemove(schemaIndex)}>
                            Delete Schema
                          </Button>
                        </Box>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </SortableItem>
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      )}
    </Stack>
  );
};