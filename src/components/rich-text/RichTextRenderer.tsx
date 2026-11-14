import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import { generateHTML } from '@tiptap/core';
import DOMPurify from 'dompurify';
import { WritingRichContent } from '../../netlify/types';
import { createRichTextExtensions } from './config';
import styles from './richText.module.css';

interface RichTextRendererProps {
  content: WritingRichContent;
  className?: string;
  downloadTextBlocks?: boolean;
  sx?: SxProps<Theme>;
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({
  content,
  className,
  downloadTextBlocks,
  sx,
}) => {
  const html = useMemo(
    () => DOMPurify.sanitize(generateHTML(content, createRichTextExtensions())),
    [content]
  );

  return (
    <Box
      className={[styles.rendered, className].filter(Boolean).join(' ')}
      sx={sx}
      data-download-text-blocks={downloadTextBlocks || undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default RichTextRenderer;
