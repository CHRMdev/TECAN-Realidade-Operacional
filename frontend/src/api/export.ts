import client from './client';

export async function downloadExcel(from: string, to: string): Promise<void> {
  const res = await client.get('/api/export/excel', {
    params: { from, to },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-${from}-${to}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadPdf(from: string, to: string): Promise<void> {
  const res = await client.get('/api/export/pdf', {
    params: { from, to },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-${from}-${to}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
