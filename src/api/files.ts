import { apiRequest, API_ORIGIN } from './client';

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  storagePath: string;
  size: number;
  type: string;
  presentationId: string;
  uploadedBy: string;
}

// Multiple files in one call is how a "folder" upload works — the browser
// expands a directory picker into individual File objects client-side, and
// they all attach to the same presentation.
export async function uploadFiles(presentationId: string, files: File[]): Promise<UploadedFile[]> {
  const formData = new FormData();
  formData.append('presentationId', presentationId);
  files.forEach((file) => formData.append('files', file));

  const data = await apiRequest<{ files: UploadedFile[] }>('/files/upload', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
  return data.files;
}

// Resolved on demand, never cached — the backend mints a fresh signed URL
// per call (S3 URLs expire), so a URL fetched once shouldn't be reused
// indefinitely.
export async function getFileUrl(fileId: string): Promise<string> {
  const data = await apiRequest<{ url: string }>(`/files/${fileId}/url`);
  // The S3 driver already returns a fully-qualified URL; the local driver
  // returns a path relative to the API server, which must resolve against
  // the API's origin, not whatever origin the frontend happens to be on.
  return /^https?:\/\//.test(data.url) ? data.url : `${API_ORIGIN}${data.url}`;
}
