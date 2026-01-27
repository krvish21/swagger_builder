import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DnsIcon from '@mui/icons-material/Dns';
import SecurityIcon from '@mui/icons-material/Security';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import GavelIcon from '@mui/icons-material/Gavel';
import type { SwaggerServer, SwaggerSecurityScheme, SwaggerInfo } from '../../types/swagger';

interface InfoTabProps {
  info: SwaggerInfo;
  servers: SwaggerServer[];
  securitySchemes: SwaggerSecurityScheme[];
  onUpdate: (field: string, value: string) => void;
  onUpdateContact: (field: string, value: string) => void;
  onUpdateLicense: (field: string, value: string) => void;
  onAddServer: () => void;
  onUpdateServer: (index: number, field: keyof SwaggerServer, value: string) => void;
  onRemoveServer: (index: number) => void;
  onAddSecurityScheme: () => void;
  onAddCognitoSecurityScheme: () => void;
  onUpdateSecurityScheme: (index: number, field: keyof SwaggerSecurityScheme, value: string) => void;
  onRemoveSecurityScheme: (index: number) => void;
}

export const InfoTab: React.FC<InfoTabProps> = ({
  info,
  servers,
  securitySchemes,
  onUpdate,
  onUpdateContact,
  onUpdateLicense,
  onAddServer,
  onUpdateServer,
  onRemoveServer,
  onAddSecurityScheme,
  onAddCognitoSecurityScheme,
  onUpdateSecurityScheme,
  onRemoveSecurityScheme,
}) => {
  return (
    <Stack spacing={3}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
        API Information
      </Typography>
      <TextField
        fullWidth
        label="API Title"
        value={info.title}
        onChange={(e) => onUpdate('title', e.target.value)}
        placeholder="e.g., BGB-PaymentPlans-Api"
        variant="outlined"
        size="small"
      />
      <TextField
        fullWidth
        label="Description"
        value={info.description}
        onChange={(e) => onUpdate('description', e.target.value)}
        placeholder="Describe what your API does..."
        multiline
        rows={2}
        variant="outlined"
        size="small"
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <TextField
          fullWidth
          label="Version"
          value={info.version}
          onChange={(e) => onUpdate('version', e.target.value)}
          placeholder="e.g., 1.0.0"
          variant="outlined"
          size="small"
        />
        <TextField
          fullWidth
          label="Terms of Service URL"
          value={info.termsOfService || ''}
          onChange={(e) => onUpdate('termsOfService', e.target.value)}
          placeholder="https://example.com/terms"
          variant="outlined"
          size="small"
        />
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Contact Section */}
      <Accordion defaultExpanded={!!(info.contact?.name || info.contact?.email || info.contact?.url)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ContactMailIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#374151' }}>
              Contact Information
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <TextField
              label="Contact Name"
              value={info.contact?.name || ''}
              onChange={(e) => onUpdateContact('name', e.target.value)}
              placeholder="API Support Team"
              size="small"
              fullWidth
            />
            <TextField
              label="Contact Email"
              value={info.contact?.email || ''}
              onChange={(e) => onUpdateContact('email', e.target.value)}
              placeholder="support@example.com"
              size="small"
              fullWidth
            />
            <TextField
              label="Contact URL"
              value={info.contact?.url || ''}
              onChange={(e) => onUpdateContact('url', e.target.value)}
              placeholder="https://example.com/support"
              size="small"
              fullWidth
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* License Section */}
      <Accordion defaultExpanded={!!(info.license?.name)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GavelIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#374151' }}>
              License
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="License Name"
              value={info.license?.name || ''}
              onChange={(e) => onUpdateLicense('name', e.target.value)}
              placeholder="Apache 2.0"
              size="small"
              fullWidth
            />
            <TextField
              label="License URL"
              value={info.license?.url || ''}
              onChange={(e) => onUpdateLicense('url', e.target.value)}
              placeholder="https://www.apache.org/licenses/LICENSE-2.0"
              size="small"
              fullWidth
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Servers Section */}
      <Accordion defaultExpanded={servers.length > 0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DnsIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
              Servers ({servers.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAddServer}
                size="small"
                sx={{ bgcolor: '#1976d2' }}
              >
                Add Server
              </Button>
            </Box>
            {servers.map((server, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'flex-start',
                  p: 2,
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                  backgroundColor: '#f9fafb',
                }}
              >
                <TextField
                  label="URL"
                  value={server.url}
                  onChange={(e) => onUpdateServer(index, 'url', e.target.value)}
                  placeholder="https://api.example.com/v1"
                  size="small"
                  sx={{ flex: 2 }}
                />
                <TextField
                  label="Description"
                  value={server.description}
                  onChange={(e) => onUpdateServer(index, 'description', e.target.value)}
                  placeholder="Production server"
                  size="small"
                  sx={{ flex: 2 }}
                />
                <IconButton
                  onClick={() => onRemoveServer(index)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Security Schemes Section */}
      <Accordion defaultExpanded={securitySchemes.length > 0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
              Security Schemes ({securitySchemes.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAddSecurityScheme}
                size="small"
                sx={{ bgcolor: '#1976d2' }}
              >
                Add Scheme
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAddCognitoSecurityScheme}
                size="small"
                sx={{ bgcolor: '#1976d2' }}
              >
                Add Cognito
              </Button>
            </Box>
            {securitySchemes.map((scheme, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                  backgroundColor: '#f9fafb',
                }}
              >
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <TextField
                      label="Name"
                      value={scheme.name}
                      onChange={(e) => onUpdateSecurityScheme(index, 'name', e.target.value)}
                      placeholder="bearerAuth"
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <FormControl size="small" sx={{ flex: 1 }}>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={scheme.type}
                        label="Type"
                        onChange={(e) => onUpdateSecurityScheme(index, 'type', e.target.value)}
                      >
                        <MenuItem value="http">HTTP</MenuItem>
                        <MenuItem value="apiKey">API Key</MenuItem>
                        <MenuItem value="oauth2">OAuth2</MenuItem>
                        <MenuItem value="openIdConnect">OpenID Connect</MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton
                      onClick={() => onRemoveSecurityScheme(index)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  {/* HTTP-specific fields */}
                  {scheme.type === 'http' && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControl size="small" sx={{ flex: 1 }}>
                        <InputLabel>Scheme</InputLabel>
                        <Select
                          value={scheme.scheme || 'bearer'}
                          label="Scheme"
                          onChange={(e) => onUpdateSecurityScheme(index, 'scheme', e.target.value)}
                        >
                          <MenuItem value="bearer">Bearer</MenuItem>
                          <MenuItem value="basic">Basic</MenuItem>
                        </Select>
                      </FormControl>
                      {scheme.scheme === 'bearer' && (
                        <TextField
                          label="Bearer Format"
                          value={scheme.bearerFormat || ''}
                          onChange={(e) => onUpdateSecurityScheme(index, 'bearerFormat', e.target.value)}
                          placeholder="JWT"
                          size="small"
                          sx={{ flex: 1 }}
                        />
                      )}
                    </Box>
                  )}

                  {/* API Key-specific fields */}
                  {scheme.type === 'apiKey' && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControl size="small" sx={{ flex: 1 }}>
                        <InputLabel>In</InputLabel>
                        <Select
                          value={scheme.in || 'header'}
                          label="In"
                          onChange={(e) => onUpdateSecurityScheme(index, 'in', e.target.value)}
                        >
                          <MenuItem value="header">Header</MenuItem>
                          <MenuItem value="query">Query</MenuItem>
                          <MenuItem value="cookie">Cookie</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        label="Key Name"
                        value={scheme.apiKeyName || ''}
                        onChange={(e) => onUpdateSecurityScheme(index, 'apiKeyName', e.target.value)}
                        placeholder="X-API-Key"
                        size="small"
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
};