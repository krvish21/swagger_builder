import React, { useMemo, useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import yaml from 'yaml';

interface SwaggerUIPreviewProps {
  yamlContent: string;
}

export const SwaggerUIPreview: React.FC<SwaggerUIPreviewProps> = ({ yamlContent }) => {
  const [debouncedContent, setDebouncedContent] = useState(yamlContent);
  const [isLoading, setIsLoading] = useState(true);

  // Debounce the YAML content to avoid excessive re-renders
  useEffect(() => {
    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      setDebouncedContent(yamlContent);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [yamlContent]);

  // Parse YAML to spec object
  const { spec, error } = useMemo(() => {
    if (!debouncedContent) {
      return { spec: null, error: 'No content to preview' };
    }

    try {
      const parsed = yaml.parse(debouncedContent);
      if (!parsed || typeof parsed !== 'object') {
        return { spec: null, error: 'Invalid OpenAPI document' };
      }
      return { spec: parsed, error: null };
    } catch (e) {
      const parseError = e as Error;
      return { spec: null, error: `YAML Parse Error: ${parseError.message}` };
    }
  }, [debouncedContent]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          bgcolor: '#fff',
        }}
      >
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2, color: '#6b7280' }}>Loading preview...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          bgcolor: '#fef2f2',
          p: 3,
        }}
      >
        <Typography variant="h6" sx={{ color: '#dc2626', mb: 1 }}>
          Unable to render preview
        </Typography>
        <Typography sx={{ color: '#7f1d1d', textAlign: 'center' }}>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        minHeight: 400,
        maxHeight: 'calc(100vh - 280px)',
        overflow: 'auto',
        '& .swagger-ui': {
          fontFamily: 'inherit',
        },
        '& .swagger-ui .info': {
          margin: '20px 0',
        },
        '& .swagger-ui .scheme-container': {
          boxShadow: 'none',
          padding: '15px 0',
        },
        '& .swagger-ui .opblock-tag': {
          fontSize: '1.1rem',
        },
        '& .swagger-ui .opblock': {
          marginBottom: '10px',
          borderRadius: '4px',
        },
        '& .swagger-ui .opblock .opblock-summary': {
          padding: '8px 15px',
        },
        '& .swagger-ui .btn': {
          fontSize: '0.85rem',
        },
        '& .swagger-ui table tbody tr td': {
          padding: '8px 0',
        },
      }}
    >
      <SwaggerUI spec={spec} docExpansion="list" defaultModelsExpandDepth={1} />
    </Box>
  );
};
