import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

/**
 * Role kont (Administrator jednego wydarzenia), powiadomienia o nowych
 * zgłoszeniach i indywidualna treść e-maila potwierdzenia (21.09.2026).
 * Dodatkowo: załączniki zgłoszeń dostają odniesienie do wydarzenia
 * (kontrola dostępu per wydarzenie) + uzupełnienie istniejących wierszy
 * na podstawie relacji zgłoszenie→załącznik.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` ADD \`rola\` text DEFAULT 'pelny' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`wydarzenie_id\` integer REFERENCES wydarzenia(id);`)
  await db.run(sql`ALTER TABLE \`wydarzenia\` ADD \`powiadomienia_adresy\` text DEFAULT 'sekretarz@emdr.org.pl';`)
  await db.run(sql`ALTER TABLE \`wydarzenia\` ADD \`tresc_potwierdzenia\` text;`)
  await db.run(sql`ALTER TABLE \`zalaczniki_zgloszen\` ADD \`wydarzenie_id\` integer REFERENCES wydarzenia(id);`)
  await db.run(sql`
    UPDATE \`zalaczniki_zgloszen\`
    SET \`wydarzenie_id\` = (
      SELECT z.\`wydarzenie_id\`
      FROM \`zgloszenia\` z
      JOIN \`zgloszenia_rels\` r ON r.\`parent_id\` = z.\`id\`
      WHERE r.\`path\` = 'zalaczniki'
        AND r.\`zalaczniki_zgloszen_id\` = \`zalaczniki_zgloszen\`.\`id\`
    )
    WHERE \`wydarzenie_id\` IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`rola\`;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`wydarzenie_id\`;`)
  await db.run(sql`ALTER TABLE \`wydarzenia\` DROP COLUMN \`powiadomienia_adresy\`;`)
  await db.run(sql`ALTER TABLE \`wydarzenia\` DROP COLUMN \`tresc_potwierdzenia\`;`)
  await db.run(sql`ALTER TABLE \`zalaczniki_zgloszen\` DROP COLUMN \`wydarzenie_id\`;`)
}
