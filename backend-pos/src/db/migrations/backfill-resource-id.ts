import { db } from '@/db';
import { resources, rolePermissions } from '@/db/schema';
import { sql } from 'drizzle-orm';

async function backfillResourceIds() {
  console.log('Starting resource_id backfill...');

  // 1. Insert missing resources from role_permissions into resources
  console.log('Inserting missing resources...');
  const missingResources = await db.execute(sql`
    INSERT INTO resources (id, name, is_active, created_at, updated_at)
    SELECT gen_random_uuid(), rp.resource, true, NOW(), NOW()
    FROM role_permissions rp
    WHERE rp.resource NOT IN (SELECT name FROM resources)
    GROUP BY rp.resource
    ON CONFLICT (name) DO NOTHING
    RETURNING name
  `);
  console.log(`Inserted ${missingResources.rowCount} missing resources`);

  // 2. Backfill resource_id by matching resource name
  console.log('Backfilling resource_id...');
  const updateResult = await db.execute(sql`
    UPDATE role_permissions rp
    SET resource_id = r.id
    FROM resources r
    WHERE r.name = rp.resource
      AND rp.resource_id IS NULL
  `);
  console.log(`Backfilled ${updateResult.rowCount} role_permissions rows`);

  // 3. Verify no NULL resource_id remains
  const nullCount = await db.execute(sql`
    SELECT COUNT(*) as count FROM role_permissions WHERE resource_id IS NULL
  `);
  const remainingNulls = Number(nullCount.rows[0]?.count || 0);

  if (remainingNulls > 0) {
    console.error(`ERROR: ${remainingNulls} rows still have NULL resource_id`);
    process.exit(1);
  }

  console.log('✅ Backfill completed successfully!');
}

backfillResourceIds().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
