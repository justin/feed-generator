import { Kysely, Migration, MigrationProvider } from 'kysely'
import { seedFeed } from './seed'
import { DatabaseSchema } from './schema'

const migrations: Record<string, Migration> = {}

export const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations
  },
}

migrations['001'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable('post')
      .addColumn('uri', 'varchar', (col) => col.primaryKey())
      .addColumn('cid', 'varchar', (col) => col.notNull())
      .addColumn('replyParent', 'varchar')
      .addColumn('replyRoot', 'varchar')
      .addColumn('indexedAt', 'varchar', (col) => col.notNull())
      .execute()
    await db.schema
      .createTable('sub_state')
      .addColumn('service', 'varchar', (col) => col.primaryKey())
      .addColumn('cursor', 'integer', (col) => col.notNull())
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropTable('post').execute()
    await db.schema.dropTable('sub_state').execute()
  },
}

migrations['002'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .alterTable('post')
      .addColumn('author', 'varchar', (col) => col.notNull().defaultTo(''))
      .execute()

    await db
      .deleteFrom('post' as any)
      .where('author' as any, 'is', '')
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.alterTable('post').dropColumn('author').execute()
  },
}

migrations['003'] = {
  async up(db: Kysely<DatabaseSchema>) {
    console.log('Seeding feed')
    await seedFeed(db)
  },
  async down(db: Kysely<unknown>) {},
}

migrations['004'] = {
  async up(db: Kysely<DatabaseSchema>) {
    console.log('Adding index on post.author')
    await db.schema
      .createIndex('idx_post_author')
      .on('post')
      .column('author')
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropIndex('idx_post_author').execute()
  },
}
