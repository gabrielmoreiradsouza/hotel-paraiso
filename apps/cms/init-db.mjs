/**
 * Standalone DB init script — runs raw DDL to create CMS tables.
 * Uses pg (already a production dependency). No TypeScript needed.
 * Idempotent: skips if tables already exist.
 */
import pg from 'pg';

const connectionString =
  process.env.CMS_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://hotel_paraiso:hotel_paraiso_dev@localhost:5432/hotel_paraiso';

const client = new pg.Client({ connectionString });

async function run() {
  await client.connect();

  // Check if tables already exist
  const check = await client.query(
    `SELECT COUNT(*) as c FROM information_schema.tables WHERE table_schema = 'cms' AND table_name = 'rooms'`
  );

  if (parseInt(check.rows[0].c, 10) > 0) {
    console.log('[init-db] Tables already exist, checking incremental updates...');
    await applyIncrementalUpdates(client);
    await client.end();
    return;
  }

  console.log('[init-db] Creating CMS tables...');

  await client.query(`
    CREATE SCHEMA IF NOT EXISTS cms;

    CREATE TYPE "cms"."_locales" AS ENUM('pt', 'en');
    CREATE TYPE "cms"."enum_rooms_status" AS ENUM('draft', 'published');
    CREATE TYPE "cms"."enum_experiences_status" AS ENUM('draft', 'published');
    CREATE TYPE "cms"."enum_experiences_category" AS ENUM('gastronomy', 'leisure', 'wellness', 'adventure', 'cultural');
    CREATE TYPE "cms"."enum_gallery_category" AS ENUM('rooms', 'common', 'restaurant');
    CREATE TYPE "cms"."enum_pages_status" AS ENUM('draft', 'published');
    CREATE TYPE "cms"."enum_blog_posts_status" AS ENUM('draft', 'published');

    CREATE TABLE "cms"."media" (
      "id" serial PRIMARY KEY NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "url" varchar,
      "thumbnail_u_r_l" varchar,
      "filename" varchar,
      "mime_type" varchar,
      "filesize" numeric,
      "width" numeric,
      "height" numeric,
      "focal_x" numeric,
      "focal_y" numeric,
      "sizes_thumbnail_url" varchar,
      "sizes_thumbnail_width" numeric,
      "sizes_thumbnail_height" numeric,
      "sizes_thumbnail_mime_type" varchar,
      "sizes_thumbnail_filesize" numeric,
      "sizes_thumbnail_filename" varchar,
      "sizes_card_url" varchar,
      "sizes_card_width" numeric,
      "sizes_card_height" numeric,
      "sizes_card_mime_type" varchar,
      "sizes_card_filesize" numeric,
      "sizes_card_filename" varchar,
      "sizes_hero_url" varchar,
      "sizes_hero_width" numeric,
      "sizes_hero_height" numeric,
      "sizes_hero_mime_type" varchar,
      "sizes_hero_filesize" numeric,
      "sizes_hero_filename" varchar
    );

    CREATE TABLE "cms"."media_locales" (
      "alt" varchar NOT NULL,
      "caption" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "cms"."_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "cms"."rooms" (
      "id" serial PRIMARY KEY NOT NULL,
      "slug" varchar NOT NULL,
      "artax_room_type_id" numeric,
      "status" "cms"."enum_rooms_status" DEFAULT 'draft',
      "featured_image_id" integer,
      "capacity_adults" numeric DEFAULT 2,
      "capacity_children" numeric DEFAULT 1,
      "size" numeric,
      "display_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "cms"."rooms_locales" (
      "name" varchar NOT NULL,
      "starting_price" varchar,
      "short_description" varchar,
      "long_description" varchar,
      "description" jsonb,
      "capacity_label" varchar,
      "seo_title" varchar,
      "seo_description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "cms"."_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "cms"."rooms_gallery" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer NOT NULL
    );

    CREATE TABLE "cms"."rooms_amenities" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_locale" "cms"."_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "icon" varchar
    );

    CREATE TABLE "cms"."experiences" (
      "id" serial PRIMARY KEY NOT NULL,
      "slug" varchar NOT NULL,
      "status" "cms"."enum_experiences_status" DEFAULT 'draft',
      "category" "cms"."enum_experiences_category",
      "featured_image_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "cms"."experiences_locales" (
      "name" varchar NOT NULL,
      "short_description" varchar,
      "description" jsonb,
      "seo_title" varchar,
      "seo_description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "cms"."_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "cms"."experiences_gallery" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer NOT NULL
    );

    CREATE TABLE "cms"."gallery" (
      "id" serial PRIMARY KEY NOT NULL,
      "category" "cms"."enum_gallery_category",
      "image_id" integer NOT NULL,
      "order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "cms"."gallery_locales" (
      "title" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "cms"."_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "cms"."pages" (
      "id" serial PRIMARY KEY NOT NULL,
      "slug" varchar NOT NULL,
      "status" "cms"."enum_pages_status" DEFAULT 'draft',
      "featured_image_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "cms"."pages_locales" (
      "title" varchar NOT NULL,
      "content" jsonb,
      "seo_title" varchar,
      "seo_description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "cms"."_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "cms"."blog_posts" (
      "id" serial PRIMARY KEY NOT NULL,
      "slug" varchar NOT NULL,
      "status" "cms"."enum_blog_posts_status" DEFAULT 'draft',
      "published_at" timestamp(3) with time zone,
      "featured_image_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "cms"."blog_posts_locales" (
      "title" varchar NOT NULL,
      "excerpt" varchar,
      "content" jsonb,
      "seo_title" varchar,
      "seo_description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "cms"."_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "cms"."blog_posts_tags" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "tag" varchar NOT NULL
    );

    CREATE TABLE "cms"."payload_kv" (
      "id" serial PRIMARY KEY NOT NULL,
      "key" varchar NOT NULL,
      "data" jsonb NOT NULL
    );

    CREATE TABLE "cms"."users" (
      "id" serial PRIMARY KEY NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "email" varchar NOT NULL,
      "reset_password_token" varchar,
      "reset_password_expiration" timestamp(3) with time zone,
      "salt" varchar,
      "hash" varchar,
      "login_attempts" numeric DEFAULT 0,
      "lock_until" timestamp(3) with time zone
    );

    CREATE TABLE "cms"."users_sessions" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "created_at" timestamp(3) with time zone,
      "expires_at" timestamp(3) with time zone NOT NULL
    );

    CREATE TABLE "cms"."payload_locked_documents" (
      "id" serial PRIMARY KEY NOT NULL,
      "global_slug" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "cms"."payload_locked_documents_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "rooms_id" integer,
      "experiences_id" integer,
      "gallery_id" integer,
      "pages_id" integer,
      "blog_posts_id" integer,
      "media_id" integer,
      "users_id" integer
    );

    CREATE TABLE "cms"."payload_preferences" (
      "id" serial PRIMARY KEY NOT NULL,
      "key" varchar,
      "value" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "cms"."payload_preferences_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "users_id" integer
    );

    CREATE TABLE "cms"."payload_migrations" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar,
      "batch" numeric,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "cms"."settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "contact_phone" varchar,
      "contact_email" varchar,
      "contact_whatsapp" varchar,
      "social_instagram" varchar,
      "social_facebook" varchar,
      "social_tripadvisor" varchar,
      "social_booking" varchar,
      "policies_checkin_time" varchar DEFAULT '14:00',
      "policies_checkout_time" varchar DEFAULT '12:00',
      "logo_id" integer,
      "favicon_id" integer,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    CREATE TABLE "cms"."settings_locales" (
      "hotel_name" varchar DEFAULT 'Hotel Paraíso' NOT NULL,
      "tagline" varchar,
      "contact_address" varchar,
      "policies_cancellation_policy" jsonb,
      "policies_privacy_policy" jsonb,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "cms"."_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
  `);

  // Foreign keys
  await client.query(`
    ALTER TABLE "cms"."rooms_gallery" ADD CONSTRAINT "rooms_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "cms"."rooms_gallery" ADD CONSTRAINT "rooms_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."rooms"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."rooms_amenities" ADD CONSTRAINT "rooms_amenities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."rooms"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."rooms" ADD CONSTRAINT "rooms_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "cms"."rooms_locales" ADD CONSTRAINT "rooms_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."rooms"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."experiences_gallery" ADD CONSTRAINT "experiences_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "cms"."experiences_gallery" ADD CONSTRAINT "experiences_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."experiences"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."experiences" ADD CONSTRAINT "experiences_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "cms"."experiences_locales" ADD CONSTRAINT "experiences_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."experiences"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."gallery" ADD CONSTRAINT "gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "cms"."gallery_locales" ADD CONSTRAINT "gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."gallery"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."pages" ADD CONSTRAINT "pages_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "cms"."pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."pages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."blog_posts_tags" ADD CONSTRAINT "blog_posts_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."blog_posts" ADD CONSTRAINT "blog_posts_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "cms"."blog_posts_locales" ADD CONSTRAINT "blog_posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."media"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."users"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rooms_fk" FOREIGN KEY ("rooms_id") REFERENCES "cms"."rooms"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_experiences_fk" FOREIGN KEY ("experiences_id") REFERENCES "cms"."experiences"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gallery_fk" FOREIGN KEY ("gallery_id") REFERENCES "cms"."gallery"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "cms"."pages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_posts_fk" FOREIGN KEY ("blog_posts_id") REFERENCES "cms"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "cms"."media"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "cms"."users"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "cms"."users"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "cms"."settings" ADD CONSTRAINT "settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "cms"."settings" ADD CONSTRAINT "settings_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "cms"."settings_locales" ADD CONSTRAINT "settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."settings"("id") ON DELETE cascade ON UPDATE no action;
  `);

  // Indexes
  await client.query(`
    CREATE INDEX "rooms_gallery_order_idx" ON "cms"."rooms_gallery" USING btree ("_order");
    CREATE INDEX "rooms_gallery_parent_id_idx" ON "cms"."rooms_gallery" USING btree ("_parent_id");
    CREATE INDEX "rooms_gallery_image_idx" ON "cms"."rooms_gallery" USING btree ("image_id");
    CREATE INDEX "rooms_amenities_order_idx" ON "cms"."rooms_amenities" USING btree ("_order");
    CREATE INDEX "rooms_amenities_parent_id_idx" ON "cms"."rooms_amenities" USING btree ("_parent_id");
    CREATE INDEX "rooms_amenities_locale_idx" ON "cms"."rooms_amenities" USING btree ("_locale");
    CREATE UNIQUE INDEX "rooms_slug_idx" ON "cms"."rooms" USING btree ("slug");
    CREATE UNIQUE INDEX "rooms_artax_room_type_id_idx" ON "cms"."rooms" USING btree ("artax_room_type_id");
    CREATE INDEX "rooms_featured_image_idx" ON "cms"."rooms" USING btree ("featured_image_id");
    CREATE INDEX "rooms_updated_at_idx" ON "cms"."rooms" USING btree ("updated_at");
    CREATE INDEX "rooms_created_at_idx" ON "cms"."rooms" USING btree ("created_at");
    CREATE UNIQUE INDEX "rooms_locales_locale_parent_id_unique" ON "cms"."rooms_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX "experiences_gallery_order_idx" ON "cms"."experiences_gallery" USING btree ("_order");
    CREATE INDEX "experiences_gallery_parent_id_idx" ON "cms"."experiences_gallery" USING btree ("_parent_id");
    CREATE INDEX "experiences_gallery_image_idx" ON "cms"."experiences_gallery" USING btree ("image_id");
    CREATE UNIQUE INDEX "experiences_slug_idx" ON "cms"."experiences" USING btree ("slug");
    CREATE INDEX "experiences_featured_image_idx" ON "cms"."experiences" USING btree ("featured_image_id");
    CREATE INDEX "experiences_updated_at_idx" ON "cms"."experiences" USING btree ("updated_at");
    CREATE INDEX "experiences_created_at_idx" ON "cms"."experiences" USING btree ("created_at");
    CREATE UNIQUE INDEX "experiences_locales_locale_parent_id_unique" ON "cms"."experiences_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX "gallery_image_idx" ON "cms"."gallery" USING btree ("image_id");
    CREATE INDEX "gallery_updated_at_idx" ON "cms"."gallery" USING btree ("updated_at");
    CREATE INDEX "gallery_created_at_idx" ON "cms"."gallery" USING btree ("created_at");
    CREATE UNIQUE INDEX "gallery_locales_locale_parent_id_unique" ON "cms"."gallery_locales" USING btree ("_locale","_parent_id");
    CREATE UNIQUE INDEX "pages_slug_idx" ON "cms"."pages" USING btree ("slug");
    CREATE INDEX "pages_featured_image_idx" ON "cms"."pages" USING btree ("featured_image_id");
    CREATE INDEX "pages_updated_at_idx" ON "cms"."pages" USING btree ("updated_at");
    CREATE INDEX "pages_created_at_idx" ON "cms"."pages" USING btree ("created_at");
    CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "cms"."pages_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX "blog_posts_tags_order_idx" ON "cms"."blog_posts_tags" USING btree ("_order");
    CREATE INDEX "blog_posts_tags_parent_id_idx" ON "cms"."blog_posts_tags" USING btree ("_parent_id");
    CREATE UNIQUE INDEX "blog_posts_slug_idx" ON "cms"."blog_posts" USING btree ("slug");
    CREATE INDEX "blog_posts_featured_image_idx" ON "cms"."blog_posts" USING btree ("featured_image_id");
    CREATE INDEX "blog_posts_updated_at_idx" ON "cms"."blog_posts" USING btree ("updated_at");
    CREATE INDEX "blog_posts_created_at_idx" ON "cms"."blog_posts" USING btree ("created_at");
    CREATE UNIQUE INDEX "blog_posts_locales_locale_parent_id_unique" ON "cms"."blog_posts_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX "media_updated_at_idx" ON "cms"."media" USING btree ("updated_at");
    CREATE INDEX "media_created_at_idx" ON "cms"."media" USING btree ("created_at");
    CREATE UNIQUE INDEX "media_filename_idx" ON "cms"."media" USING btree ("filename");
    CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "cms"."media" USING btree ("sizes_thumbnail_filename");
    CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "cms"."media" USING btree ("sizes_card_filename");
    CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "cms"."media" USING btree ("sizes_hero_filename");
    CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "cms"."media_locales" USING btree ("_locale","_parent_id");
    CREATE UNIQUE INDEX "payload_kv_key_idx" ON "cms"."payload_kv" USING btree ("key");
    CREATE INDEX "users_sessions_order_idx" ON "cms"."users_sessions" USING btree ("_order");
    CREATE INDEX "users_sessions_parent_id_idx" ON "cms"."users_sessions" USING btree ("_parent_id");
    CREATE INDEX "users_updated_at_idx" ON "cms"."users" USING btree ("updated_at");
    CREATE INDEX "users_created_at_idx" ON "cms"."users" USING btree ("created_at");
    CREATE UNIQUE INDEX "users_email_idx" ON "cms"."users" USING btree ("email");
    CREATE INDEX "payload_locked_documents_global_slug_idx" ON "cms"."payload_locked_documents" USING btree ("global_slug");
    CREATE INDEX "payload_locked_documents_updated_at_idx" ON "cms"."payload_locked_documents" USING btree ("updated_at");
    CREATE INDEX "payload_locked_documents_created_at_idx" ON "cms"."payload_locked_documents" USING btree ("created_at");
    CREATE INDEX "payload_locked_documents_rels_order_idx" ON "cms"."payload_locked_documents_rels" USING btree ("order");
    CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "cms"."payload_locked_documents_rels" USING btree ("parent_id");
    CREATE INDEX "payload_locked_documents_rels_path_idx" ON "cms"."payload_locked_documents_rels" USING btree ("path");
    CREATE INDEX "payload_locked_documents_rels_rooms_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("rooms_id");
    CREATE INDEX "payload_locked_documents_rels_experiences_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("experiences_id");
    CREATE INDEX "payload_locked_documents_rels_gallery_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("gallery_id");
    CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("pages_id");
    CREATE INDEX "payload_locked_documents_rels_blog_posts_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("blog_posts_id");
    CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("media_id");
    CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "cms"."payload_locked_documents_rels" USING btree ("users_id");
    CREATE INDEX "payload_preferences_key_idx" ON "cms"."payload_preferences" USING btree ("key");
    CREATE INDEX "payload_preferences_updated_at_idx" ON "cms"."payload_preferences" USING btree ("updated_at");
    CREATE INDEX "payload_preferences_created_at_idx" ON "cms"."payload_preferences" USING btree ("created_at");
    CREATE INDEX "payload_preferences_rels_order_idx" ON "cms"."payload_preferences_rels" USING btree ("order");
    CREATE INDEX "payload_preferences_rels_parent_idx" ON "cms"."payload_preferences_rels" USING btree ("parent_id");
    CREATE INDEX "payload_preferences_rels_path_idx" ON "cms"."payload_preferences_rels" USING btree ("path");
    CREATE INDEX "payload_preferences_rels_users_id_idx" ON "cms"."payload_preferences_rels" USING btree ("users_id");
    CREATE INDEX "payload_migrations_updated_at_idx" ON "cms"."payload_migrations" USING btree ("updated_at");
    CREATE INDEX "payload_migrations_created_at_idx" ON "cms"."payload_migrations" USING btree ("created_at");
    CREATE INDEX "settings_logo_idx" ON "cms"."settings" USING btree ("logo_id");
    CREATE INDEX "settings_favicon_idx" ON "cms"."settings" USING btree ("favicon_id");
    CREATE UNIQUE INDEX "settings_locales_locale_parent_id_unique" ON "cms"."settings_locales" USING btree ("_locale","_parent_id");
  `);

  console.log('[init-db] All CMS tables created successfully.');

  // Incremental schema updates (new fields added after initial deploy)
  await applyIncrementalUpdates(client);

  await client.end();
}

