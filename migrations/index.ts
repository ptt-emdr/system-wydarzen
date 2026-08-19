import * as migration_20260819_100452_init from './20260819_100452_init';

export const migrations = [
  {
    up: migration_20260819_100452_init.up,
    down: migration_20260819_100452_init.down,
    name: '20260819_100452_init'
  },
];
