"use client";
import React, { useEffect, useState } from 'react';
import {
  Container, TextField, Button, Typography, Box, MenuItem, IconButton, Collapse, Accordion,
  AccordionSummary, AccordionDetails, Stepper, Step, StepLabel, InputAdornment, Snackbar,
  Alert, Chip
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AddCircle, RemoveCircle, ExpandMore, Folder } from '@mui/icons-material';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { Autocomplete } from '@mui/material';
import dayjs from 'dayjs';
import { invoke } from "@tauri-apps/api/core";

export default function ImportForm() {
  const [formVisible, setFormVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'warning' });

  const [targetFolder, setTargetFolder] = useState('');
  const [namePatterns, setNamePatterns] = useState(['sensor']);
  const defaultNamePatternOptions = ['sensor', 'temp', 'vibration', 'pressure'];
  const [encoding] = useState('utf-8');
  const [dbPath] = useState('sensor_data.duckdb');
  const [plantCode, setPlantCode] = useState('');
  const defaultPlantCodes = ['F1', 'F2', 'F3'];
  const [plantCodeOptions, setPlantCodeOptions] = useState(['F1', 'F2', 'F3']);
  const [machineCode, setMachineCode] = useState('');
  const [labelTitle, setLabelTitle] = useState('');
  const [labelDescription, setLabelDescription] = useState('');
  const [events, setEvents] = useState([
    { event: '', description: '', start_time: dayjs(), end_time: dayjs(), expanded: true }
  ]);

  const savePlantCodeHistory = (newCode) => {
    const history = JSON.parse(localStorage.getItem('plantCodeHistory') || '[]');
    if (!history.includes(newCode)) {
      const updated = [...history, newCode].slice(-10);
      localStorage.setItem('plantCodeHistory', JSON.stringify(updated));
      setPlantCodeOptions(updated);
    }
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('plantCodeHistory') || '[]');
    if (saved.length) setPlantCodeOptions([...new Set([...saved, ...plantCodeOptions])]);
  }, []);

  const steps = ['基本設定', 'イベント情報', 'その他設定'];

  const handleSelectFolder = async () => {
    try {
      const selected = await openDialog({ directory: true });
      if (selected) setTargetFolder(selected);
    } catch (err) {
      setSnackbar({ open: true, message: 'フォルダ選択に失敗しました。', severity: 'error' });
    }
  };

  const handleAddEvent = () => {
    setEvents([...events, { event: '', description: '', start_time: dayjs(), end_time: dayjs(), expanded: true }]);
  };

  const handleRemoveEvent = (index) => {
    const newEvents = [...events];
    newEvents.splice(index, 1);
    setEvents(newEvents);
  };

  const handleEventChange = (index, key, value) => {
    const newEvents = [...events];
    newEvents[index][key] = value;
    setEvents(newEvents);
  };

  const toggleEventExpanded = (index) => {
    const newEvents = [...events];
    newEvents[index].expanded = !newEvents[index].expanded;
    setEvents(newEvents);
  };

  const handleSubmit = async() => {
    if (!targetFolder || !plantCode || !machineCode || !labelTitle) {
      setSnackbar({ open: true, message: '基本設定の必須項目をすべて入力してください。', severity: 'warning' });
      setActiveStep(0);
      return;
    }

    const invalidEvent = events.find(e => !e.event || !e.start_time || !e.end_time);
    if (invalidEvent) {
      setSnackbar({ open: true, message: 'すべてのイベントにイベント名、開始時刻、終了時刻を設定してください。', severity: 'warning' });
      setActiveStep(1);
      return;
    }

    savePlantCodeHistory(plantCode); 


    const payload = {
      target_folder: targetFolder,
      name_patterns: namePatterns,
      encoding,
      db_path: dbPath,
      label: {
        plant_code: plantCode,
        machine_code: machineCode,
        title: labelTitle,
        description: labelDescription,
      },
      events: events.map(({ expanded, ...e }) => ({
        ...e,
        start_time: e.start_time.toISOString(),
        end_time: e.end_time.toISOString()
      }))
    };
    console.log(payload);
    
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="md">
        <Typography variant="h5" gutterBottom>センサーデータ インポート</Typography>
        <Button variant="outlined" onClick={() => setFormVisible(!formVisible)}>
          {formVisible ? 'フォームを閉じる' : 'インポートフォームを開く'}
        </Button>

        <Collapse in={formVisible}>
          <Box mt={2}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label, i) => (
                <Step key={i}><StepLabel>{label}</StepLabel></Step>
              ))}
            </Stepper>

            <Box mt={2} display="flex" justifyContent="space-between">
              <Button disabled={activeStep === 0} onClick={() => setActiveStep(prev => prev - 1)}>戻る</Button>
              {activeStep < steps.length - 1 ? (
                <Button onClick={() => setActiveStep(prev => prev + 1)}>次へ</Button>
              ) : (
                <Button variant="contained" onClick={handleSubmit}>インポート実行</Button>
              )}
            </Box>

            {activeStep === 0 && (
              <Box mt={3} display="grid" gap={2}>
                <TextField
                  label="センサーフォルダパス *"
                  fullWidth
                  required
                  value={targetFolder}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Folder /></InputAdornment>,
                    readOnly: true
                  }}
                  onClick={handleSelectFolder}
                />
                <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                <Autocomplete
                  freeSolo
                  options={plantCodeOptions}
                  value={plantCode}
                  onInputChange={(e, newVal) => setPlantCode(newVal)}
                  renderInput={(params) => (
                    <TextField {...params} label="工場コード *" required />
                  )}
                    />
                  
            
                  <TextField label="機械番号 *" fullWidth required value={machineCode} onChange={e => setMachineCode(e.target.value)} />
                  <TextField label="ラベル *" fullWidth required value={labelTitle} onChange={e => setLabelTitle(e.target.value)} />
                  <TextField label="ラベル詳細" fullWidth multiline rows={2} value={labelDescription} onChange={e => setLabelDescription(e.target.value)} />
                </Box>
              </Box>
            )}

            {activeStep === 1 && (
              <Box mt={2}>
                {events.map((e, index) => (
                  <Accordion key={index} expanded={e.expanded} onChange={() => toggleEventExpanded(index)}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1">
                        {e.event || `イベント ${index + 1}`} — {e.start_time.format('YYYY/MM/DD HH:mm')}〜{e.end_time.format('YYYY/MM/DD HH:mm')}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                        <TextField label="イベント名 *" fullWidth required value={e.event} onChange={ev => handleEventChange(index, 'event', ev.target.value)} />
                        <TextField label="イベント説明" fullWidth value={e.description} onChange={ev => handleEventChange(index, 'description', ev.target.value)} />
                        <DateTimePicker label="開始時刻 *" value={e.start_time} onChange={val => handleEventChange(index, 'start_time', val)} />
                        <DateTimePicker label="終了時刻 *" value={e.end_time} onChange={val => handleEventChange(index, 'end_time', val)} />
                      </Box>
                      <Box mt={1}>
                        <IconButton onClick={() => handleRemoveEvent(index)} color="error">
                          <RemoveCircle /> イベント削除
                        </IconButton>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
                <Box mt={2}>
                  <Button startIcon={<AddCircle />} onClick={handleAddEvent} variant="outlined">
                    イベント追加
                  </Button>
                </Box>
              </Box>
            )}

            {activeStep === 2 && (
              <Box mt={3} display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={defaultNamePatternOptions}
                  value={namePatterns}
                  onChange={(e, newValue) => setNamePatterns(newValue)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...rest } = getTagProps({ index });
                      return(
                          <Chip 
                              key={key} 
                              variant="outlined" 
                              label={option} 
                              {...rest} />
                    )}
                  )
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="name_patterns（複数選択可）"
                      placeholder="追加/選択..."
                    />
                  )}
                />
                <TextField label="エンコーディング" fullWidth value={encoding} disabled />
                <TextField label="DB出力パス" fullWidth value={dbPath} disabled />
              </Box>
            )}
          </Box>
        </Collapse>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
}
