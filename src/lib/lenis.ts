import type Lenis from 'lenis';

/** Shared handle to the single Lenis instance (set by <Effects/>). */
let instance: Lenis | null = null;
export const setLenis = (l: Lenis | null) => { instance = l; };
export const getLenis = () => instance;
