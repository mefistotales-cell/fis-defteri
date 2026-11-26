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

export async function listDocuments(): Promise<SavedDocument[]> {
  return (await db()).getAll('belgeler');
}

export async function putDocument(document: SavedDocument): Promise<void> {
  await (await db()).put('belgeler', document);
}

export async function deleteDocument(id: string): Promise<void> {
  await (await db()).delete('belgeler', id);
}

export async function clearDocuments(): Promise<void> {
  await (await db()).clear('belgeler');
}
