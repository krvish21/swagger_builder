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
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DescriptionIcon from '@mui/icons-material/Description';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import type { SwaggerPath, PathOperation, SwaggerSchema, PathParameter, PathResponse, RequestBody, SwaggerSecurityScheme } from '../../types/swagger';
import { getMethodColor } from '../../constants/httpMethods';
import { SortableItem } from './SortableItem';
import { MarkdownEditor } from './MarkdownEditor';

interface PathsTabProps {
  paths: SwaggerPath[];
  schemas: SwaggerSchema[];
  securitySchemes: SwaggerSecurityScheme[];
  onAdd: () => void;
  onUpdate: (index: number, field: string, value: unknown) => void;
  onRemove: (index: number) => void;
  onAddOperation: (pathIndex: number, method: PathOperation['method']) => void;
  onRemoveOperation: (pathIndex: number, operationIndex: number) => void;
  onDuplicate: (pathIndex: number, operationIndex: number) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  onAddParameter: (pathIndex: number, operationIndex: number) => void;
  onUpdateParameter: (pathIndex: number, operationIndex: number, paramIndex: number, field: keyof PathParameter, value: unknown) => void;
  onRemoveParameter: (pathIndex: number, operationIndex: number, paramIndex: number) => void;
  onAddResponse: (pathIndex: number, operationIndex: number) => void;
  onUpdateResponse: (pathIndex: number, operationIndex: number, respIndex: number, field: keyof PathResponse, value: string) => void;
  onRemoveResponse: (pathIndex: number, operationIndex: number, respIndex: number) => void;
  onAddCommonErrorResponses: (pathIndex: number, operationIndex: number) => void;
  onAddRequestBody: (pathIndex: number, operationIndex: number) => void;
  onUpdateRequestBody: (pathIndex: number, operationIndex: number, field: keyof RequestBody, value: unknown) => void;
  onRemoveRequestBody: (pathIndex: number, operationIndex: number) => void;
}

const HTTP_METHODS: PathOperation['method'][] = ['get', 'post', 'put', 'delete', 'patch'];

