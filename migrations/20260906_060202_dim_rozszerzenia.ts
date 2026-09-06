import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`wydarzenia\` ADD \`zapisy_do\` text;`)
  await db.run(sql`ALTER TABLE \`wydarzenia\` ADD \`etykieta_kosztow\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`wydarzenia\` DROP COLUMN \`zapisy_do\`;`)
  await db.run(sql`ALTER TABLE \`wydarzenia\` DROP COLUMN \`etykieta_kosztow\`;`)
}
