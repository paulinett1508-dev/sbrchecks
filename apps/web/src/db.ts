import Dexie, { type Table } from 'dexie';
import type { WalletItemDto } from '@sbrchecks/shared';

class SbrCheckDb extends Dexie {
  wallet!: Table<WalletItemDto, string>;

  constructor() {
    super('sbrchecks');
    this.version(1).stores({
      wallet: 'id, name',
    });
  }
}

export const db = new SbrCheckDb();
