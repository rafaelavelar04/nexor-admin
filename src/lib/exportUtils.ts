import JSZip from 'jszip';

// Helper function to convert an array of objects to a CSV string
const jsonToCsv = (data: any[]): string => {
  if (!data || data.length === 0) {
    return '';
  }

  const replacer = (key: string, value: any) => value === null ? '' : value;
  const header = Object.keys(data[0]);
  const csv = [
    header.join(','), // header row
    ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
  ].join('\r\n');

  return csv;
};

// Triggers the download of a single CSV file
export const exportToCsv = (filename: string, data: any[]) => {
  if (data.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }

  const csvString = jsonToCsv(data);
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Triggers the download of multiple data arrays as CSVs within a single ZIP file
export const exportToZip = async (filename: string, exportItems: { filename: string; data: any[] }[]) => {
  const zip = new JSZip();

  exportItems.forEach(item => {
    if (item.data && item.data.length > 0) {
      const csvString = jsonToCsv(item.data);
      zip.file(item.filename, csvString);
    }
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(zipBlob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};