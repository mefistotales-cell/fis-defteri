import { useState } from 'react';
import { Button, Field, TextInput } from '../components/ui.tsx';
import { DEFAULT_COLUMNS, LUCA_FATURA_COLUMN_LIMIT } from '../lib/columns.ts';
import { cloneColumns } from '../lib/columns.ts';
import { PROVIDERS } from '../lib/settings.ts';
import type { AccountSettings, AppSettings, ColumnSpec, ProviderId } from '../lib/types.ts';
import { testApiKey } from '../lib/vision.ts';
import { useStore } from '../store.tsx';

const ACCOUNT_ROWS: { key: keyof Omit<AccountSettings, 'kdv'>; label: string; hint: string }[] = [
  { key: 'gider', label: 'Gider / mal hesabı', hint: 'Tarımda çoğu alış 770, üretim 740, ticari mal 153. Müşavir söyler.' },
  { key: 'karsiHesap', label: 'Luca karşı hesap', hint: 'Fatura listesindeki matrah hesabı. Varsayılan gider hesabıyla aynıdır.' },
  { key: 'kasa', label: 'Kasa (nakit)', hint: 'ÖKC fişinde nakit yazıyorsa alacak bu hesaba gider.' },
  { key: 'kart', label: 'POS / kart', hint: 'Birçok büro 108 kullanır. Sizde 102 ise onu yazın.' },
  { key: 'havale', label: 'Banka (havale)', hint: 'Havale veya EFT ile ödenen belgeler.' },
  { key: 'saticilar', label: 'Satıcılar', hint: 'Açık hesap ve ödemesi belirsiz belgeler.' },
];

const KDV_ROWS: { key: string; label: string }[] = [
  { key: '1', label: 'İndirilecek KDV %1' },
  { key: '10', label: 'İndirilecek KDV %10' },
  { key: '20', label: 'İndirilecek KDV %20' },
  { key: '8', label: 'İndirilecek KDV %8' },
  { key: '18', label: 'İndirilecek KDV %18' },
  { key: 'diger', label: 'Diğer KDV' },
];

const GROUPS: { key: keyof AppSettings['sutunlar']; title: string; note: string }[] = [
  { key: 'lucaFatura', title: 'Luca fatura listesi', note: 'En fazla 15 sütun. Başlığı Luca’daki şablonunuzla aynı yapın.' },
  { key: 'lucaFis', title: 'Luca muhasebe fişi', note: 'Zorunlu: Fiş No, Fiş Tarihi, Hesap Kodu, Borç, Alacak. Diğerlerini kapatabilirsiniz.' },
  { key: 'logoAlim', title: 'Logo alım faturası', note: 'ExcelTrans’ta seçtiğiniz alan sırasına göre başlıkları değiştirin.' },
  { key: 'logoFis', title: 'Logo muhasebe fişi', note: 'Fiş satırına yapıştırırken sütun sırası Logo ekranıyla aynı olmalı.' },
  { key: 'ozet', title: 'Muhasebeci özeti', note: 'Programa yüklenmez. İstediğiniz sütunu kapatabilirsiniz.' },
];

