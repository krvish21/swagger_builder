import React, { useState, useEffect } from 'react';
import { Box, Button, Card, Tab, Tabs, Typography, Snackbar, Alert, Chip, Tooltip, IconButton } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { TabPanel } from './TabPanel';
import { InfoTab } from './InfoTab';
import { TagsTab } from './TagsTab';
import { SchemasTab } from './SchemasTab';
import { PathsTab } from './PathsTab';
import { LivePreview } from './LivePreview';
import { ImportDialog } from './ImportDialog';
import { useSwaggerDocument } from '../../hooks/useSwaggerDocument';
import { buildYamlDocument } from '../../utils/yamlGenerator';
import { saveFormCollapsedState, loadFormCollapsedState } from '../../utils/localStorage';
import type { SwaggerDocument } from '../../types/swagger';

// Helper to format relative time
const formatLastSaved = (date: Date | null): string => {
  if (!date) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 5) return 'just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

export const SwaggerForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isFormCollapsed, setIsFormCollapsed] = useState(loadFormCollapsedState);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [lastSavedDisplay, setLastSavedDisplay] = useState('');

  const {
    document,
    lastSaved,
    wasRestored,
    importDocument,
    resetDocument,
    updateInfo,
    updateContact,
    updateLicense,
    addTag,
    updateTag,
    removeTag,
    reorderTags,
    // Servers
    addServer,
    updateServer,
    removeServer,
    // Security Schemes
    addSecurityScheme,
    addCognitoSecurityScheme,
    updateSecurityScheme,
    removeSecurityScheme,
    // Paths
    addPath,
    updatePath,
    removePath,
    addOperation,
    removeOperation,
    duplicatePath,
    reorderPaths,
    addParameter,
    updateParameter,
    removeParameter,
    addResponse,
    updateResponse,
    removeResponse,
    addCommonErrorResponses,
    // Request Body
    addRequestBody,
    updateRequestBody,
    removeRequestBody,
    // Schemas
    addSchema,
    addTemplateSchema,
    updateSchema,
    removeSchema,
    reorderSchemas,
    addSchemaProperty,
    updateSchemaProperty,
    removeSchemaProperty,
  } = useSwaggerDocument();

  // Update the last saved display every 10 seconds
  useEffect(() => {
    const updateDisplay = () => {
      setLastSavedDisplay(formatLastSaved(lastSaved));
    };
    updateDisplay();
    const interval = setInterval(updateDisplay, 10000);
    return () => clearInterval(interval);
  }, [lastSaved]);

  // Show notification when document is restored from LocalStorage
  useEffect(() => {
    if (wasRestored) {
      const timer = setTimeout(() => {
        setSnackbar({
          open: true,
          message: 'Previous work restored from browser storage',
          severity: 'info',
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [wasRestored]);

  const yamlPreview = buildYamlDocument(document);

  const handleAddTemplateSchema = (templateKey: string) => {
    addTemplateSchema(templateKey);
    setSnackbar({ open: true, message: `Added "${templateKey}" schema template`, severity: 'success' });
  };

  const handleAddCommonErrorResponses = (pathIndex: number, operationIndex: number) => {
    addCommonErrorResponses(pathIndex, operationIndex);
    setSnackbar({ open: true, message: 'Added common error responses (400, 401, 403, 404, 500)', severity: 'success' });
  };

  const handleDuplicatePath = (pathIndex: number, operationIndex: number) => {
    duplicatePath(pathIndex, operationIndex);
    setSnackbar({ open: true, message: 'Operation duplicated', severity: 'success' });
  };

  const handleImportDocument = (doc: SwaggerDocument) => {
    importDocument(doc);
    setSnackbar({
      open: true,
      message: `Imported "${doc.info.title || 'Untitled'}" with ${doc.paths.length} paths and ${doc.schemas.length} schemas`,
      severity: 'success'
    });
  };

  const handleNewDocument = () => {
    resetDocument();
    setSnackbar({ open: true, message: 'Created new document', severity: 'info' });
  };

  // Save collapse state to localStorage
  const toggleFormCollapsed = () => {
    setIsFormCollapsed(prev => {
      const newState = !prev;
      saveFormCollapsedState(newState);
      return newState;
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f3f4f6', p: 3 }}>
      <Box sx={{ maxWidth: 1800, mx: 'auto' }}>
        {/* Header - Single Row */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon sx={{ fontSize: 28 }} />
            Swagger Document Builder
          </Typography>

          {/* Action Buttons & Auto-save Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Auto-save Indicator */}
            {lastSaved && (
              <Tooltip title={`Last saved: ${lastSaved.toLocaleString()}`}>
                <Chip
                  icon={<SaveIcon sx={{ fontSize: 14 }} />}
                  label={`Saved ${lastSavedDisplay}`}
                  size="small"
                  sx={{
                    bgcolor: '#dcfce7',
                    color: '#166534',
                    '& .MuiChip-icon': { color: '#16a34a' },
                  }}
                />
              </Tooltip>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleNewDocument}
              sx={{ borderColor: '#6b7280', color: '#6b7280' }}
            >
              New
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<UploadFileIcon />}
              onClick={() => setImportDialogOpen(true)}
              sx={{ bgcolor: '#1976d2' }}
            >
              Import
            </Button>
          </Box>
        </Box>

        {/* Main Layout - Split Screen */}
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Collapsed Form Bar */}
          {isFormCollapsed && (
            <Box
              sx={{
                width: 48,
                bgcolor: '#1976d2',
                borderRadius: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 2,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#1565c0',
                  width: 56,
                },
              }}
              onClick={toggleFormCollapsed}
            >
              <Tooltip title="Expand Form" placement="right">
                <IconButton sx={{ color: '#fff', mb: 2 }}>
                  <ChevronRightIcon />
                </IconButton>
              </Tooltip>
              <Box
                sx={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                  transform: 'rotate(180deg)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  letterSpacing: 1,
                  opacity: 0.9,
                }}
              >
                FORM EDITOR
              </Box>
            </Box>
          )}

          {/* Left Side - Form */}
          {!isFormCollapsed && (
            <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', flex: 1, minWidth: 0, position: 'relative' }}>
              {/* Collapse Button */}
              <Tooltip title="Collapse Form" placement="right">
                <IconButton
                  onClick={toggleFormCollapsed}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 10,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                    },
                  }}
                  size="small"
                >
                  <ChevronLeftIcon />
                </IconButton>
              </Tooltip>

              <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#1976d2' }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, newValue) => setActiveTab(newValue)}
                  variant="fullWidth"
                  sx={{
                    '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', fontWeight: 600 },
                    '& .Mui-selected': { color: '#fff' },
                    '& .MuiTabs-indicator': { backgroundColor: '#fff' },
                  }}
                >
                  <Tab label="📋 Info" />
                  <Tab label="🏷️ Tags" />
                  <Tab label="📦 Schemas" />
                  <Tab label="🛤️ Paths" />
                </Tabs>
              </Box>

              <TabPanel value={activeTab} index={0}>
                <InfoTab
                  info={document.info}
                  onUpdate={updateInfo}
                  onUpdateContact={updateContact}
                  onUpdateLicense={updateLicense}
                  servers={document.servers}
                  securitySchemes={document.securitySchemes}
                  onAddServer={addServer}
                  onUpdateServer={updateServer}
                  onRemoveServer={removeServer}
                  onAddSecurityScheme={addSecurityScheme}
                  onAddCognitoSecurityScheme={addCognitoSecurityScheme}
                  onUpdateSecurityScheme={updateSecurityScheme}
                  onRemoveSecurityScheme={removeSecurityScheme}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <TagsTab
                  tags={document.tags}
                  onAdd={addTag}
                  onUpdate={updateTag}
                  onRemove={removeTag}
                  onReorder={reorderTags}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <SchemasTab
                  schemas={document.schemas}
                  onAdd={addSchema}
                  onAddTemplate={handleAddTemplateSchema}
                  onUpdate={updateSchema}
                  onRemove={removeSchema}
                  onReorder={reorderSchemas}
                  onAddProperty={addSchemaProperty}
                  onUpdateProperty={updateSchemaProperty}
                  onRemoveProperty={removeSchemaProperty}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                <PathsTab
                  paths={document.paths}
                  schemas={document.schemas}
                  securitySchemes={document.securitySchemes}
                  onAdd={addPath}
                  onUpdate={updatePath}
                  onRemove={removePath}
                  onAddOperation={addOperation}
                  onRemoveOperation={removeOperation}
                  onDuplicate={handleDuplicatePath}
                  onReorder={reorderPaths}
                  onAddParameter={addParameter}
                  onUpdateParameter={updateParameter}
                  onRemoveParameter={removeParameter}
                  onAddResponse={addResponse}
                  onUpdateResponse={updateResponse}
                  onRemoveResponse={removeResponse}
                  onAddCommonErrorResponses={handleAddCommonErrorResponses}
                  onAddRequestBody={addRequestBody}
                  onUpdateRequestBody={updateRequestBody}
                  onRemoveRequestBody={removeRequestBody}
                />
              </TabPanel>
            </Card>
          )}

          {/* Right Side - Live Preview */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <LivePreview yamlContent={yamlPreview} />
          </Box>
        </Box>
      </Box>

      {/* Import Dialog */}
      <ImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImportDocument}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '', severity: 'success' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ open: false, message: '', severity: 'success' })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};