async function applyIncrementalUpdates(client) {
  // v2: rooms_artax_category_ids table (added for CMS-Artax mapping)
  const check = await client.query(
    `SELECT COUNT(*) as c FROM information_schema.tables WHERE table_schema = 'cms' AND table_name = 'rooms_artax_category_ids'`
  );
  if (parseInt(check.rows[0].c, 10) === 0) {
    console.log('[init-db] Creating rooms_artax_category_ids table...');
    await client.query(`
      CREATE TABLE "cms"."rooms_artax_category_ids" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "category_id" numeric NOT NULL
      );
      CREATE INDEX "rooms_artax_category_ids_order_idx" ON "cms"."rooms_artax_category_ids" USING btree ("_order");
      CREATE INDEX "rooms_artax_category_ids_parent_id_idx" ON "cms"."rooms_artax_category_ids" USING btree ("_parent_id");
      ALTER TABLE "cms"."rooms_artax_category_ids" ADD CONSTRAINT "rooms_artax_category_ids_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "cms"."rooms"("id") ON DELETE cascade ON UPDATE no action;
    `);
    console.log('[init-db] rooms_artax_category_ids created.');
  } else {
    console.log('[init-db] rooms_artax_category_ids already exists.');
  }
}

run().catch((err) => {
  console.error('[init-db] Failed:', err.message);
  process.exit(1);
});
