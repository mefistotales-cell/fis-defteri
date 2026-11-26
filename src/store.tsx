import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { clearDocuments, deleteDocument, listDocuments, putDocument } from './lib/db.ts';
import { prepareImage } from './lib/image.ts';
import { SAMPLES } from './lib/samples.ts';
import { loadSettings, saveSettings } from './lib/settings.ts';
import type { AppSettings, DocumentFields, SavedDocument } from './lib/types.ts';
import { emptyFields } from './lib/types.ts';
import { extractFromImage } from './lib/vision.ts';

export interface QueueItem {
  localId: string;
  name: string;
  image: Blob | null;
  previewUrl: string | null;
  fields: DocumentFields | null;
  phase: 'queued' | 'reading' | 'ready' | 'error';
  error?: string;
}

interface StoreValue {
  ready: boolean;
  settings: AppSettings;
  updateSettings: (settings: AppSettings) => void;
  docs: SavedDocument[];
  reload: () => Promise<void>;
  queue: QueueItem[];
  preparing: boolean;
  progress: { done: number; total: number };
  startFiles: (files: File[]) => Promise<void>;
  startManual: () => void;
  saveCurrent: (fields: DocumentFields) => Promise<void>;
  discardCurrent: () => void;
  retryCurrent: () => void;
  saveExisting: (document: SavedDocument, fields: DocumentFields) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  removeAll: () => Promise<void>;
  loadSamples: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [docs, setDocs] = useState<SavedDocument[]>([]);
  const [ready, setReady] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const started = useRef<string | null>(null);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const reload = useCallback(async () => {
    setDocs(await listDocuments());
  }, []);

  useEffect(() => {
    void reload().finally(() => setReady(true));
  }, [reload]);

  useEffect(() => {
    const current = queue[0];
    if (!current || current.phase !== 'queued') return;
    if (started.current === current.localId) return;
    started.current = current.localId;
    const localId = current.localId;
    const image = current.image;
    setQueue((items) => items.map((item) => (item.localId === localId ? { ...item, phase: 'reading' } : item)));
    void (async () => {
      const active = settingsRef.current;
      try {
        if (!image) {
          setQueue((items) =>
            items.map((item) => (item.localId === localId ? { ...item, phase: 'ready', fields: emptyFields() } : item)),
          );
          return;
        }
        if (!active.apiKey.trim()) {
          setQueue((items) =>
            items.map((item) =>
              item.localId === localId
                ? { ...item, phase: 'error', fields: emptyFields(), error: 'API anahtarı yok. Alanları elle doldurup kaydedin.' }
                : item,
            ),
          );
          return;
        }
        const fields = await extractFromImage(active, image);
        setQueue((items) => items.map((item) => (item.localId === localId ? { ...item, phase: 'ready', fields } : item)));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Belge okunamadı.';
        setQueue((items) =>
          items.map((item) => (item.localId === localId ? { ...item, phase: 'error', fields: emptyFields(), error: message } : item)),
        );
      }
    })();
  }, [queue]);

  const updateSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const startFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      if (queue.length > 0 && !window.confirm('Henüz kaydedilmemiş belgeler silinsin mi?')) return;
      setPreparing(true);
      const items: QueueItem[] = [];
      for (const file of files) {
        try {
          const image = await prepareImage(file);
          items.push({
            localId: crypto.randomUUID(),
            name: file.name || 'fotoğraf',
            image,
            previewUrl: URL.createObjectURL(image),
            fields: null,
            phase: 'queued',
          });
        } catch (error) {
          items.push({
            localId: crypto.randomUUID(),
            name: file.name || 'fotoğraf',
            image: null,
            previewUrl: null,
            fields: emptyFields(),
            phase: 'error',
            error: error instanceof Error ? error.message : 'Fotoğraf açılamadı.',
          });
        }
      }
      for (const item of queue) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
      started.current = null;
      setQueue(items);
      setProgress({ done: 0, total: items.length });
      setPreparing(false);
      window.location.hash = '#/yeni';
    },
    [queue],
  );

  const startManual = useCallback(() => {
    if (queue.length > 0 && !window.confirm('Henüz kaydedilmemiş belgeler silinsin mi?')) return;
    for (const item of queue) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
    started.current = null;
    setQueue([
      {
        localId: crypto.randomUUID(),
        name: 'Elle giriş',
        image: null,
        previewUrl: null,
        fields: emptyFields(),
        phase: 'ready',
      },
    ]);
    setProgress({ done: 0, total: 1 });
    window.location.hash = '#/yeni';
  }, [queue]);

  const saveCurrent = useCallback(
    async (fields: DocumentFields) => {
      const item = queue[0];
      if (!item) return;
      const now = new Date().toISOString();
      await putDocument({ id: crypto.randomUUID(), createdAt: now, updatedAt: now, image: item.image, fields });
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      const remaining = queue.length - 1;
      setQueue((items) => items.slice(1));
      setProgress((state) => ({ ...state, done: state.done + 1 }));
      await reload();
      if (remaining <= 0) window.location.hash = '#/';
    },
    [queue, reload],
  );

  const discardCurrent = useCallback(() => {
    const item = queue[0];
    if (!item) return;
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    const remaining = queue.length - 1;
    setQueue((items) => items.slice(1));
    setProgress((state) => ({ ...state, done: state.done + 1 }));
    if (remaining <= 0) window.location.hash = '#/';
  }, [queue]);

  const retryCurrent = useCallback(() => {
    const item = queue[0];
    if (!item) return;
    if (started.current === item.localId) started.current = null;
    setQueue((items) =>
      items.map((entry) => (entry.localId === item.localId ? { ...entry, phase: 'queued', error: undefined } : entry)),
    );
  }, [queue]);

  const saveExisting = useCallback(
    async (document: SavedDocument, fields: DocumentFields) => {
      await putDocument({ ...document, fields, updatedAt: new Date().toISOString() });
      await reload();
      window.location.hash = '#/';
    },
    [reload],
  );

  const removeDocument = useCallback(
    async (id: string) => {
      await deleteDocument(id);
      await reload();
    },
    [reload],
  );

  const removeAll = useCallback(async () => {
    await clearDocuments();
    await reload();
  }, [reload]);

  const loadSamples = useCallback(async () => {
    for (const sample of SAMPLES) {
      const response = await fetch(sample.image);
      if (!response.ok) throw new Error('Örnek görsel yüklenemedi.');
      const image = await response.blob();
      await putDocument({
        id: sample.id,
        createdAt: sample.createdAt,
        updatedAt: new Date().toISOString(),
        image,
        fields: structuredClone(sample.fields),
      });
    }
    await reload();
  }, [reload]);

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      settings,
      updateSettings,
      docs,
      reload,
      queue,
      preparing,
      progress,
      startFiles,
      startManual,
      saveCurrent,
      discardCurrent,
      retryCurrent,
      saveExisting,
      removeDocument,
      removeAll,
      loadSamples,
    }),
    [
      ready,
      settings,
      updateSettings,
      docs,
      reload,
      queue,
      preparing,
      progress,
      startFiles,
      startManual,
      saveCurrent,
      discardCurrent,
      retryCurrent,
      saveExisting,
      removeDocument,
      removeAll,
      loadSamples,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('Store yok');
  return value;
}
