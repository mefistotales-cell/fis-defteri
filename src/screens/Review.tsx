import { useEffect, useState } from 'react';
import { useStore } from '../store.tsx';
import { Editor } from './Editor.tsx';

export function NewReview() {
  const store = useStore();
  const item = store.queue[0];

  if (!item) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10 text-center">
        <p className="font-display text-3xl">Bekleyen belge yok</p>
        <a className="mt-4 inline-block font-semibold text-olive-2" href="#/">
          Deftere dön
        </a>
      </main>
    );
  }

  const step = store.progress.total > 1 ? `${store.progress.done + 1} / ${store.progress.total}` : undefined;
  const editable = (item.phase === 'ready' || item.phase === 'error') && item.fields;

  if (!editable) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <p className="text-sm font-semibold text-muted">{step}</p>
        {item.previewUrl ? <img src={item.previewUrl} alt="Okunan belge" className="mt-3 w-full rounded-3xl" /> : null}
        <p className="mt-4 text-center font-display text-3xl">{item.phase === 'error' ? 'Okunamadı' : 'Belge okunuyor'}</p>
        <p className="mt-2 text-center text-muted">{item.error ?? 'Bu işlem kendi API anahtarınızla telefonda yapılır.'}</p>
      </main>
    );
  }

  return (
    <Editor
      key={`${item.localId}-${item.phase}`}
      step={step}
      imageUrl={item.previewUrl}
      initialFields={item.fields!}
      banner={item.error}
      onSave={(next) => void store.saveCurrent(next)}
      onCancel={store.discardCurrent}
      onRetry={item.image ? store.retryCurrent : undefined}
    />
  );
}

export function SavedReview({ id }: { id: string }) {
  const store = useStore();
  const doc = store.docs.find((item) => item.id === id);
  const url = useObjectUrl(doc?.image ?? null);

  if (!store.ready) return <p className="px-4 py-8 text-center text-muted">Defter açılıyor…</p>;
  if (!doc) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10 text-center">
        <p className="font-display text-3xl">Belge bulunamadı</p>
        <a className="mt-4 inline-block font-semibold text-olive-2" href="#/">
          Deftere dön
        </a>
      </main>
    );
  }

  return (
    <Editor
      key={`${doc.id}-${doc.updatedAt}`}
      imageUrl={url}
      initialFields={doc.fields}
      onSave={(next) => void store.saveExisting(doc, next)}
      onCancel={() => {
        window.location.hash = '#/';
      }}
    />
  );
}

function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}
