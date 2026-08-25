/**
 * Helper utilities for viewing and downloading files cleanly and reliably
 */

export const extractRawFileName = (fileUrl = '') => {
  if (!fileUrl) return '';
  let str = String(fileUrl).trim();
  
  // If it's a full URL or query URL like /api/files/download?file=filename.docx
  if (str.includes('file=')) {
    const match = str.match(/[?&]file=([^&]+)/);
    if (match && match[1]) {
      str = decodeURIComponent(match[1]);
    }
  } else if (str.includes('path=')) {
    const match = str.match(/[?&]path=([^&]+)/);
    if (match && match[1]) {
      str = decodeURIComponent(match[1]);
    }
  }
  
  // Strip protocol and hostname if present
  str = str.replace(/^https?:\/\/[^\/]+/i, '');
  // Strip /uploads/ or uploads/
  str = str.replace(/^\/?uploads\//i, '');
  // Strip /api/files/view? or /api/files/download?
  str = str.replace(/^\/?api\/files\/(view|download)(\?.*)?/i, '');

  try {
    str = decodeURIComponent(str);
  } catch (e) {
    // Keep as is
  }
  return str.split('/').pop() || '';
};

export const getCleanFileName = (fileUrl = '') => {
  if (!fileUrl) return 'Document';
  const raw = extractRawFileName(fileUrl) || String(fileUrl).split('/').pop() || 'Document';
  return raw.replace(/^\d+-/, '') || 'Document';
};

export const getFileExtension = (fileUrl = '') => {
  if (!fileUrl) return '';
  const clean = extractRawFileName(fileUrl) || fileUrl.split('?')[0].split('#')[0];
  const parts = clean.split('.');
  return parts.length > 1 ? `.${parts.pop().toLowerCase()}` : '';
};

export const isPdf = (fileUrl = '') => {
  return getFileExtension(fileUrl) === '.pdf';
};

export const isImage = (fileUrl = '') => {
  const ext = getFileExtension(fileUrl);
  return ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext);
};

export const isOfficeDoc = (fileUrl = '') => {
  const ext = getFileExtension(fileUrl);
  return ['.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls', '.csv'].includes(ext);
};

export const getFileViewUrl = (fileUrl = '') => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('data:') || fileUrl.startsWith('blob:')) {
    return fileUrl;
  }
  const rawName = extractRawFileName(fileUrl) || fileUrl;
  return `/api/files/view?file=${encodeURIComponent(rawName)}`;
};

export const getFileDownloadUrl = (fileUrl = '') => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('data:') || fileUrl.startsWith('blob:')) {
    return fileUrl;
  }
  const rawName = extractRawFileName(fileUrl) || fileUrl;
  return `/api/files/download?file=${encodeURIComponent(rawName)}`;
};

export const triggerDirectDownload = async (fileUrl, customName = '') => {
  if (!fileUrl) return;
  const cleanName = customName || getCleanFileName(fileUrl);

  // If it's a data URL or blob URL
  if (fileUrl.startsWith('data:') || fileUrl.startsWith('blob:')) {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = cleanName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  const downloadUrl = getFileDownloadUrl(fileUrl);

  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      // Fallback directly to window opening
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', cleanName);
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = cleanName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 1500);
  } catch (err) {
    console.error('Trigger direct download error:', err);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', cleanName);
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

