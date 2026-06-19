import { normalizeLogbook } from '@/data/normalize-logbook';
import type { LogbookDocument, MediaReference } from '@/types/logbook';

export const uploadCategories = [
  'catch-photos',
  'trip-photos',
  'lures',
  'flashers',
  'reels',
  'rods',
  'queue',
] as const;

export type UploadCategory = (typeof uploadCategories)[number];

function endpoint(serverUrl: string, path: string) {
  const baseUrl = serverUrl.trim().replace(/\/+$/, '');
  if (!baseUrl) {
    throw new Error('A server URL is required.');
  }
  return `${baseUrl}${path}`;
}

async function parseError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

export async function fetchLogbook(serverUrl: string): Promise<LogbookDocument> {
  const response = await fetch(endpoint(serverUrl, '/api/logbook'), {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return normalizeLogbook(await response.json());
}

export async function replaceLogbook(serverUrl: string, logbook: LogbookDocument) {
  const response = await fetch(endpoint(serverUrl, '/api/logbook'), {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(logbook),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export function exportUrl(serverUrl: string) {
  return endpoint(serverUrl, '/api/export');
}

export async function uploadMedia(
  serverUrl: string,
  category: UploadCategory,
  file: { uri: string; name: string; type: string },
  metadata: Record<string, unknown> = {},
): Promise<MediaReference> {
  const form = new FormData();
  form.append('file', file as unknown as Blob);
  form.append('metadata', JSON.stringify(metadata));

  const response = await fetch(endpoint(serverUrl, `/api/uploads/${category}`), {
    method: 'POST',
    body: form,
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as MediaReference;
}

export async function fetchPhotoQueue(serverUrl: string) {
  const response = await fetch(endpoint(serverUrl, '/api/photo-queue'));
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as { photos: MediaReference[] };
}

export async function claimQueuedPhoto(
  serverUrl: string,
  filename: string,
  targetCategory: Exclude<UploadCategory, 'queue'>,
): Promise<MediaReference> {
  const response = await fetch(endpoint(serverUrl, '/api/photo-queue/claim'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, targetCategory }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as MediaReference;
}
