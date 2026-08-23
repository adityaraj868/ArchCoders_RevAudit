import { apiRequest } from './client';
import type { UploadedFile } from './files';

export interface Presentation {
  id: string;
  title: string;
  version: string;
  date: string;
  authors: string[];
  changeSummary: string | null;
  published: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Only present on GET /presentations/:id — the list endpoint doesn't
  // include it, since the archive table never shows per-file detail.
  files?: UploadedFile[];
}

// Public — the backend itself filters to published-only for anonymous
// callers and admits drafts only if the request carries an admin token.
export async function listPresentations(): Promise<Presentation[]> {
  const data = await apiRequest<{ presentations: Presentation[] }>('/presentations');
  return data.presentations;
}

export async function getPresentation(id: string): Promise<Presentation> {
  const data = await apiRequest<{ presentation: Presentation }>(`/presentations/${id}`);
  return data.presentation;
}

export interface CreatePresentationInput {
  title: string;
  version: string;
  date: string;
  authors: string[];
  changeSummary?: string;
}

// Admin-only on the backend; always created unpublished (draft).
export async function createPresentation(input: CreatePresentationInput): Promise<Presentation> {
  const data = await apiRequest<{ presentation: Presentation }>('/presentations', {
    method: 'POST',
    body: input,
  });
  return data.presentation;
}

// Publishing is one-way — see the backend's version-history rules. Once
// this succeeds, the version can never be edited or deleted again.
export async function publishPresentation(id: string): Promise<Presentation> {
  const data = await apiRequest<{ presentation: Presentation }>(`/presentations/${id}`, {
    method: 'PUT',
    body: { published: true },
  });
  return data.presentation;
}
