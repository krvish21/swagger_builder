import React, { useState } from 'react';
import {
  Box,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import type { SchemaProperty, SwaggerSchema } from '../../types/swagger';

interface PropertyRowProps {
  prop: SchemaProperty;
  propIndex: number;
  schemaIndex: number;
  schema: SwaggerSchema;
  schemas: SwaggerSchema[];
  onUpdateProperty: (schemaIndex: number, propIndex: number, field: keyof SchemaProperty, value: unknown) => void;
  onRemoveProperty: (schemaIndex: number, propIndex: number) => void;
}

export const PropertyRow: React.FC<PropertyRowProps> = ({
  prop,
  propIndex,
  schemaIndex,
  schema,
  schemas,
  onUpdateProperty,
  onRemoveProperty,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleOpenOptions = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseOptions = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const showOptionsButton = prop.type && !['object', 'array'].includes(prop.type);
  const hasOptionalValues = prop.format || prop.example || prop.enumValues || prop.nullable || prop.deprecated || prop.default || prop.pattern || prop.minLength || prop.maxLength || prop.minimum || prop.maximum;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        p: 1.5,
        bgcolor: prop.deprecated ? '#fef3c7' : '#f9fafb',
        borderRadius: 1,
        border: prop.deprecated ? '1px dashed #f59e0b' : 'none',
      }}
    >
      <TextField
        label="Name"
        value={prop.name}
        onChange={(e) => onUpdateProperty(schemaIndex, propIndex, 'name', e.target.value)}
        size="small"
        sx={{ width: 130 }}
      />
      <FormControl size="small" sx={{ width: 110 }}>
        <InputLabel>Type</InputLabel>
        <Select
          value={prop.type}
          label="Type"
          onChange={(e) => onUpdateProperty(schemaIndex, propIndex, 'type', e.target.value)}
        >
          <MenuItem value="" disabled>Select a type</MenuItem>
          <MenuItem value="string">string</MenuItem>
          <MenuItem value="number">number</MenuItem>
          <MenuItem value="integer">integer</MenuItem>
          <MenuItem value="boolean">boolean</MenuItem>
          <MenuItem value="array">array</MenuItem>
          <MenuItem value="object">object</MenuItem>
        </Select>
      </FormControl>

      {prop.type === 'object' && (
        <FormControl size="small" sx={{ width: 130 }}>
          <InputLabel>Schema Ref</InputLabel>
          <Select
            value={prop.$ref || ''}
            label="Schema Ref"
            onChange={(e) => onUpdateProperty(schemaIndex, propIndex, '$ref', e.target.value)}
          >
            <MenuItem value="">None (inline)</MenuItem>
            {schemas.filter((s) => s.name !== schema.name).map((s) => (
              <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {prop.type === 'array' && (
        <FormControl size="small" sx={{ width: 130 }}>
          <InputLabel>Items Ref</InputLabel>
          <Select
            value={prop.items?.$ref || ''}
            label="Items Ref"
            onChange={(e) => onUpdateProperty(schemaIndex, propIndex, 'items', { ...prop.items, $ref: e.target.value })}
          >
            <MenuItem value="">None (inline)</MenuItem>
            {schemas.filter((s) => s.name !== schema.name).map((s) => (
              <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <TextField
        label="Description"
        value={prop.description}
        onChange={(e) => onUpdateProperty(schemaIndex, propIndex, 'description', e.target.value)}
        size="small"
        sx={{ flex: 1, minWidth: 120 }}
      />

      {showOptionsButton && (
        <>
          <Tooltip title="Format, Example, Enum...">
            <IconButton
              onClick={handleOpenOptions}
              size="small"
              sx={{
                color: hasOptionalValues ? 'primary.main' : 'action.disabled',
                bgcolor: hasOptionalValues ? 'primary.50' : 'transparent',
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleCloseOptions}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <Stack spacing={2} sx={{ p: 2, width: 320 }}>
              <TextField
                label="Format"
                value={prop.format || ''}
                onChange={(e) => onUpdateProperty(schemaIndex, propIndex, 'format', e.target.value)}
                size="small"
                fullWidth
                placeholder="e.g., date, date-time, email, uuid"
                helperText="OpenAPI format hint"
              />
              <TextField
                label="Default Value"
                value={prop.default || ''}
                onChange={(e) => onUpdateProperty(schemaIndex, propIndex, 'default', e.target.value)}
                size="small"
                fullWidth
                placeholder="Default value"
              />
              <TextField
                label="Example"
                value={prop.example}
                onChange={(e) => onUpdateProperty(schemaIndex, propIndex, 'example', e.target.value)}
                size="small"
                fullWidth
                placeholder="e.g., john@example.com"
              />
              {['string', 'number', 'integer'].includes(prop.type) && (
                <TextField
                  label="Enum Values"
                  value={prop.enumValues || ''}
                  onChange={(e) => onUpdateProperty(schemaIndex, propIndex, 'enumValues', e.target.value)}
                  size="small"
                  fullWidth
                  placeholder="active, inactive, pending"
                  helperText="Comma-separated allowed values"
                />
              )}
              
              {/* String constraints */}
              {prop.type === 'string' && (
                <>
                  <TextField
                    label="Pattern (Regex)"
                    value={prop.pattern || ''}
                    onChange={(e) => onUpdateProperty(schemaIndex, propIndex, 'pattern', e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="^[a-zA-Z]+$"
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="Min Length"
                      type="number"
                      value={prop.minLength ?? ''}
                      onChange={(e) => onUpdateProperty(schemaIndex, propIndex, 'minLength', e.target.value ? parseInt(e.target.value) : undefined)}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Max Length"
                      type="number"
                      value={prop.maxLength ?? ''}
                      onChange={(e) => onUpdateProperty(schemaIndex, propIndex, 'maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </>
              )}
              
              {/* Number constraints */}
              {(prop.type === 'number' || prop.type === 'integer') && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    label="Minimum"
                    type="number"
                    value={prop.minimum ?? ''}
                    onChange={(e) => onUpdateProperty(schemaIndex, propIndex, 'minimum', e.target.value ? parseFloat(e.target.value) : undefined)}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Maximum"
                    type="number"
                    value={prop.maximum ?? ''}
                    onChange={(e) => onUpdateProperty(schemaIndex, propIndex, 'maximum', e.target.value ? parseFloat(e.target.value) : undefined)}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                </Box>
              )}
              
              <Divider />
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={prop.nullable || false}
                      onChange={(e) => onUpdateProperty(schemaIndex, propIndex, 'nullable', e.target.checked)}
                      size="small"
                    />
                  }
                  label="Nullable"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={prop.deprecated || false}
                      onChange={(e) => onUpdateProperty(schemaIndex, propIndex, 'deprecated', e.target.checked)}
                      size="small"
                      color="warning"
                    />
                  }
                  label="Deprecated"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={prop.readOnly || false}
                      onChange={(e) => onUpdateProperty(schemaIndex, propIndex, 'readOnly', e.target.checked)}
                      size="small"
                    />
                  }
                  label="Read Only"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={prop.writeOnly || false}
                      onChange={(e) => onUpdateProperty(schemaIndex, propIndex, 'writeOnly', e.target.checked)}
                      size="small"
                    />
                  }
                  label="Write Only"
                />
              </Box>
            </Stack>
          </Popover>
        </>
      )}

      <IconButton onClick={() => onRemoveProperty(schemaIndex, propIndex)} color="error" size="small">
        <DeleteIcon />
      </IconButton>
    </Box>
  );
};