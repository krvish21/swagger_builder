import React, { useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import CodeIcon from '@mui/icons-material/Code';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LinkIcon from '@mui/icons-material/Link';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import TableChartIcon from '@mui/icons-material/TableChart';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  minHeight?: number;
}

type MarkdownAction = 
  | 'bold' 
  | 'italic' 
  | 'code' 
  | 'codeblock'
  | 'h2' 
  | 'h3' 
  | 'bullet' 
  | 'numbered' 
  | 'link' 
  | 'quote'
  | 'table'
  | 'hr';

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  label = 'Description',
  placeholder = 'Supports Markdown formatting...',
  rows = 4,
  size = 'small',
  fullWidth = true,
  minHeight,
}) => {
  const textFieldRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (action: MarkdownAction) => {
    const textarea = textFieldRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    let newText = '';
    let cursorOffset = 0;

    switch (action) {
      case 'bold':
        newText = `**${selectedText || 'bold text'}**`;
        cursorOffset = selectedText ? newText.length : 2;
        break;
      case 'italic':
        newText = `*${selectedText || 'italic text'}*`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'code':
        newText = `\`${selectedText || 'code'}\``;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'codeblock':
        newText = `\n\`\`\`\n${selectedText || 'code block'}\n\`\`\`\n`;
        cursorOffset = selectedText ? newText.length : 5;
        break;
      case 'h2':
        newText = `\n## ${selectedText || 'Heading 2'}\n`;
        cursorOffset = selectedText ? newText.length : 4;
        break;
      case 'h3':
        newText = `\n### ${selectedText || 'Heading 3'}\n`;
        cursorOffset = selectedText ? newText.length : 5;
        break;
      case 'bullet':
        if (selectedText) {
          // Convert selected lines to bullet list
          const lines = selectedText.split('\n');
          newText = lines.map(line => `- ${line}`).join('\n');
        } else {
          newText = '\n- List item\n- List item\n- List item\n';
        }
        cursorOffset = 3;
        break;
      case 'numbered':
        if (selectedText) {
          // Convert selected lines to numbered list
          const lines = selectedText.split('\n');
          newText = lines.map((line, i) => `${i + 1}. ${line}`).join('\n');
        } else {
          newText = '\n1. First item\n2. Second item\n3. Third item\n';
        }
        cursorOffset = 4;
        break;
      case 'link':
        newText = `[${selectedText || 'link text'}](url)`;
        cursorOffset = selectedText ? newText.length - 4 : 1;
        break;
      case 'quote':
        if (selectedText) {
          const lines = selectedText.split('\n');
          newText = lines.map(line => `> ${line}`).join('\n');
        } else {
          newText = '\n> Quoted text\n';
        }
        cursorOffset = 3;
        break;
      case 'table':
        newText = `\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n`;
        cursorOffset = 3;
        break;
      case 'hr':
        newText = '\n\n---\n\n';
        cursorOffset = newText.length;
        break;
      default:
        return;
    }

    const newValue = value.substring(0, start) + newText + value.substring(end);
    onChange(newValue);

    // Set cursor position after the operation
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + cursorOffset;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          insertMarkdown('bold');
          break;
        case 'i':
          e.preventDefault();
          insertMarkdown('italic');
          break;
        case 'k':
          e.preventDefault();
          insertMarkdown('link');
          break;
        case '`':
          e.preventDefault();
          insertMarkdown('code');
          break;
      }
    }
  };

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          p: 0.5,
          bgcolor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderBottom: 'none',
          borderRadius: '4px 4px 0 0',
          flexWrap: 'wrap',
        }}
      >
        {/* Text Formatting */}
        <Tooltip title="Bold (Ctrl+B)">
          <IconButton size="small" onClick={() => insertMarkdown('bold')}>
            <FormatBoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic (Ctrl+I)">
          <IconButton size="small" onClick={() => insertMarkdown('italic')}>
            <FormatItalicIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Inline Code (Ctrl+`)">
          <IconButton size="small" onClick={() => insertMarkdown('code')}>
            <CodeIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Headings */}
        <ToggleButtonGroup size="small" exclusive>
          <Tooltip title="Heading 2">
            <ToggleButton 
              value="h2" 
              onClick={() => insertMarkdown('h2')}
              sx={{ py: 0.5, px: 1, fontSize: '0.75rem', fontWeight: 'bold' }}
            >
              H2
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Heading 3">
            <ToggleButton 
              value="h3" 
              onClick={() => insertMarkdown('h3')}
              sx={{ py: 0.5, px: 1, fontSize: '0.75rem', fontWeight: 'bold' }}
            >
              H3
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Lists */}
        <Tooltip title="Bullet List">
          <IconButton size="small" onClick={() => insertMarkdown('bullet')}>
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Numbered List">
          <IconButton size="small" onClick={() => insertMarkdown('numbered')}>
            <FormatListNumberedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Other Elements */}
        <Tooltip title="Link (Ctrl+K)">
          <IconButton size="small" onClick={() => insertMarkdown('link')}>
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Quote">
          <IconButton size="small" onClick={() => insertMarkdown('quote')}>
            <FormatQuoteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Code Block">
          <IconButton size="small" onClick={() => insertMarkdown('codeblock')}>
            <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 'bold' }}>
              {'</>'}
            </Box>
          </IconButton>
        </Tooltip>
        <Tooltip title="Table">
          <IconButton size="small" onClick={() => insertMarkdown('table')}>
            <TableChartIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Horizontal Rule">
          <IconButton size="small" onClick={() => insertMarkdown('hr')}>
            <HorizontalRuleIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Text Area */}
      <TextField
        inputRef={textFieldRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        label={label}
        placeholder={placeholder}
        multiline
        rows={rows}
        size={size}
        fullWidth={fullWidth}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '0 0 4px 4px',
            '& fieldset': {
              borderTop: 'none',
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
            },
          },
          '& .MuiInputBase-input': {
            fontFamily: '"Fira Code", "Consolas", monospace',
            fontSize: '0.875rem',
            minHeight: minHeight ? `${minHeight}px` : undefined,
          },
        }}
      />
    </Box>
  );
};
