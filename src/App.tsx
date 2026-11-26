import { useEffect, useState } from 'react';
import { Help } from './screens/Help.tsx';
import { Home } from './screens/Home.tsx';
import { NewReview, SavedReview } from './screens/Review.tsx';
import { Settings } from './screens/Settings.tsx';
import { useStore } from './store.tsx';

type Route = { name: 'home' } | { name: 'settings' } | { name: 'help' } | { name: 'new' } | { name: 'edit'; id: string };

function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  if (path === '/ayarlar') return { name: 'settings' };
  if (path === '/yardim') return { name: 'help' };
  if (path === '/yeni') return { name: 'new' };
  const edit = /^\/incele\/([^/]+)$/.exec(path);
  if (edit) return { name: 'edit', id: decodeURIComponent(edit[1]) };
  return { name: 'home' };
}

function useRoute(): Route {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return parseRoute(hash);
}

export default function App() {
  const route = useRoute();
  const store = useStore();
  const review = route.name === 'new' || route.name === 'edit';
  return (
    <div className="min-h-dvh">
      <header className="bg-olive text-paper" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <a href="#/" className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-sand uppercase">Haskara Tarım · Adana</p>
            <p className="font-display text-[1.7rem] leading-none">Fiş Defteri</p>
          </a>
          {!review ? (
            <nav className="ml-auto flex gap-1 text-sm font-semibold">
              <a className={route.name === 'home' ? 'rounded-full bg-paper px-3 py-2 text-olive' : 'rounded-full px-3 py-2 text-sand'} href="#/">
                Defter
              </a>
              <a className={route.name === 'help' ? 'rounded-full bg-paper px-3 py-2 text-olive' : 'rounded-full px-3 py-2 text-sand'} href="#/yardim">
                Aktarım
              </a>
              <a className={route.name === 'settings' ? 'rounded-full bg-paper px-3 py-2 text-olive' : 'rounded-full px-3 py-2 text-sand'} href="#/ayarlar">
                Ayarlar
              </a>
            </nav>
          ) : (
            <a className="ml-auto rounded-full bg-paper px-3 py-2 text-sm font-semibold text-olive" href="#/">
              Defter
            </a>
          )}
        </div>
        <div className="h-1 bg-clay" />
      </header>
      {store.notice ? (
        <div
          role={store.notice.tone === 'bad' ? 'alert' : 'status'}
          className={
            store.notice.tone === 'bad'
              ? 'sticky top-0 z-30 bg-bad-bg px-4 py-3 text-bad'
              : 'sticky top-0 z-30 bg-ok-bg px-4 py-3 text-ok'
          }
        >
          <div className="mx-auto flex max-w-6xl items-start justify-between gap-3">
            <p className="font-semibold">{store.notice.text}</p>
            <button type="button" className="min-h-10 shrink-0 font-semibold" onClick={store.dismissNotice}>
              Kapat
            </button>
          </div>
        </div>
      ) : null}
      {!store.settings.apiKey && route.name === 'home' ? (
        <p className="bg-warn-bg px-4 py-2 text-center text-sm text-warn">
          Okumak için <a className="font-semibold underline" href="#/ayarlar">Ayarlar</a>’dan kendi API anahtarınızı girin. Örnek belgeler anahtarsız da açılır.
        </p>
      ) : null}
      {route.name === 'home' ? <Home /> : null}
      {route.name === 'settings' ? <Settings /> : null}
      {route.name === 'help' ? <Help /> : null}
      {route.name === 'new' ? <NewReview /> : null}
      {route.name === 'edit' ? <SavedReview id={route.id} /> : null}
    </div>
  );
}
