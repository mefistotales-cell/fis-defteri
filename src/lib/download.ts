import type { DownloadFile } from './exportFiles.ts';

export async function deliver(files: DownloadFile[]): Promise<'shared' | 'saved' | 'cancel'> {
  const packed = files.map((file) => new File([file.blob], file.filename, { type: file.blob.type || 'application/octet-stream' }));
  if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && navigator.canShare({ files: packed })) {
    try {
      await navigator.share({ files: packed, title: packed[0]?.name ?? 'Fiş Defteri' });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancel';
    }
  }
  for (const file of packed) {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
  return 'saved';
}
