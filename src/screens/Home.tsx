import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dialog } from '../components/ui.tsx';
import { deliver } from '../lib/download.ts';
import { currentMonth, documentMonth, formatMonthLabel, shiftMonth, toTrDate } from '../lib/dates.ts';
import { VIEW_MONTH_KEY } from '../lib/settings.ts';
import { completeFields, sinifKodu, sinifOzeti } from '../lib/classify.ts';
import { formatTr, fromKurus, toKurus } from '../lib/money.ts';
import type { ExportDoc, SavedDocument, SinifKodu } from '../lib/types.ts';
import { belgeLabel, ODEME_LABEL } from '../lib/types.ts';
import { validateDocument, worstLevel } from '../lib/validate.ts';
import { LUCA_FATURA_COLUMN_LIMIT } from '../lib/columns.ts';
import { useStore } from '../store.tsx';

export function Home() {
  const store = useStore();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [month, setMonth] = useState(() => sessionStorage.getItem(VIEW_MONTH_KEY) || currentMonth());
  const [exportOpen, setExportOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sessionStorage.setItem(VIEW_MONTH_KEY, month);
  }, [month]);

  const monthDocs = useMemo(
    () =>
      store.docs
        .filter((doc) => documentMonth(doc.fields.tarih, doc.createdAt) === month)
        .sort((a, b) => (a.fields.tarih < b.fields.tarih ? 1 : a.fields.tarih > b.fields.tarih ? -1 : 0)),
    [store.docs, month],
  );
  const toplam = monthDocs.reduce((sum, doc) => sum + (doc.fields.toplam ?? 0), 0);
  const sorun = monthDocs.filter((doc) => worstLevel(validateDocument(doc.fields)) !== 'ok').length;
  const otherMonth = store.docs
    .map((doc) => documentMonth(doc.fields.tarih, doc.createdAt))
    .filter((item) => item !== month)
    .sort()
    .at(-1);
  const tooManyColumns = store.settings.sutunlar.lucaFatura.filter((column) => column.enabled).length > LUCA_FATURA_COLUMN_LIMIT;

  async function runExport(kind: 'csv' | 'xlsx' | 'fis' | 'logo-alim' | 'logo-fis' | 'ozet') {
    setBusy(true);
    setMessage('');
    try {
      const payload = monthDocs.map(toExportDoc);
      const exporter = await import('../lib/exportFiles.ts');
      const files =
        kind === 'csv'
          ? (await exporter.exportLucaFatura(payload, store.settings, month)).filter((file) => file.filename.endsWith('.csv'))
          : kind === 'xlsx'
            ? (await exporter.exportLucaFatura(payload, store.settings, month)).filter((file) => file.filename.endsWith('.xlsx'))
            : kind === 'fis'
              ? await exporter.exportLucaFis(payload, store.settings, month)
              : kind === 'logo-alim'
                ? await exporter.exportLogoAlim(payload, store.settings, month)
                : kind === 'logo-fis'
                  ? await exporter.exportLogoFis(payload, store.settings, month)
                  : await exporter.exportOzet(payload, store.settings, month);
      const result = await deliver(files);
      const note = files.map((file) => file.note).filter(Boolean).join(' ');
      if (result === 'cancel') setMessage('Gönderim iptal edildi.');
      else setMessage(note || (result === 'shared' ? 'Dosya paylaşım sayfasına gitti.' : 'Dosya indirildi.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Dosya oluşmadı.');
    } finally {
      setBusy(false);
    }
  }

  function onPick(files: FileList | null, input: HTMLInputElement) {
    const list = files ? [...files] : [];
    input.value = '';
    void store.startFiles(list);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-4 pb-10">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button type="button" className="min-h-12 min-w-12 rounded-full text-2xl" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Önceki ay">
          ‹
        </button>
        <div className="text-center">
          <p className="font-display text-3xl">{formatMonthLabel(month)}</p>
          <p className="text-sm text-muted">
            {monthDocs.length} belge · {formatTr(toplam)} TL
            {sorun ? ` · ${sorun} kontrol` : ''}
          </p>
          <p className="text-xs text-muted">{classSummary(monthDocs)}</p>
        </div>
        <button type="button" className="min-h-12 min-w-12 rounded-full text-2xl" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Sonraki ay">
          ›
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => cameraRef.current?.click()}>Fiş çek</Button>
        <Button tone="clay" onClick={() => galleryRef.current?.click()}>
          Fotoğraf seç
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button tone="ghost" onClick={store.startManual}>
          Elle gir
        </Button>
        <Button tone="ghost" disabled={monthDocs.length === 0} onClick={() => setExportOpen(true)}>
          Excel’e aktar
        </Button>
      </div>
      <input ref={cameraRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => onPick(event.target.files, event.target)} />
      <input ref={galleryRef} className="sr-only" type="file" accept="image/*" multiple onChange={(event) => onPick(event.target.files, event.target)} />

      {store.preparing ? <p className="mt-4 text-center text-sm font-semibold">Fotoğraflar hazırlanıyor…</p> : null}
      {!store.ready ? <p className="mt-6 text-center text-muted">Defter açılıyor…</p> : null}

      {store.ready && monthDocs.length === 0 ? (
        <section className="mt-8 rounded-3xl border border-dashed border-line bg-card px-5 py-8 text-center">
          <p className="font-display text-3xl">Bu ay fiş yok</p>
          {otherMonth ? (
            <>
              <p className="mx-auto mt-2 max-w-sm text-muted">
                Kayıtlı belgeler {formatMonthLabel(otherMonth)} içinde. Bu ayın listesi boş görünür.
              </p>
              <Button type="button" className="mt-4" onClick={() => setMonth(otherMonth)}>
                {formatMonthLabel(otherMonth)} listesine git
              </Button>
            </>
          ) : (
            <p className="mx-auto mt-2 max-w-sm text-muted">
              Yazar kasa fişini veya faturayı düz bir yere koyun, gölge düşürmeden çekin. Birden fazla fotoğrafı birlikte seçebilirsiniz.
            </p>
          )}
          <button type="button" className="mt-4 block w-full text-sm font-semibold text-olive-2" onClick={() => void store.loadSamples()}>
            Örnek fiş ve faturayı yükle
          </button>
        </section>
      ) : (
        <ul className="mt-4 space-y-2">
          {monthDocs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onDelete={() => void store.removeDocument(doc.id)} />
          ))}
        </ul>
      )}

      <Dialog open={exportOpen} title={`${formatMonthLabel(month)} aktarımı`} onClose={() => setExportOpen(false)}>
        <p className="mb-3 text-sm text-muted">
          Luca’ya CSV’yi yükleyin. Excel dosyaları kontrol ve Logo içindir. Ayrıntı Aktarım sayfasında.
        </p>
        {tooManyColumns ? (
          <p className="mb-3 rounded-2xl bg-bad-bg px-3 py-2 text-sm text-bad">
            Luca fatura aktarımı en fazla {LUCA_FATURA_COLUMN_LIMIT} sütun alır. Ayarlardan fazlasını kapatın.
          </p>
        ) : null}
        <div className="space-y-2">
          <Button className="w-full" disabled={busy} onClick={() => void runExport('csv')}>
            Luca fatura CSV
          </Button>
          <Button tone="ghost" className="w-full" disabled={busy} onClick={() => void runExport('xlsx')}>
            Luca fatura Excel (kontrol)
          </Button>
          <Button tone="ghost" className="w-full" disabled={busy} onClick={() => void runExport('fis')}>
            Luca muhasebe fişi
          </Button>
          <Button tone="ghost" className="w-full" disabled={busy} onClick={() => void runExport('logo-alim')}>
            Logo alım faturası
          </Button>
          <Button tone="ghost" className="w-full" disabled={busy} onClick={() => void runExport('logo-fis')}>
            Logo muhasebe fişi
          </Button>
          <Button tone="clay" className="w-full" disabled={busy} onClick={() => void runExport('ozet')}>
            Muhasebeci özeti
          </Button>
        </div>
        {message ? <p className="mt-3 text-sm">{message}</p> : null}
        <a className="mt-3 inline-block text-sm font-semibold text-olive-2" href="#/yardim">
          Hangi menüye yüklenecek?
        </a>
      </Dialog>
    </main>
  );
}

