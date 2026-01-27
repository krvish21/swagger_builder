import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import type { ValidationResult } from '../../types/validation';
import { validateOpenApiSpec } from '../../utils/openApiValidator';
import { ValidationPanel } from './ValidationPanel';
import { YamlHighlighter } from './YamlHighlighter';

// Lazy load SwaggerUIPreview for better performance
const SwaggerUIPreview = lazy(() => import('./SwaggerUIPreview').then(module => ({ default: module.SwaggerUIPreview })));

// Font size constants
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 24;
const DEFAULT_FONT_SIZE = 14;
const FONT_SIZE_STEP = 2;
const FONT_SIZE_STORAGE_KEY = 'openapi-builder-yaml-font-size';

// Load font size from localStorage
const getStoredFontSize = (): number => {
  try {
    const stored = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    if (stored) {
      const size = parseInt(stored, 10);
      if (size >= MIN_FONT_SIZE && size <= MAX_FONT_SIZE) {
        return size;
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return DEFAULT_FONT_SIZE;
};

interface LivePreviewProps {
  yamlContent: string;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ yamlContent }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [fontSize, setFontSize] = useState(getStoredFontSize);

  // Save font size to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(fontSize));
    } catch {
      // Ignore localStorage errors
    }
  }, [fontSize]);

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + FONT_SIZE_STEP, MAX_FONT_SIZE));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - FONT_SIZE_STEP, MIN_FONT_SIZE));
  };

  // Debounced validation
  const runValidation = useCallback(async (content: string) => {
    setIsValidating(true);
    try {
      const result = await validateOpenApiSpec(content);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: [{ path: 'document', message: String(error), severity: 'error' }],
        warnings: [],
      });
    } finally {
      setIsValidating(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (yamlContent) {
        runValidation(yamlContent);
      }
    }, 500); // Debounce validation by 500ms

    return () => clearTimeout(timeoutId);
  }, [yamlContent, runValidation]);

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlContent);
  };

  const getStatusIcon = (): React.ReactElement | undefined => {
    if (isValidating) {
      return <CircularProgress size={16} sx={{ color: '#fff' }} />;
    }
    if (!validationResult) return undefined;
    if (validationResult.errors.length > 0) {
      return <ErrorOutlineIcon sx={{ color: '#ef4444' }} />;
    }
    if (validationResult.warnings.length > 0) {
      return <WarningAmberIcon sx={{ color: '#f59e0b' }} />;
    }
    return <CheckCircleOutlineIcon sx={{ color: '#22c55e' }} />;
  };

  const getStatusChip = () => {
    if (isValidating) {
      return <Chip label="Validating..." size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' }} />;
    }
    if (!validationResult) return null;
    
    const errorCount = validationResult.errors.length;
    const warningCount = validationResult.warnings.length;
    
    if (errorCount > 0) {
      return (
        <Chip 
          icon={<ErrorOutlineIcon sx={{ color: '#ef4444 !important' }} />}
          label={`${errorCount} error${errorCount > 1 ? 's' : ''}`} 
          size="small" 
          sx={{ bgcolor: 'rgba(239,68,68,0.2)', color: '#fca5a5' }} 
        />
      );
    }
    if (warningCount > 0) {
      return (
        <Chip 
          icon={<WarningAmberIcon sx={{ color: '#f59e0b !important' }} />}
          label={`${warningCount} warning${warningCount > 1 ? 's' : ''}`} 
          size="small" 
          sx={{ bgcolor: 'rgba(245,158,11,0.2)', color: '#fcd34d' }} 
        />
      );
    }
    return (
      <Chip 
        icon={<CheckCircleOutlineIcon sx={{ color: '#22c55e !important' }} />}
        label="Valid" 
        size="small" 
        sx={{ bgcolor: 'rgba(34,197,94,0.2)', color: '#86efac' }} 
      />
    );
  };

  return (
    <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', position: 'sticky', top: 24, alignSelf: 'start' }}>
      <Box sx={{ bgcolor: '#1f2937', color: '#fff', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityIcon /> Live Preview
          </Typography>
          {getStatusChip()}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Decrease font size">
            <IconButton size="small" onClick={decreaseFontSize} sx={{ color: '#fff' }}>
              <RemoveIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Increase font size">
            <IconButton size="small" onClick={increaseFontSize} sx={{ color: '#fff' }}>
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            size="small"
            sx={{ color: '#fff', borderColor: '#fff', '&:hover': { borderColor: '#ddd', bgcolor: 'rgba(255,255,255,0.1)' } }}
            onClick={handleCopy}
          >
            Copy YAML
          </Button>
        </Box>
      </Box>
      
      {/* Tabs for Swagger UI, YAML and Validation */}
      <Box sx={{ bgcolor: '#374151', borderBottom: 1, borderColor: '#4b5563' }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              color: '#9ca3af',
              minHeight: 40,
              textTransform: 'none',
              '&.Mui-selected': {
                color: '#fff',
              },
            },
            '& .MuiTabs-indicator': {
              bgcolor: '#3b82f6',
            },
          }}
        >
          <Tab 
            label="Swagger UI" 
            icon={<VisibilityIcon sx={{ fontSize: 18 }} />} 
            iconPosition="start"
            sx={{ gap: 0.5 }}
          />
          <Tab 
            label="YAML Output" 
            icon={<CodeIcon sx={{ fontSize: 18 }} />} 
            iconPosition="start"
            sx={{ gap: 0.5 }}
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Validation
                {validationResult && (validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
                  <Box
                    sx={{
                      bgcolor: validationResult.errors.length > 0 ? '#ef4444' : '#f59e0b',
                      color: '#fff',
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {validationResult.errors.length + validationResult.warnings.length}
                  </Box>
                )}
              </Box>
            }
            icon={getStatusIcon()}
            iconPosition="start"
            sx={{ gap: 0.5 }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Suspense fallback={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, bgcolor: '#fff' }}>
            <CircularProgress />
          </Box>
        }>
          <SwaggerUIPreview yamlContent={yamlContent} />
        </Suspense>
      )}

      {activeTab === 1 && (
        <Box
          sx={{
            bgcolor: '#011627',
            overflow: 'auto',
            maxHeight: 'calc(100vh - 280px)',
            minHeight: 400,
          }}
        >
          <YamlHighlighter code={yamlContent} fontSize={fontSize} />
        </Box>
      )}

      {activeTab === 2 && (
        <Box sx={{ maxHeight: 'calc(100vh - 280px)', overflow: 'auto' }}>
          <ValidationPanel validationResult={validationResult} isValidating={isValidating} />
        </Box>
      )}
    </Card>
  );
};