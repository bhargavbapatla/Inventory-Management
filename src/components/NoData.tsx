import React from 'react';
import { Box, Typography } from '@mui/material';
import { Inbox as InboxIcon } from '@mui/icons-material';

interface NoDataProps {
  /**
   * Main message to display
   * @default "No data available"
   */
  message?: string;
  /**
   * Optional description or secondary text
   */
  description?: string;
  /**
   * Optional custom icon. Defaults to InboxIcon
   */
  icon?: React.ReactNode;
  /**
   * Height of the container
   * @default "100%"
   */
  height?: string | number;
}

const NoData: React.FC<NoDataProps> = ({
  message = 'No data available',
  description,
  icon,
  height = '100%',
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: height,
        p: 3,
        textAlign: 'center',
        color: 'text.secondary',
        minHeight: 200,
      }}
    >
      <Box sx={{ mb: 2, opacity: 0.5 }}>
        {icon || <InboxIcon sx={{ fontSize: 64 }} />}
      </Box>
      <Typography variant="h6" gutterBottom>
        {message}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
    </Box>
  );
};

export default NoData;