function DocumentCard({ doc, onDelete }: { doc: SavedDocument; onDelete: () => void }) {
  const level = worstLevel(validateDocument(doc.fields));
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!doc.image) return;
    const next = URL.createObjectURL(doc.image);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [doc.image]);
  return (
    <li>
      <a href={`#/incele/${doc.id}`} className="flex gap-3 rounded-3xl bg-card p-3 shadow-sm">
        {url ? (
          <img src={url} alt="" className="h-20 w-16 rounded-xl object-cover" />
        ) : (
          <div className="flex h-20 w-16 items-center justify-center rounded-xl bg-sand text-xs">Yok</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate font-semibold">{doc.fields.saticiUnvan || 'Satıcı yok'}</p>
            <p className="shrink-0 font-semibold">{doc.fields.toplam == null ? '—' : `${formatTr(doc.fields.toplam)} TL`}</p>
          </div>
          <p className="text-sm text-muted">
            {toTrDate(doc.fields.tarih) || 'Tarih yok'} · {belgeLabel(doc.fields.belgeTuru)} · {sinifOzeti(doc.fields)} · {ODEME_LABEL[doc.fields.odemeSekli]}
          </p>
          {level !== 'ok' ? (
            <p className={level === 'hata' ? 'text-sm font-semibold text-bad' : 'text-sm font-semibold text-warn'}>
              {level === 'hata' ? 'Tutar veya zorunlu alan tutmuyor' : 'Kontrol notu var'}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="self-start rounded-full px-2 py-1 text-sm text-muted"
          onClick={(event) => {
            event.preventDefault();
            if (window.confirm('Bu belge silinsin mi?')) onDelete();
          }}
        >
          Sil
        </button>
      </a>
    </li>
  );
}

function classSummary(docs: SavedDocument[]): string {
  const totals: Record<SinifKodu, number> = { 'alis-mal': 0, 'alis-hizmet': 0, 'satis-mal': 0, 'satis-hizmet': 0 };
  let mustahsilNet = 0;
  for (const doc of docs) {
    const fields = completeFields(doc.fields);
    if (fields.belgeTuru === 'mustahsil') {
      mustahsilNet += toKurus(fields.netOdenen ?? fields.toplam ?? 0);
      continue;
    }
    for (const row of fields.kdvSatirlari) totals[sinifKodu(fields.yon, row.tur)] += toKurus(row.matrah) + toKurus(row.kdv);
  }
  const labels: Record<SinifKodu, string> = {
    'alis-mal': 'Alış mal',
    'alis-hizmet': 'Alış hizmet',
    'satis-mal': 'Satış mal',
    'satis-hizmet': 'Satış hizmet',
  };
  const parts = (Object.keys(labels) as SinifKodu[])
    .filter((key) => totals[key] !== 0)
    .map((key) => `${labels[key]} ${formatTr(fromKurus(totals[key]))} TL`);
  if (mustahsilNet !== 0) parts.push(`Müstahsil net ${formatTr(fromKurus(mustahsilNet))} TL`);
  return parts.join(' · ');
}

function toExportDoc(doc: SavedDocument): ExportDoc {
  return { id: doc.id, createdAt: doc.createdAt, fields: doc.fields };
}
