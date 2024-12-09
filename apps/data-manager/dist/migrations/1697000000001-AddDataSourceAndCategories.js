export class AddDataSourceAndCategories1697000000001 {
    async up(queryRunner) {
        // Create data_sources table
        await queryRunner.query(`
            CREATE TABLE "data_sources" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" varchar(100) NOT NULL UNIQUE,
                "description" varchar(255) NOT NULL,
                "url" varchar(255),
                "config" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
        // Add USGS as initial data source
        await queryRunner.query(`
            INSERT INTO "data_sources" (
                "name",
                "description",
                "url"
            ) VALUES (
                'USGS',
                'United States Geological Survey Mineral Resources Data',
                'https://mrdata.usgs.gov/'
            ) RETURNING id
        `);
        // Get the USGS data source ID
        const result = await queryRunner.query(`SELECT id FROM "data_sources" WHERE name = 'USGS'`);
        const usgsSourceId = result[0].id;
        // Add new columns to geo_locations
        await queryRunner.query(`
            ALTER TABLE "geo_locations"
            ADD COLUMN "category" varchar(100),
            ADD COLUMN "subcategory" varchar(100),
            ADD COLUMN "dataSourceId" uuid
        `);
        // Update existing records
        await queryRunner.query(`
            UPDATE "geo_locations"
            SET 
                "category" = 'mineral_deposit',
                "subcategory" = "properties"->>'depositType',
                "dataSourceId" = $1
            WHERE "source" = 'USGS'
        `, [usgsSourceId]);
        // Make columns not nullable after data migration
        await queryRunner.query(`
            ALTER TABLE "geo_locations"
            ALTER COLUMN "category" SET NOT NULL,
            ALTER COLUMN "subcategory" SET NOT NULL,
            ALTER COLUMN "dataSourceId" SET NOT NULL
        `);
        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "geo_locations"
            ADD CONSTRAINT "FK_geo_locations_data_source"
            FOREIGN KEY ("dataSourceId")
            REFERENCES "data_sources"("id")
            ON DELETE CASCADE
        `);
        // Drop old source column as it's replaced by the relation
        await queryRunner.query(`
            ALTER TABLE "geo_locations"
            DROP COLUMN "source"
        `);
    }
    async down(queryRunner) {
        // Add back the source column
        await queryRunner.query(`
            ALTER TABLE "geo_locations"
            ADD COLUMN "source" varchar(100)
        `);
        // Migrate data back
        await queryRunner.query(`
            UPDATE "geo_locations" gl
            SET "source" = ds.name
            FROM "data_sources" ds
            WHERE gl."dataSourceId" = ds.id
        `);
        // Drop the foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "geo_locations"
            DROP CONSTRAINT "FK_geo_locations_data_source"
        `);
        // Drop the new columns
        await queryRunner.query(`
            ALTER TABLE "geo_locations"
            DROP COLUMN "category",
            DROP COLUMN "subcategory",
            DROP COLUMN "dataSourceId"
        `);
        // Drop the data_sources table
        await queryRunner.query(`DROP TABLE "data_sources"`);
    }
}
//# sourceMappingURL=1697000000001-AddDataSourceAndCategories.js.map