export function Settings() {
  const store = useStore();
  const settings = store.settings;
  const [showKey, setShowKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState('');
  const [checking, setChecking] = useState(false);

  function patch(partial: Partial<AppSettings>) {
    store.updateSettings({ ...settings, ...partial });
  }

  function chooseProvider(provider: ProviderId) {
    const known = Object.values(PROVIDERS).some((item) => item.model === settings.model);
    patch({
      provider,
      model: known || !settings.model.trim() ? PROVIDERS[provider].model : settings.model,
      baseUrl: PROVIDERS[provider].baseUrl,
    });
  }

  async function checkKey() {
    setChecking(true);
    setKeyMessage('');
    try {
      await testApiKey(settings);
      setKeyMessage('Anahtar çalışıyor.');
    } catch (error) {
      setKeyMessage(error instanceof Error ? error.message : 'Denenemedi.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-4 pb-16">
      <section className="rounded-3xl bg-card p-4">
        <h2 className="font-display text-3xl">Okuma anahtarı</h2>
        <p className="mt-1 text-sm text-muted">
          Anahtar yalnız bu tarayıcıda durur. Fotoğraf, seçtiğiniz servise doğrudan gider; arada bizim sunucumuz yoktur. Harcama limiti koymayı unutmayın.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(Object.keys(PROVIDERS) as ProviderId[]).map((provider) => (
            <button
              key={provider}
              type="button"
              className={
                settings.provider === provider
                  ? 'min-h-12 rounded-2xl bg-olive px-3 font-semibold text-paper'
                  : 'min-h-12 rounded-2xl bg-sand px-3 font-semibold'
              }
              onClick={() => chooseProvider(provider)}
            >
              {PROVIDERS[provider].label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">{PROVIDERS[settings.provider].hint}</p>
        <div className="mt-3 space-y-3">
          <Field label="API anahtarı">
            <TextInput
              type={showKey ? 'text' : 'password'}
              autoComplete="off"
              value={settings.apiKey}
              onChange={(event) => patch({ apiKey: event.target.value })}
            />
          </Field>
          <button type="button" className="text-sm font-semibold text-olive-2" onClick={() => setShowKey((value) => !value)}>
            {showKey ? 'Anahtarı gizle' : 'Anahtarı göster'}
          </button>
          <Field label="Model">
            <TextInput value={settings.model} onChange={(event) => patch({ model: event.target.value })} />
          </Field>
          {settings.provider !== 'gemini' ? (
            <Field label="API adresi">
              <TextInput value={settings.baseUrl} onChange={(event) => patch({ baseUrl: event.target.value })} placeholder="https://.../v1" />
            </Field>
          ) : null}
          <Button type="button" tone="ghost" disabled={checking} onClick={() => void checkKey()}>
            {checking ? 'Deneniyor…' : 'Anahtarı dene'}
          </Button>
          {keyMessage ? <p className="text-sm">{keyMessage}</p> : null}
        </div>
      </section>

      <section className="rounded-3xl bg-card p-4">
        <h2 className="font-display text-3xl">Hesap kodları</h2>
        <p className="mt-1 text-sm text-muted">Muhasebe fişindeki borç ve alacak bu kodlara yazılır. Bilmiyorsanız varsayılan kalsın.</p>
        <div className="mt-3 space-y-3">
          {ACCOUNT_ROWS.map((row) => (
            <Field key={row.key} label={row.label} hint={row.hint}>
              <TextInput
                value={settings.hesaplar[row.key]}
                onChange={(event) =>
                  patch({ hesaplar: { ...settings.hesaplar, [row.key]: event.target.value } })
                }
              />
            </Field>
          ))}
          {KDV_ROWS.map((row) => (
            <Field key={row.key} label={row.label}>
              <TextInput
                value={settings.hesaplar.kdv[row.key] ?? ''}
                onChange={(event) =>
                  patch({
                    hesaplar: { ...settings.hesaplar, kdv: { ...settings.hesaplar.kdv, [row.key]: event.target.value } },
                  })
                }
              />
            </Field>
          ))}
          <div className="grid gap-3 min-[560px]:grid-cols-2">
            <Field label="Logo fiş tipi" hint="Varsayılan 4: alınan hizmet">
              <TextInput
                inputMode="numeric"
                value={String(settings.fisLogoTip)}
                onChange={(event) => patch({ fisLogoTip: Number(event.target.value) || 0 })}
              />
            </Field>
            <Field label="Logo fatura tipi" hint="Varsayılan 1: mal alım">
              <TextInput
                inputMode="numeric"
                value={String(settings.faturaLogoTip)}
                onChange={(event) => patch({ faturaLogoTip: Number(event.target.value) || 0 })}
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-card p-4">
        <h2 className="font-display text-3xl">Sütunlar</h2>
        <p className="mt-1 text-sm text-muted">
          Başlıkları mali müşavirin şablonundaki yazıyla aynı yapın. Sıra, dosyadaki sıra olur.
        </p>
        <Field label="Dosya adı">
          <TextInput value={settings.dosyaOneki} onChange={(event) => patch({ dosyaOneki: event.target.value })} />
        </Field>
        <div className="mt-3">
          <p className="mb-2 text-sm font-semibold">Luca CSV ayracı</p>
          <div className="flex gap-2">
            <Button type="button" tone={settings.csvAyrac === ',' ? 'olive' : 'ghost'} onClick={() => patch({ csvAyrac: ',' })}>
              Virgül
            </Button>
            <Button type="button" tone={settings.csvAyrac === ';' ? 'olive' : 'ghost'} onClick={() => patch({ csvAyrac: ';' })}>
              Noktalı virgül
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted">Luca’nın kendi belgesi virgül ister. Ondalık her zaman noktadır: 1234.56</p>
        </div>
        <div className="mt-4 space-y-3">
          {GROUPS.map((group) => (
            <ColumnGroup
              key={group.key}
              title={group.title}
              note={group.note}
              columns={settings.sutunlar[group.key]}
              warnLimit={group.key === 'lucaFatura' ? LUCA_FATURA_COLUMN_LIMIT : undefined}
              onChange={(columns) => patch({ sutunlar: { ...settings.sutunlar, [group.key]: columns } })}
              onReset={() => patch({ sutunlar: { ...settings.sutunlar, [group.key]: cloneColumns(DEFAULT_COLUMNS[group.key]) } })}
            />
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-card p-4">
        <h2 className="font-display text-3xl">Veriler</h2>
        <p className="mt-1 text-sm text-muted">Belgeler ve fotoğraflar bu cihazda kalır. Anahtarı silmek belgeleri silmez.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" tone="ghost" onClick={() => void store.loadSamples()}>
            Örnek belgeleri yükle
          </Button>
          <Button type="button" tone="ghost" onClick={() => patch({ apiKey: '' })}>
            Anahtarı sil
          </Button>
          <Button
            type="button"
            tone="clay"
            onClick={() => {
              if (window.confirm('Bütün belgeler silinsin mi?')) void store.removeAll();
            }}
          >
            Belgeleri sil
          </Button>
        </div>
      </section>
    </main>
  );
}

function ColumnGroup({
  title,
  note,
  columns,
  warnLimit,
  onChange,
  onReset,
}: {
  title: string;
  note: string;
  columns: ColumnSpec[];
  warnLimit?: number;
  onChange: (columns: ColumnSpec[]) => void;
  onReset: () => void;
}) {
  const openCount = columns.filter((column) => column.enabled).length;
  function move(index: number, delta: number) {
    const next = columns.slice();
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }
  return (
    <details className="rounded-2xl bg-paper px-3 py-2">
      <summary className="cursor-pointer py-2 font-semibold">
        {title} <span className="text-sm font-normal text-muted">({openCount} açık)</span>
      </summary>
      <p className="text-sm text-muted">{note}</p>
      {warnLimit && openCount > warnLimit ? (
        <p className="mt-2 text-sm font-semibold text-bad">
          {openCount} sütun açık. Luca en fazla {warnLimit} sütun alır.
        </p>
      ) : null}
      <ul className="mt-2 space-y-2">
        {columns.map((column, index) => (
          <li key={column.key} className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <input
              type="checkbox"
              className="size-5"
              checked={column.enabled}
              aria-label={`${column.header} açık`}
              onChange={(event) => {
                const next = columns.slice();
                next[index] = { ...column, enabled: event.target.checked };
                onChange(next);
              }}
            />
            <TextInput
              aria-label={`${column.key} başlığı`}
              value={column.header}
              onChange={(event) => {
                const next = columns.slice();
                next[index] = { ...column, header: event.target.value };
                onChange(next);
              }}
            />
            <div className="flex flex-col">
              <button type="button" className="px-2 text-sm" aria-label="Yukarı" onClick={() => move(index, -1)}>
                ↑
              </button>
              <button type="button" className="px-2 text-sm" aria-label="Aşağı" onClick={() => move(index, 1)}>
                ↓
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="mt-2 text-sm font-semibold text-olive-2" onClick={onReset}>
        Varsayılana dön
      </button>
    </details>
  );
}
