import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`wydarzenia\` ADD \`uklad_zapisow\` text DEFAULT 'obok';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`wydarzenia\` DROP COLUMN \`uklad_zapisow\`;`)
}
