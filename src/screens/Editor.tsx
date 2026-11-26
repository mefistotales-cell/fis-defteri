import { useEffect, useState } from 'react';
import { Button, cx, Dialog, Field, TextArea, TextInput } from '../components/ui.tsx';
import { formatTr, fromKurus, parseTurkishNumber, toKurus } from '../lib/money.ts';
import type { DocumentFields, FieldWarning, KdvSatiri, OdemeSekli } from '../lib/types.ts';
import { ODEME_LABEL } from '../lib/types.ts';
import { moneyCheck, validateDocument } from '../lib/validate.ts';

const ODEMELER: OdemeSekli[] = ['nakit', 'kart', 'havale', 'acik', 'bilinmiyor'];

export function Editor({
  step,
  imageUrl,
  initialFields,
  banner,
  onSave,
  onCancel,
  onRetry,
}: {
  step?: string;
  imageUrl: string | null;
  initialFields: DocumentFields;
  banner?: string;
  onSave: (fields: DocumentFields) => void;
  onCancel: () => void;
  onRetry?: () => void;
}) {
  const [fields, setFields] = useState(initialFields);
  const [zoom, setZoom] = useState(false);
  const warnings = validateDocument(fields);
  const check = moneyCheck(fields);
  const hasError = warnings.some((warning) => warning.level === 'hata');
  const fark = check.farkKurus;

  function patch(partial: Partial<DocumentFields>) {
    setFields({ ...fields, ...partial });
  }

  function patchKdv(index: number, partial: Partial<KdvSatiri>) {
    patch({ kdvSatirlari: fields.kdvSatirlari.map((row, rowIndex) => (rowIndex === index ? { ...row, ...partial } : row)) });
  }

  function calcKdv() {
    patch({
      kdvSatirlari: fields.kdvSatirlari.map((row) => ({
        ...row,
        kdv: fromKurus(Math.round((toKurus(row.matrah) * row.oran) / 100)),
      })),
    });
  }

  function calcToplam() {
    patch({ toplam: fromKurus(check.sumKurus) });
  }

  return (
    <form
      className="mx-auto grid max-w-6xl gap-4 px-4 py-4 pb-28 min-[900px]:grid-cols-[minmax(260px,0.86fr)_minmax(0,1.14fr)]"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(fields);
      }}
    >
      <div className="min-[900px]:sticky min-[900px]:top-4 min-[900px]:self-start">
        <button
          type="button"
          className="block w-full overflow-hidden rounded-3xl bg-olive p-3 text-left"
          onClick={() => imageUrl && setZoom(true)}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="Belgenin fotoğrafı" className="max-h-[48dvh] w-full rounded-2xl bg-black/40 object-contain min-[900px]:max-h-[72dvh]" />
          ) : (
            <div className="flex min-h-48 items-center justify-center rounded-2xl bg-paper/10 text-paper">Fotoğraf yok</div>
          )}
          {imageUrl ? <span className="mt-2 block text-center text-sm text-sand">Büyütmek için dokunun</span> : null}
        </button>
      </div>

      <div className="space-y-4">
        {step ? <p className="text-sm font-semibold text-muted">{step}</p> : null}
        {banner ? (
          <div className="rounded-2xl bg-warn-bg px-4 py-3 text-sm text-warn">
            <p>{banner}</p>
            {onRetry ? (
              <Button type="button" tone="ghost" className="mt-3" onClick={onRetry}>
                Yeniden oku
              </Button>
            ) : null}
          </div>
        ) : null}

        <section className={cx('rounded-3xl px-4 py-3', hasError ? 'bg-bad-bg' : warnings.length ? 'bg-warn-bg' : 'bg-ok-bg')}>
          <h2 className="font-display text-xl">{hasError ? 'Tutarlar tutmuyor' : warnings.length ? 'Kontrol edin' : 'Tutarlar tutuyor'}</h2>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-muted">Matrah</dt>
              <dd className="font-semibold">{formatTr(check.matrahKurus / 100)} TL</dd>
            </div>
            <div>
              <dt className="text-muted">KDV</dt>
              <dd className="font-semibold">{formatTr(check.kdvKurus / 100)} TL</dd>
            </div>
            <div>
              <dt className="text-muted">Matrah + KDV</dt>
              <dd className="font-semibold">{formatTr(check.sumKurus / 100)} TL</dd>
            </div>
            <div>
              <dt className="text-muted">Belgedeki toplam</dt>
              <dd className="font-semibold">{fields.toplam == null ? '—' : `${formatTr(fields.toplam)} TL`}</dd>
            </div>
          </dl>
          {fark != null && fark !== 0 ? <p className="mt-2 text-sm font-semibold">Fark {formatTr(Math.abs(fark) / 100)} TL</p> : null}
          {warnings.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {warnings.map((warning) => (
                <li key={`${warning.field}-${warning.message}`}>{warning.message}</li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="space-y-4 rounded-3xl bg-card p-4 shadow-sm">
          <div>
            <p className="mb-2 text-sm font-semibold">Belge türü</p>
            <div className="grid grid-cols-2 gap-2">
              <Choice active={fields.belgeTuru === 'fis'} tone={toneOf('belgeTuru', warnings)} onClick={() => patch({ belgeTuru: 'fis' })}>
                Fiş
              </Choice>
              <Choice active={fields.belgeTuru === 'fatura'} tone={toneOf('belgeTuru', warnings)} onClick={() => patch({ belgeTuru: 'fatura' })}>
                Fatura
              </Choice>
            </div>
          </div>
          <div className="grid gap-3 min-[560px]:grid-cols-2">
            <Field label="Tarih" hint={hint('tarih', warnings)}>
              <TextInput type="date" value={fields.tarih} tone={toneOf('tarih', warnings)} onChange={(event) => patch({ tarih: event.target.value })} />
            </Field>
            <Field label="Saat" hint={hint('saat', warnings)}>
              <TextInput type="time" value={fields.saat} tone={toneOf('saat', warnings)} onChange={(event) => patch({ saat: event.target.value })} />
            </Field>
          </div>
          <Field label="Satıcı firma" hint={hint('saticiUnvan', warnings)}>
            <TextInput value={fields.saticiUnvan} tone={toneOf('saticiUnvan', warnings)} onChange={(event) => patch({ saticiUnvan: event.target.value })} />
          </Field>
          <div className="grid gap-3 min-[560px]:grid-cols-2">
            <Field label="VKN / TCKN" hint={hint('vknTckn', warnings)}>
              <TextInput inputMode="numeric" value={fields.vknTckn} tone={toneOf('vknTckn', warnings)} onChange={(event) => patch({ vknTckn: event.target.value })} />
            </Field>
            <Field label="Vergi dairesi" hint={hint('vergiDairesi', warnings)}>
              <TextInput value={fields.vergiDairesi} tone={toneOf('vergiDairesi', warnings)} onChange={(event) => patch({ vergiDairesi: event.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 min-[560px]:grid-cols-3">
            <Field label={fields.belgeTuru === 'fis' ? 'Fiş no' : 'Fatura no'} hint={hint('belgeNo', warnings)}>
              <TextInput value={fields.belgeNo} tone={toneOf('belgeNo', warnings)} onChange={(event) => patch({ belgeNo: event.target.value })} />
            </Field>
            <Field label="Z no" hint={hint('zNo', warnings)}>
              <TextInput value={fields.zNo} tone={toneOf('zNo', warnings)} onChange={(event) => patch({ zNo: event.target.value })} />
            </Field>
            <Field label="EKÜ no" hint={hint('ekuNo', warnings)}>
              <TextInput value={fields.ekuNo} tone={toneOf('ekuNo', warnings)} onChange={(event) => patch({ ekuNo: event.target.value })} />
            </Field>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">KDV dökümü</p>
              <button type="button" className="text-sm font-semibold text-olive-2" onClick={calcKdv}>
                KDV’yi orandan hesapla
              </button>
            </div>
            <div className="space-y-2">
              {fields.kdvSatirlari.map((row, index) => (
                <div key={`${index}-${row.oran}`} className="grid grid-cols-[72px_1fr_1fr_auto] gap-2">
                  <TextInput
                    aria-label={`KDV oranı ${index + 1}`}
                    inputMode="numeric"
                    value={String(row.oran)}
                    tone={toneOf(`kdv:${index}`, warnings)}
                    onChange={(event) => patchKdv(index, { oran: Number(event.target.value.replace(',', '.')) || 0 })}
                  />
                  <MoneyBox label="Matrah" value={row.matrah} tone={toneOf(`kdv:${index}`, warnings)} onChange={(matrah) => patchKdv(index, { matrah })} />
                  <MoneyBox label="KDV" value={row.kdv} tone={toneOf(`kdv:${index}`, warnings)} onChange={(kdv) => patchKdv(index, { kdv })} />
                  <button
                    type="button"
                    className="min-h-12 rounded-xl px-2 text-sm font-semibold text-bad"
                    onClick={() => patch({ kdvSatirlari: fields.kdvSatirlari.filter((_, rowIndex) => rowIndex !== index) })}
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              tone="ghost"
              className="mt-2 w-full"
              onClick={() => patch({ kdvSatirlari: [...fields.kdvSatirlari, { oran: 20, matrah: 0, kdv: 0 }] })}
            >
              KDV satırı ekle
            </Button>
          </div>

          <Field label="Toplam (KDV dahil)" hint={hint('toplam', warnings)}>
            <MoneyBox label="Toplam" value={fields.toplam} tone={toneOf('toplam', warnings)} onChange={(toplam) => patch({ toplam })} />
            <button type="button" className="mt-1 text-sm font-semibold text-olive-2" onClick={calcToplam}>
              Toplamı satırlardan yaz
            </button>
          </Field>

          <div>
            <p className="mb-2 text-sm font-semibold">Ödeme</p>
            <div className="flex flex-wrap gap-2">
              {ODEMELER.map((odeme) => (
                <button
                  key={odeme}
                  type="button"
                  className={cx(
                    'min-h-11 rounded-full px-3 text-sm font-semibold',
                    fields.odemeSekli === odeme ? 'bg-olive text-paper' : 'bg-sand text-ink',
                  )}
                  onClick={() => patch({ odemeSekli: odeme })}
                >
                  {ODEME_LABEL[odeme]}
                </button>
              ))}
            </div>
          </div>
          <Field label="Açıklama" hint={hint('aciklama', warnings)}>
            <TextArea value={fields.aciklama} tone={toneOf('aciklama', warnings)} onChange={(event) => patch({ aciklama: event.target.value })} />
          </Field>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto flex max-w-6xl gap-2">
          <Button type="button" tone="ghost" className="flex-1" onClick={onCancel}>
            Vazgeç
          </Button>
          <Button type="submit" className="flex-[2]">
            {hasError ? 'Yine de kaydet' : 'Kaydet'}
          </Button>
        </div>
      </div>
      <Dialog open={zoom} title="Belge" onClose={() => setZoom(false)}>
        {imageUrl ? <img src={imageUrl} alt="Belgenin büyük fotoğrafı" className="w-full rounded-2xl" /> : null}
      </Dialog>
    </form>
  );
}

function Choice({
  active,
  children,
  onClick,
  tone,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
  tone?: 'warn' | 'bad';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'min-h-12 rounded-2xl border font-semibold',
        active ? 'border-olive bg-olive text-paper' : 'border-line bg-card',
        !active && tone === 'bad' && 'border-bad bg-bad-bg',
        !active && tone === 'warn' && 'border-clay bg-warn-bg',
      )}
    >
      {children}
    </button>
  );
}

function MoneyBox({
  label,
  value,
  onChange,
  tone,
}: {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  tone?: 'warn' | 'bad';
}) {
  const [text, setText] = useState(value == null ? '' : formatTr(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(value == null ? '' : formatTr(value));
  }, [value, focused]);
  return (
    <TextInput
      aria-label={label}
      inputMode="decimal"
      value={text}
      tone={tone}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        const parsed = text.trim() ? parseTurkishNumber(text) : 0;
        onChange(parsed ?? 0);
        setText(formatTr(parsed ?? 0));
      }}
      onChange={(event) => {
        setText(event.target.value);
        const parsed = parseTurkishNumber(event.target.value);
        if (parsed != null) onChange(parsed);
      }}
    />
  );
}

function toneOf(field: string, warnings: FieldWarning[]): 'warn' | 'bad' | undefined {
  const related = warnings.filter((warning) => warning.field === field);
  if (related.some((warning) => warning.level === 'hata')) return 'bad';
  if (related.length > 0) return 'warn';
  return undefined;
}

function hint(field: string, warnings: FieldWarning[]): string | undefined {
  return warnings.find((warning) => warning.field === field)?.message;
}
