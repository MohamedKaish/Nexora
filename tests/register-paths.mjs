import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

const memoryStorage = new Map()
const localStorageMock = {
  getItem: (key) => memoryStorage.get(key) ?? null,
  setItem: (key, val) => {
    memoryStorage.set(key, String(val))
  },
  removeItem: (key) => {
    memoryStorage.delete(key)
  },
  clear: () => {
    memoryStorage.clear()
  },
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
})

Object.defineProperty(globalThis, 'window', {
  value: {
    localStorage: localStorageMock,
    location: { origin: 'https://nexora-nine-kappa.vercel.app', pathname: '/dashboard' },
    navigator: {},
    addEventListener: () => {},
    removeEventListener: () => {},
  },
  writable: true,
  configurable: true,
})

const rootDir = process.cwd()

const zustandShim = `
export function create(createState) {
  function createStoreImpl(fn) {
    let state;
    const listeners = new Set();
    const setState = (partial, replace) => {
      const nextState = typeof partial === 'function' ? partial(state) : partial;
      if (!Object.is(nextState, state)) {
        state = (replace ?? (typeof nextState !== 'object' || nextState === null))
          ? nextState
          : Object.assign({}, state, nextState);
        listeners.forEach((listener) => listener(state));
      }
    };
    const getState = () => state;
    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };
    const api = { setState, getState, subscribe };
    state = fn(setState, getState, api);
    const useBoundStore = (selector) => (selector ? selector(state) : state);
    Object.assign(useBoundStore, api);
    return useBoundStore;
  }
  return createState ? createStoreImpl(createState) : createStoreImpl;
}
`

const zustandMiddlewareShim = `
export function persist(config, options) {
  return (set, get, api) => {
    const save = () => {
      try {
        if (typeof globalThis.localStorage !== 'undefined' && options?.name) {
          const currentState = get();
          const stateToStore = options.partialize ? options.partialize(currentState) : currentState;
          globalThis.localStorage.setItem(
            options.name,
            JSON.stringify({ state: stateToStore, version: options.version ?? 0 })
          );
        }
      } catch {}
    };
    const persistedSet = (partial, replace) => {
      set(partial, replace);
      save();
    };
    api.setState = (partial, replace) => {
      set(partial, replace);
      save();
    };
    const initial = config(persistedSet, get, api);
    setTimeout(save, 0);
    return initial;
  };
}
`

const dateFnsShim = `
export function format(date, fmt) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  if (fmt === 'yyyy-MM-dd') return \`\${yyyy}-\${MM}-\${dd}\`;
  if (fmt === 'HH:mm') return \`\${HH}:\${mm}\`;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (fmt === 'EEE') return days[d.getDay()];
  return d.toISOString();
}

export function subDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() - amount);
  return d;
}

export function startOfWeek(date, options) {
  const d = new Date(date);
  const weekStartsOn = options?.weekStartsOn ?? 0;
  const day = d.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isAfter(date, dateToCompare) {
  return new Date(date).getTime() > new Date(dateToCompare).getTime();
}

export function parseISO(str) {
  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  return new Date(str);
}
`

const loaderCode = `
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const rootDir = ${JSON.stringify(rootDir)};
const shims = {
  'zustand': ${JSON.stringify(`data:text/javascript;base64,${Buffer.from(zustandShim).toString('base64')}`)},
  'zustand/middleware': ${JSON.stringify(`data:text/javascript;base64,${Buffer.from(zustandMiddlewareShim).toString('base64')}`)},
  'date-fns': ${JSON.stringify(`data:text/javascript;base64,${Buffer.from(dateFnsShim).toString('base64')}`)},
};

export async function resolve(specifier, context, nextResolve) {
  if (shims[specifier]) {
    return { url: shims[specifier], shortCircuit: true };
  }
  if (specifier.startsWith('@/')) {
    const rel = specifier.slice(2);
    const candidateBase = path.join(rootDir, 'src', rel);
    for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
      if (fs.existsSync(candidateBase + ext) && fs.statSync(candidateBase + ext).isFile()) {
        return nextResolve(pathToFileURL(candidateBase + ext).href, context);
      }
    }
  }
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL && context.parentURL.startsWith('file:')) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    const candidateBase = path.resolve(parentDir, specifier);
    for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
      if (fs.existsSync(candidateBase + ext) && fs.statSync(candidateBase + ext).isFile()) {
        return nextResolve(pathToFileURL(candidateBase + ext).href, context);
      }
    }
  }
  return nextResolve(specifier, context);
}
`

register(
  `data:text/javascript;base64,${Buffer.from(loaderCode).toString('base64')}`,
  pathToFileURL('./')
)
