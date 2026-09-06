import * as migration_20260819_100452_init from './20260819_100452_init';
import * as migration_20260906_060202_dim_rozszerzenia from './20260906_060202_dim_rozszerzenia';

export const migrations = [
  {
    up: migration_20260819_100452_init.up,
    down: migration_20260819_100452_init.down,
    name: '20260819_100452_init',
  },
  {
    up: migration_20260906_060202_dim_rozszerzenia.up,
    down: migration_20260906_060202_dim_rozszerzenia.down,
    name: '20260906_060202_dim_rozszerzenia'
  },
];
