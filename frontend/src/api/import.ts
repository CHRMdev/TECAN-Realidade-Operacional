import client from './client';

export interface ImportError {
  sheet: string;
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface ImportResult {
  success: true;
  created: {
    desembarques: number;
    retiras: number;
    producoes: number;
    volumetrias: number;
    contingentes: number;
  };
  errors: ImportError[];
  errorReportBase64?: string;
}

export async function downloadTemplate(): Promise<void> {
  const res = await client.get('/api/import/template', { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tecan-template.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

export async function uploadExcel(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await client.post('/api/import/excel', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export function downloadErrorReport(base64: string, filename = 'tecan-erros.xlsx'): void {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
