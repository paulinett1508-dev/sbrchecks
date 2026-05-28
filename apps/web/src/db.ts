import Dexie from 'dexie';

// Banco local (IndexedDB). Tabelas e lógica de sync virão no Sprint 3.
export const db = new Dexie('sbrchecks');
