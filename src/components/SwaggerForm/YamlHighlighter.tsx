import React from 'react';
import { Highlight, themes } from 'prism-react-renderer';

interface YamlHighlighterProps {
  code: string;
  fontSize: number;
}

export const YamlHighlighter: React.FC<YamlHighlighterProps> = ({ code, fontSize }) => {
  return (
    <Highlight theme={themes.nightOwl} code={code} language="yaml">
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={className}
          style={{
            ...style,
            margin: 0,
            padding: '16px',
            fontSize: `${fontSize}px`,
            fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
            lineHeight: 1.5,
            overflow: 'auto',
            background: 'transparent',
          }}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              <span
                style={{
                  display: 'inline-block',
                  width: '3em',
                  userSelect: 'none',
                  opacity: 0.4,
                  textAlign: 'right',
                  marginRight: '1em',
                  fontSize: `${fontSize - 2}px`,
                }}
              >
                {i + 1}
              </span>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
};
