// src/components/calculator/ExportDialog.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import DownloadIcon from '@mui/icons-material/Download';

const ExportDialog = ({ open, onClose, onExport, selectedCount, program }) => {
  const [selectedFormat, setSelectedFormat] = useState(null);

  const formats = [
    {
      id: 'excel',
      name: 'Excel (XLSX)',
      description: 'Формат с несколькими листами, формулами и форматированием',
      icon: <TableChartIcon color="success" />
    },
    {
      id: 'csv',
      name: 'CSV',
      description: 'Простой текстовый формат, совместимый со многими программами',
      icon: <DescriptionIcon color="primary" />
    }
  ];

  const handleExport = () => {
    if (selectedFormat && onExport) {
      onExport(selectedFormat);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Экспорт данных
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Выбрано абитуриентов: <strong>{selectedCount}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Программа: {program.name} ({program.code})
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Выберите формат экспорта:
          </Typography>
          
          <List>
            {formats.map((format) => (
              <ListItem
                key={format.id}
                button
                selected={selectedFormat === format.id}
                onClick={() => setSelectedFormat(format.id)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  border: selectedFormat === format.id ? '2px solid' : '1px solid',
                  borderColor: selectedFormat === format.id ? 'primary.main' : 'divider',
                  backgroundColor: selectedFormat === format.id ? 'action.selected' : 'background.paper'
                }}
              >
                <ListItemIcon>
                  {format.icon}
                </ListItemIcon>
                <ListItemText
                  primary={format.name}
                  secondary={format.description}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Отмена
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={!selectedFormat}
        >
          Экспортировать
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;