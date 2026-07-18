import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { WritingTopic } from '../../netlify/types';

interface TopicChipProps extends Omit<
  ChipProps,
  'color' | 'label' | 'variant'
> {
  topic: WritingTopic;
  selected?: boolean;
}

const TopicChip: React.FC<TopicChipProps> = ({
  topic,
  selected = false,
  sx,
  ...props
}) => (
  <Chip
    label={topic.name}
    variant="outlined"
    sx={[
      {
        borderColor: selected
          ? '#496a61'
          : topic.is_user_created
            ? '#d9c8df'
            : '#d9d1c7',
        bgcolor: selected
          ? '#496a61'
          : topic.is_user_created
            ? '#faf6fc'
            : '#fcfaf7',
        color: selected
          ? '#fff'
          : topic.is_user_created
            ? '#735b7c'
            : '#625a52',
        fontWeight: selected ? 700 : 500,
        '&:hover': props.onClick
          ? {
              bgcolor: selected
                ? '#3f5d55'
                : topic.is_user_created
                  ? '#f3eaf6'
                  : '#f3eee8',
              borderColor: selected
                ? '#3f5d55'
                : topic.is_user_created
                  ? '#cbb3d3'
                  : '#c9bdb0',
            }
          : undefined,
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...props}
  />
);

export default TopicChip;
