import { apiRequest } from './client';

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
