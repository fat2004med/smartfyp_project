import { API_BASE_URL } from '../services/api.js';

/**
 * Helper utilities for viewing and downloading files cleanly and reliably
 */

export const isGoogleDriveUrl = (url = '') => {
  return typeof url === 'string' && (url.includes('drive.google.com') || url.includes('docs.google.com'));
};

export const isExternalUrl = (url = '') => {
  if (!url || typeof url !== 'string') return false;
  return (url.startsWith('http://') || url.startsWith('https://')) && !url.includes('/uploads/');
};

export const extractGoogleDriveId = (url = '') => {
  if (!url) return '';
  const match = String(url).match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  const idMatch = String(url).match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];
  return '';
};

export const extractRawFileName = (fileUrl = '') => {
  if (!fileUrl) return '';
  let str = String(fileUrl).trim();
  
  if (isGoogleDriveUrl(str)) {
    return 'Google_Drive_Document';
  }

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
  if (isGoogleDriveUrl(fileUrl)) return 'Google Drive Document';
  const raw = extractRawFileName(fileUrl) || String(fileUrl).split('/').pop() || 'Document';
  return raw.replace(/^\d+-/, '') || 'Document';
};

export const getFileExtension = (fileUrl = '') => {
  if (!fileUrl) return '';
  if (isGoogleDriveUrl(fileUrl)) return '.gdoc';
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
  if (isGoogleDriveUrl(fileUrl)) {
    const driveId = extractGoogleDriveId(fileUrl);
    if (driveId) return `https://drive.google.com/file/d/${driveId}/preview`;
    return fileUrl;
  }
  if (isExternalUrl(fileUrl)) {
    return fileUrl;
  }
  const rawName = extractRawFileName(fileUrl) || fileUrl;
  const base = API_BASE_URL || '';
  return `${base}/api/files/view?file=${encodeURIComponent(rawName)}`;
};

export const getFileDownloadUrl = (fileUrl = '') => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('data:') || fileUrl.startsWith('blob:')) {
    return fileUrl;
  }
  if (isGoogleDriveUrl(fileUrl)) {
    const driveId = extractGoogleDriveId(fileUrl);
    if (driveId) return `https://drive.google.com/uc?export=download&id=${driveId}`;
    return fileUrl;
  }
  if (isExternalUrl(fileUrl)) {
    return fileUrl;
  }
  const rawName = extractRawFileName(fileUrl) || fileUrl;
  const base = API_BASE_URL || '';
  return `${base}/api/files/download?file=${encodeURIComponent(rawName)}`;
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

  // If external Google Drive URL or direct HTTP link
  if (isGoogleDriveUrl(fileUrl) || isExternalUrl(fileUrl)) {
    const directUrl = getFileDownloadUrl(fileUrl);
    window.open(directUrl, '_blank', 'noopener,noreferrer');
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

    const contentType = response.headers.get('content-type') || '';
    // If response was an html page (SPA fallback error), fallback to direct link
    if (contentType.includes('text/html') && !cleanName.endsWith('.html')) {
      window.open(downloadUrl, '_blank');
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
    }, 4000);
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

