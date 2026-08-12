import * as migration_20260812_214904 from './20260812_214904';

export const migrations = [
  {
    up: migration_20260812_214904.up,
    down: migration_20260812_214904.down,
    name: '20260812_214904',
  },
];