export const PathsTab: React.FC<PathsTabProps> = ({
  paths,
  schemas,
  securitySchemes,
  onAdd,
  onUpdate,
  onRemove,
  onAddOperation,
  onRemoveOperation,
  onDuplicate,
  onReorder,
  onAddParameter,
  onUpdateParameter,
  onRemoveParameter,
  onAddResponse,
  onUpdateResponse,
  onRemoveResponse,
  onAddCommonErrorResponses,
  onAddRequestBody,
  onUpdateRequestBody,
  onRemoveRequestBody,
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
      const oldIndex = paths.findIndex((_, i) => `path-${i}` === active.id);
      const newIndex = paths.findIndex((_, i) => `path-${i}` === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
          API Paths
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd} sx={{ bgcolor: '#1976d2' }}>
          Add Path
        </Button>
      </Box>
      {paths.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: '#6b7280' }}>
          <DescriptionIcon sx={{ fontSize: 48, opacity: 0.5 }} />
          <Typography>No paths added yet. Click "Add Path" to create one.</Typography>
        </Box>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={paths.map((_, i) => `path-${i}`)} strategy={verticalListSortingStrategy}>
            <Stack spacing={2}>
              {paths.map((path, pathIndex) => (
                <SortableItem key={`path-${pathIndex}`} id={`path-${pathIndex}`}>
                  <Accordion
                    defaultExpanded
                    sx={{
                      borderLeft: '4px solid #1976d2',
                      '&:before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Typography sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{path.path || '/path'}</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {path.operations.map((op) => (
                            <Chip
                              key={op.method}
                              label={op.method.toUpperCase()}
                              size="small"
                              sx={{ bgcolor: getMethodColor(op.method), color: '#fff', fontWeight: 'bold' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={3}>
                        {/* Path Management */}
                        <Box>
                          <TextField
                            label="Path"
                            value={path.path}
                            onChange={(e) => onUpdate(pathIndex, 'path', e.target.value)}
                            placeholder="/contract-accounts/{id}/payment-plans"
                            size="small"
                            fullWidth
                          />
                        </Box>

                        <Divider />

                        {/* Operations List */}
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Operations</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {HTTP_METHODS.filter((method) => !path.operations.some((op) => op.method === method)).map((method) => (
                                <Button
                                  key={method}
                                  size="small"
                                  variant="outlined"
                                  onClick={() => onAddOperation(pathIndex, method)}
                                  sx={{ color: getMethodColor(method), borderColor: getMethodColor(method) }}
                                >
                                  + {method.toUpperCase()}
                                </Button>
                              ))}
                            </Box>
                          </Box>

                          <Stack spacing={2}>
                            {path.operations.map((operation, opIndex) => (
                              <Accordion
                                key={`${pathIndex}-${opIndex}`}
                                defaultExpanded={path.operations.length === 1}
                                sx={{
                                  borderLeft: `4px solid ${getMethodColor(operation.method)}`,
                                  bgcolor: '#f9fafb',
                                  '&:before': { display: 'none' },
                                }}
                              >
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <Chip
                                    label={operation.method.toUpperCase()}
                                    size="small"
                                    sx={{ bgcolor: getMethodColor(operation.method), color: '#fff', fontWeight: 'bold', mr: 2 }}
                                  />
                                  <Typography>{operation.summary || '(No summary)'}</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Stack spacing={2}>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                      <TextField
                                        label="Summary"
                                        value={operation.summary}
                                        onChange={() => {
                                          // TODO: Add dedicated handler to update operation fields in hook
                                          // For now, summary is displayed but not editable inline
                                        }}
                                        placeholder="Short summary"
                                        size="small"
                                        disabled
                                      />
                                      <TextField
                                        label="Operation ID"
                                        value={operation.operationId}
                                        placeholder="getPaymentPlans"
                                        size="small"
                                        disabled
                                      />
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                      <TextField
                                        label="Description"
                                        value={operation.description}
                                        placeholder="Detailed description..."
                                        size="small"
                                        fullWidth
                                        multiline
                                        rows={2}
                                      />
                                      <FormControlLabel
                                        control={<Switch checked={operation.deprecated || false} size="small" color="warning" />}
                                        label="Deprecated"
                                        sx={{ minWidth: 120 }}
                                      />
                                    </Box>

                                    {/* Security */}
                                    {securitySchemes.length > 0 && (
                                      <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>Security</Typography>
                                        <FormGroup row>
                                          {securitySchemes.map((scheme) => (
                                            <FormControlLabel
                                              key={scheme.name}
                                              control={<Checkbox checked={operation.security?.includes(scheme.name) || false} size="small" />}
                                              label={`${scheme.name}`}
                                            />
                                          ))}
                                        </FormGroup>
                                      </Box>
                                    )}

                                    <Divider />

                                    {/* Parameters */}
                                    <Box>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Parameters</Typography>
                                        <Button size="small" startIcon={<AddIcon />} onClick={() => onAddParameter(pathIndex, opIndex)}>
                                          Add
                                        </Button>
                                      </Box>
                                      <Stack spacing={1}>
                                        {operation.parameters.map((param, paramIndex) => (
                                          <Box
                                            key={paramIndex}
                                            sx={{
                                              display: 'grid',
                                              gridTemplateColumns: '1fr 0.8fr 1.5fr 0.8fr 0.6fr',
                                              gap: 1,
                                              alignItems: 'center',
                                              p: 1.5,
                                              bgcolor: '#fff',
                                              borderRadius: 1,
                                              border: '1px solid #e5e7eb',
                                            }}
                                          >
                                            <TextField
                                              label="Name"
                                              value={param.name}
                                              onChange={(e) => onUpdateParameter(pathIndex, opIndex, paramIndex, 'name', e.target.value)}
                                              size="small"
                                            />
                                            <FormControl size="small">
                                              <InputLabel>In</InputLabel>
                                              <Select
                                                value={param.in}
                                                label="In"
                                                onChange={(e) => onUpdateParameter(pathIndex, opIndex, paramIndex, 'in', e.target.value)}
                                              >
                                                <MenuItem value="path">path</MenuItem>
                                                <MenuItem value="query">query</MenuItem>
                                                <MenuItem value="header">header</MenuItem>
                                                <MenuItem value="cookie">cookie</MenuItem>
                                              </Select>
                                            </FormControl>
                                            <TextField
                                              label="Description"
                                              value={param.description}
                                              onChange={(e) => onUpdateParameter(pathIndex, opIndex, paramIndex, 'description', e.target.value)}
                                              size="small"
                                            />
                                            <FormControlLabel
                                              control={
                                                <Switch
                                                  checked={param.required}
                                                  onChange={(e) => onUpdateParameter(pathIndex, opIndex, paramIndex, 'required', e.target.checked)}
                                                  size="small"
                                                />
                                              }
                                              label="Req"
                                              sx={{ whiteSpace: 'nowrap' }}
                                            />
                                            <IconButton onClick={() => onRemoveParameter(pathIndex, opIndex, paramIndex)} color="error" size="small">
                                              <DeleteIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                          </Box>
                                        ))}
                                      </Stack>
                                    </Box>

                                    {/* Request Body */}
                                    {operation.method !== 'get' && (
                                      <>
                                        <Divider />
                                        <Box>
                                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Request Body</Typography>
                                            <Button size="small" startIcon={<AddIcon />} onClick={() => onAddRequestBody(pathIndex, opIndex)}>
                                              Add
                                            </Button>
                                          </Box>
                                          {operation.requestBody && (
                                            <Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: 1, border: '1px solid #e5e7eb' }}>
                                              <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                                                <TextField
                                                  label="Description"
                                                  value={operation.requestBody.description}
                                                  onChange={(e) => onUpdateRequestBody(pathIndex, opIndex, 'description', e.target.value)}
                                                  size="small"
                                                  sx={{ flex: 1 }}
                                                />
                                                <FormControl size="small" sx={{ width: 150 }}>
                                                  <InputLabel>Schema</InputLabel>
                                                  <Select
                                                    value={operation.requestBody.schemaRef}
                                                    label="Schema"
                                                    onChange={(e) => onUpdateRequestBody(pathIndex, opIndex, 'schemaRef', e.target.value)}
                                                  >
                                                    <MenuItem value="">None</MenuItem>
                                                    {schemas.map((s) => (
                                                      <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>
                                                    ))}
                                                  </Select>
                                                </FormControl>
                                                <IconButton onClick={() => onRemoveRequestBody(pathIndex, opIndex)} color="error" size="small">
                                                  <DeleteIcon />
                                                </IconButton>
                                              </Box>
                                            </Box>
                                          )}
                                        </Box>
                                      </>
                                    )}

                                    <Divider />

                                    {/* Responses */}
                                    <Box>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Responses</Typography>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                          <Tooltip title="Add common error responses">
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              startIcon={<PlaylistAddIcon />}
                                              onClick={() => onAddCommonErrorResponses(pathIndex, opIndex)}
                                            >
                                              Errors
                                            </Button>
                                          </Tooltip>
                                          <Button size="small" startIcon={<AddIcon />} onClick={() => onAddResponse(pathIndex, opIndex)}>
                                            Add
                                          </Button>
                                        </Box>
                                      </Box>
                                      <Stack spacing={1.5}>
                                        {operation.responses.map((resp, respIndex) => (
                                          <Box
                                            key={respIndex}
                                            sx={{ p: 1.5, bgcolor: '#fff', borderRadius: 1, border: '1px solid #e5e7eb' }}
                                          >
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
                                              <FormControl size="small" sx={{ width: 100 }}>
                                                <InputLabel>Status</InputLabel>
                                                <Select
                                                  value={resp.statusCode}
                                                  label="Status"
                                                  onChange={(e) => onUpdateResponse(pathIndex, opIndex, respIndex, 'statusCode', e.target.value)}
                                                >
                                                  <MenuItem value="200">200</MenuItem>
                                                  <MenuItem value="201">201</MenuItem>
                                                  <MenuItem value="204">204</MenuItem>
                                                  <MenuItem value="400">400</MenuItem>
                                                  <MenuItem value="401">401</MenuItem>
                                                  <MenuItem value="403">403</MenuItem>
                                                  <MenuItem value="404">404</MenuItem>
                                                  <MenuItem value="500">500</MenuItem>
                                                </Select>
                                              </FormControl>
                                              <FormControl size="small" sx={{ width: 150 }}>
                                                <InputLabel>Schema</InputLabel>
                                                <Select
                                                  value={resp.schemaRef}
                                                  label="Schema"
                                                  onChange={(e) => onUpdateResponse(pathIndex, opIndex, respIndex, 'schemaRef', e.target.value)}
                                                >
                                                  <MenuItem value="">None</MenuItem>
                                                  {schemas.map((s) => (
                                                    <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>
                                                  ))}
                                                </Select>
                                              </FormControl>
                                              <Box sx={{ flex: 1 }} />
                                              <IconButton onClick={() => onRemoveResponse(pathIndex, opIndex, respIndex)} color="error" size="small">
                                                <DeleteIcon />
                                              </IconButton>
                                            </Box>
                                            <MarkdownEditor
                                              value={resp.description}
                                              onChange={(value) => onUpdateResponse(pathIndex, opIndex, respIndex, 'description', value)}
                                              label="Description"
                                              placeholder="Response description..."
                                              rows={2}
                                            />
                                          </Box>
                                        ))}
                                      </Stack>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<ContentCopyIcon />}
                                        onClick={() => onDuplicate(pathIndex, opIndex)}
                                      >
                                        Duplicate
                                      </Button>
                                      <Button
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => onRemoveOperation(pathIndex, opIndex)}
                                      >
                                        Delete Method
                                      </Button>
                                    </Box>
                                  </Stack>
                                </AccordionDetails>
                              </Accordion>
                            ))}
                          </Stack>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => onRemove(pathIndex)}>
                            Delete Path
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
