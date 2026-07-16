import React from 'react';
import { Box } from '@mui/material';
import { tokenizeHashtags } from '../../utils/hashtags';

interface HighlightedTextProps {
  text: string;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text }) => (
  <>
    {tokenizeHashtags(text).map((token, index) =>
      token.isHashtag ? (
        <Box
          component="span"
          key={`${token.text}-${index}`}
          sx={{
            color: 'primary.main',
            bgcolor: 'rgba(25, 118, 210, 0.1)',
            borderRadius: 1,
            px: 0.35,
            fontWeight: 700,
          }}
        >
          {token.text.slice(1)}
        </Box>
      ) : (
        <React.Fragment key={`text-${index}`}>{token.text}</React.Fragment>
      )
    )}
  </>
);

export default HighlightedText;
