import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { SavedDocument } from './types.ts';

interface FisDb extends DBSchema {
  belgeler: {
    key: string;
    value: SavedDocument;
  };
}

let database: Promise<IDBPDatabase<FisDb>> | null = null;

function db(): Promise<IDBPDatabase<FisDb>> {
  database ??= openDB<FisDb>('fis-defteri', 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('belgeler')) {
        database.createObjectStore('belgeler', { keyPath: 'id' });
      }
    },
  });
  return database;
}

async function withDb<T>(run: (database: IDBPDatabase<FisDb>) => Promise<T>): Promise<T> {
  try {
    return await run(await db());
  } catch (error) {
    database = null;
    throw error;
  }
}

export async function listDocuments(): Promise<SavedDocument[]> {
  return withDb((store) => store.getAll('belgeler'));
}

export async function putDocument(document: SavedDocument): Promise<void> {
  await withDb((store) => store.put('belgeler', document));
}

export async function deleteDocument(id: string): Promise<void> {
  await withDb((store) => store.delete('belgeler', id));
}

export async function clearDocuments(): Promise<void> {
  await withDb((store) => store.clear('belgeler'));
}

export function saveErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : error instanceof Error ? error.name : '';
  if (name === 'QuotaExceededError') {
    return 'Kayıt sığmadı. Eski fişleri silin veya tarayıcı deposuna izin verin.';
  }
  return 'Kayıt bu tarayıcıda saklanamadı. Gizli sekmeyi kapatıp site verisine izin verin, sonra yeniden deneyin.';
}
