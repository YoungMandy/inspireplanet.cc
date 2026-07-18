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
            color: '#a34f3b',
            fontWeight: 650,
          }}
        >
          {token.text}
        </Box>
      ) : (
        <React.Fragment key={`text-${index}`}>{token.text}</React.Fragment>
      )
    )}
  </>
);

export default HighlightedText;
