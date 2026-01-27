import React from 'react';
import {
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  CircularProgress,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { ValidationResult, ValidationError } from '../../types/validation';

interface ValidationPanelProps {
  validationResult: ValidationResult | null;
  isValidating: boolean;
  onErrorClick?: (error: ValidationError) => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  validationResult,
  isValidating,
  onErrorClick,
}) => {
  const [expanded, setExpanded] = React.useState(true);

  const getStatusColor = () => {
    if (isValidating) return '#6b7280';
    if (!validationResult) return '#6b7280';
    if (validationResult.errors.length > 0) return '#ef4444';
    if (validationResult.warnings.length > 0) return '#f59e0b';
    return '#10b981';
  };

  const getStatusIcon = () => {
    if (isValidating) {
      return <CircularProgress size={20} sx={{ color: '#fff' }} />;
    }
    if (!validationResult) return null;
    if (validationResult.errors.length > 0) {
      return <ErrorIcon sx={{ color: '#fff' }} />;
    }
    if (validationResult.warnings.length > 0) {
      return <WarningIcon sx={{ color: '#fff' }} />;
    }
    return <CheckCircleIcon sx={{ color: '#fff' }} />;
  };

  const getStatusText = () => {
    if (isValidating) return 'Validating...';
    if (!validationResult) return 'Not validated';
    if (validationResult.errors.length > 0) {
      return `${validationResult.errors.length} error${validationResult.errors.length > 1 ? 's' : ''}`;
    }
    if (validationResult.warnings.length > 0) {
      return `${validationResult.warnings.length} warning${validationResult.warnings.length > 1 ? 's' : ''}`;
    }
    return 'Valid OpenAPI 3.0/3.1';
  };

  const allIssues = [
    ...(validationResult?.errors || []),
    ...(validationResult?.warnings || []),
  ];

  return (
    <Box sx={{ borderTop: '1px solid #374151' }}>
      {/* Validation Header */}
      <Box
        sx={{
          bgcolor: getStatusColor(),
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: allIssues.length > 0 ? 'pointer' : 'default',
        }}
        onClick={() => allIssues.length > 0 && setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon()}
          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
            {getStatusText()}
          </Typography>
          {validationResult && validationResult.warnings.length > 0 && validationResult.errors.length > 0 && (
            <Chip
              size="small"
              label={`${validationResult.warnings.length} warning${validationResult.warnings.length > 1 ? 's' : ''}`}
              sx={{
                bgcolor: 'rgba(245, 158, 11, 0.3)',
                color: '#fff',
                fontSize: '0.7rem',
                height: 20,
              }}
            />
          )}
        </Box>
        {allIssues.length > 0 && (
          <IconButton size="small" sx={{ color: '#fff', p: 0 }}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>

      {/* Validation Issues List */}
      <Collapse in={expanded && allIssues.length > 0}>
        <Box sx={{ maxHeight: 200, overflow: 'auto', bgcolor: '#1a1a2e' }}>
          <List dense sx={{ py: 0 }}>
            {allIssues.map((issue, index) => (
              <ListItem
                key={index}
                sx={{
                  borderBottom: '1px solid #2d2d44',
                  cursor: onErrorClick ? 'pointer' : 'default',
                  '&:hover': onErrorClick
                    ? { bgcolor: 'rgba(255,255,255,0.05)' }
                    : {},
                  py: 1,
                }}
                onClick={() => onErrorClick?.(issue)}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {issue.severity === 'error' ? (
                    <ErrorIcon sx={{ color: '#ef4444', fontSize: 18 }} />
                  ) : (
                    <WarningIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{
                          color: '#e5e7eb',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace',
                        }}
                      >
                        {issue.message}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        size="small"
                        label={issue.path}
                        sx={{
                          bgcolor: 'rgba(99, 102, 241, 0.2)',
                          color: '#a5b4fc',
                          fontSize: '0.65rem',
                          height: 18,
                          fontFamily: 'monospace',
                        }}
                      />
                      {issue.line && (
                        <Typography
                          variant="caption"
                          sx={{ color: '#6b7280', fontSize: '0.65rem' }}
                        >
                          Line {issue.line}
                        </Typography>
                      )}
                    </Box>
                  }
                  primaryTypographyProps={{ component: 'div' }}
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Collapse>
    </Box>
  );
};
