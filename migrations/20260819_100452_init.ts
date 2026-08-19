import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`wydarzenia_progi_cenowe\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`nazwa\` text NOT NULL,
  	\`cena_progu\` numeric NOT NULL,
  	\`do_kiedy\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`wydarzenia\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`wydarzenia_progi_cenowe_order_idx\` ON \`wydarzenia_progi_cenowe\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`wydarzenia_progi_cenowe_parent_id_idx\` ON \`wydarzenia_progi_cenowe\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`wydarzenia_terminy\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`nazwa\` text,
  	\`data\` text,
  	\`limit\` numeric,
  	\`cena_terminu\` numeric,
  	\`zapisy_do\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`wydarzenia\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`wydarzenia_terminy_order_idx\` ON \`wydarzenia_terminy\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`wydarzenia_terminy_parent_id_idx\` ON \`wydarzenia_terminy\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`wydarzenia_pola\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`etykieta\` text NOT NULL,
  	\`typ\` text DEFAULT 'tekst' NOT NULL,
  	\`wymagane\` integer DEFAULT false,
  	\`opcje\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`wydarzenia\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`wydarzenia_pola_order_idx\` ON \`wydarzenia_pola\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`wydarzenia_pola_parent_id_idx\` ON \`wydarzenia_pola\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`wydarzenia\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`tytul\` text NOT NULL,
  	\`typ\` text DEFAULT 'szkolenie' NOT NULL,
  	\`slug\` text,
  	\`opublikowane\` integer DEFAULT false,
  	\`data_od\` text NOT NULL,
  	\`data_do\` text,
  	\`miejsce\` text,
  	\`opis\` text NOT NULL,
  	\`cena\` numeric NOT NULL,
  	\`dni_na_platnosc\` numeric DEFAULT 3 NOT NULL,
  	\`limit_miejsc\` numeric,
  	\`akceptacja_uczestnikow\` integer DEFAULT false,
  	\`lista_rezerwowa\` integer DEFAULT false,
  	\`tryb_zapisu\` text DEFAULT 'wydarzenie' NOT NULL,
  	\`zbieraj_dane_faktury\` integer DEFAULT true,
  	\`instrukcja_platnosci\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`wydarzenia_slug_idx\` ON \`wydarzenia\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`wydarzenia_updated_at_idx\` ON \`wydarzenia\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`wydarzenia_created_at_idx\` ON \`wydarzenia\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`zgloszenia_wybrane_terminy\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`nazwa\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`zgloszenia\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`zgloszenia_wybrane_terminy_order_idx\` ON \`zgloszenia_wybrane_terminy\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`zgloszenia_wybrane_terminy_parent_id_idx\` ON \`zgloszenia_wybrane_terminy\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`zgloszenia_wplaty\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`dzien\` text NOT NULL,
  	\`kwota\` numeric NOT NULL,
  	\`uwagi\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`zgloszenia\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`zgloszenia_wplaty_order_idx\` ON \`zgloszenia_wplaty\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`zgloszenia_wplaty_parent_id_idx\` ON \`zgloszenia_wplaty\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`zgloszenia_odpowiedzi\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`pytanie\` text,
  	\`odpowiedz\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`zgloszenia\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`zgloszenia_odpowiedzi_order_idx\` ON \`zgloszenia_odpowiedzi\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`zgloszenia_odpowiedzi_parent_id_idx\` ON \`zgloszenia_odpowiedzi\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`zgloszenia\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`opisowy\` text,
  	\`imie\` text NOT NULL,
  	\`nazwisko\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`telefon\` text,
  	\`wydarzenie_id\` integer NOT NULL,
  	\`status\` text DEFAULT 'oczekuje' NOT NULL,
  	\`powod_odrzucenia\` text,
  	\`powod_anulowania\` text,
  	\`kwota_nalezna\` numeric NOT NULL,
  	\`wplacono\` numeric,
  	\`termin_platnosci\` text,
  	\`kod_platnosci\` text,
  	\`chce_fakture\` integer DEFAULT false,
  	\`faktura_nazwa\` text,
  	\`faktura_nip\` text,
  	\`faktura_adres\` text,
  	\`notatka\` text,
  	\`zgoda_rodo\` integer,
  	\`token\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`wydarzenie_id\`) REFERENCES \`wydarzenia\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`zgloszenia_wydarzenie_idx\` ON \`zgloszenia\` (\`wydarzenie_id\`);`)
  await db.run(sql`CREATE INDEX \`zgloszenia_updated_at_idx\` ON \`zgloszenia\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`zgloszenia_created_at_idx\` ON \`zgloszenia\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`zgloszenia_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`zalaczniki_zgloszen_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`zgloszenia\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`zalaczniki_zgloszen_id\`) REFERENCES \`zalaczniki_zgloszen\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`zgloszenia_rels_order_idx\` ON \`zgloszenia_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`zgloszenia_rels_parent_idx\` ON \`zgloszenia_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`zgloszenia_rels_path_idx\` ON \`zgloszenia_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`zgloszenia_rels_zalaczniki_zgloszen_id_idx\` ON \`zgloszenia_rels\` (\`zalaczniki_zgloszen_id\`);`)
  await db.run(sql`CREATE TABLE \`zalaczniki_zgloszen\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric
  );
  `)
  await db.run(sql`CREATE INDEX \`zalaczniki_zgloszen_updated_at_idx\` ON \`zalaczniki_zgloszen\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`zalaczniki_zgloszen_created_at_idx\` ON \`zalaczniki_zgloszen\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`zalaczniki_zgloszen_filename_idx\` ON \`zalaczniki_zgloszen\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`imie_nazwisko\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`wydarzenia_id\` integer,
  	\`zgloszenia_id\` integer,
  	\`zalaczniki_zgloszen_id\` integer,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`wydarzenia_id\`) REFERENCES \`wydarzenia\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`zgloszenia_id\`) REFERENCES \`zgloszenia\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`zalaczniki_zgloszen_id\`) REFERENCES \`zalaczniki_zgloszen\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_wydarzenia_id_idx\` ON \`payload_locked_documents_rels\` (\`wydarzenia_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_zgloszenia_id_idx\` ON \`payload_locked_documents_rels\` (\`zgloszenia_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_zalaczniki_zgloszen_id_idx\` ON \`payload_locked_documents_rels\` (\`zalaczniki_zgloszen_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`ustawienia\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`organizator\` text DEFAULT 'Polskie Towarzystwo Terapii EMDR' NOT NULL,
  	\`email_kontaktowy\` text DEFAULT 'sekretarz@emdr.org.pl' NOT NULL,
  	\`telefon\` text,
  	\`rachunek_numer\` text DEFAULT '00 0000 0000 0000 0000 0000 0000' NOT NULL,
  	\`rachunek_odbiorca\` text DEFAULT 'Polskie Towarzystwo Terapii EMDR
  Al. Jana Pawła II 27, 00-867 Warszawa' NOT NULL,
  	\`klauzula_rodo\` text DEFAULT 'Administratorem danych osobowych jest Polskie Towarzystwo Terapii EMDR (Al. Jana Pawła II 27, 00-867 Warszawa). Dane podane w formularzu przetwarzane są wyłącznie w celu organizacji i rozliczenia wydarzenia oraz wystawienia dokumentów uczestnictwa i sprzedaży; przysługuje Państwu prawo dostępu do danych, ich sprostowania i usunięcia po rozliczeniu wydarzenia.' NOT NULL,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`wydarzenia_progi_cenowe\`;`)
  await db.run(sql`DROP TABLE \`wydarzenia_terminy\`;`)
  await db.run(sql`DROP TABLE \`wydarzenia_pola\`;`)
  await db.run(sql`DROP TABLE \`wydarzenia\`;`)
  await db.run(sql`DROP TABLE \`zgloszenia_wybrane_terminy\`;`)
  await db.run(sql`DROP TABLE \`zgloszenia_wplaty\`;`)
  await db.run(sql`DROP TABLE \`zgloszenia_odpowiedzi\`;`)
  await db.run(sql`DROP TABLE \`zgloszenia\`;`)
  await db.run(sql`DROP TABLE \`zgloszenia_rels\`;`)
  await db.run(sql`DROP TABLE \`zalaczniki_zgloszen\`;`)
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
  await db.run(sql`DROP TABLE \`ustawienia\`;`)
}
