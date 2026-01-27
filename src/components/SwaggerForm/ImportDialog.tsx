import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { importYamlDocument } from '../../utils/yamlImporter';
import type { SwaggerDocument } from '../../types/swagger';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (document: SwaggerDocument) => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ open, onClose, onImport }) => {
  const [yamlContent, setYamlContent] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [parsedDocument, setParsedDocument] = useState<SwaggerDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setYamlContent('');
    setErrors([]);
    setWarnings([]);
    setIsValid(null);
    setParsedDocument(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setYamlContent(content);
      validateContent(content);
    };
    reader.readAsText(file);

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateContent = (content: string) => {
    if (!content.trim()) {
      setErrors([]);
      setWarnings([]);
      setIsValid(null);
      setParsedDocument(null);
      return;
    }

    const result = importYamlDocument(content);
    setErrors(result.errors);
    setWarnings(result.warnings);
    setIsValid(result.success);
    setParsedDocument(result.document || null);
  };

  const handleYamlChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = event.target.value;
    setYamlContent(content);
    
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateContent(content);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleImport = () => {
    if (parsedDocument) {
      onImport(parsedDocument);
      handleClose();
    }
  };

  const getDocumentSummary = () => {
    if (!parsedDocument) return null;

    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: '#f0fdf4', borderRadius: 1, border: '1px solid #86efac' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#166534', mb: 1 }}>
          Document Summary
        </Typography>
        <Typography variant="body2" sx={{ color: '#15803d' }}>
          <strong>Title:</strong> {parsedDocument.info.title || '(empty)'}<br />
          <strong>Version:</strong> {parsedDocument.info.version}<br />
          <strong>Paths:</strong> {parsedDocument.paths.length}<br />
          <strong>Schemas:</strong> {parsedDocument.schemas.length}<br />
          <strong>Tags:</strong> {parsedDocument.tags.length}<br />
          <strong>Security Schemes:</strong> {parsedDocument.securitySchemes.length}
        </Typography>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <UploadFileIcon color="primary" />
        Import OpenAPI Specification
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Warning</AlertTitle>
          Importing will replace your current document. Make sure to copy your current YAML if needed.
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload YAML File
          </Button>
          <Button
            variant="outlined"
            startIcon={<ContentPasteIcon />}
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                setYamlContent(text);
                validateContent(text);
              } catch {
                // Clipboard access denied - user can paste manually
              }
            }}
          >
            Paste from Clipboard
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".yaml,.yml"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </Box>

        <TextField
          fullWidth
          multiline
          rows={12}
          value={yamlContent}
          onChange={handleYamlChange}
          placeholder="Paste your OpenAPI YAML document here..."
          variant="outlined"
          sx={{
            '& .MuiInputBase-input': {
              fontFamily: '"Fira Code", "Consolas", monospace',
              fontSize: '0.85rem',
            },
          }}
        />

        {/* Validation Results */}
        {isValid !== null && (
          <Box sx={{ mt: 2 }}>
            {isValid ? (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                Document is valid and ready to import
              </Alert>
            ) : (
              <Alert severity="error" icon={<ErrorIcon />}>
                Document has errors that must be fixed before importing
              </Alert>
            )}

            {errors.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#dc2626', fontWeight: 600 }}>
                  Errors ({errors.length})
                </Typography>
                <List dense>
                  {errors.map((error, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <ErrorIcon sx={{ color: '#dc2626', fontSize: 18 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={error} 
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {warnings.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#d97706', fontWeight: 600 }}>
                  Warnings ({warnings.length})
                </Typography>
                <List dense>
                  {warnings.map((warning, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <WarningIcon sx={{ color: '#d97706', fontSize: 18 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={warning} 
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {isValid && getDocumentSummary()}
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleReset} disabled={!yamlContent}>
          Clear
        </Button>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={!isValid || !parsedDocument}
          sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
        >
          Import Document
        </Button>
      </DialogActions>
    </Dialog>
  );
};
