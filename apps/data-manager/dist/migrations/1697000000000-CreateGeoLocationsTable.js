export class CreateGeoLocationsTable1697000000000 {
    async up(queryRunner) {
        // Create new geo_locations table
        await queryRunner.query(`
            CREATE TABLE "geo_locations" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" varchar(255) NOT NULL,
                "locationType" varchar(100) NOT NULL,
                "location" geometry(Point, 4326) NOT NULL,
                "properties" jsonb,
                "source" varchar(100) NOT NULL,
                "sourceId" varchar(255),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
        // Create spatial index
        await queryRunner.query(`
            CREATE INDEX "idx_geo_locations_location" ON "geo_locations" USING GIST ("location")
        `);
        // Migrate existing data from mineral_deposits
        await queryRunner.query(`
            INSERT INTO "geo_locations" (
                "name", 
                "locationType", 
                "location", 
                "properties", 
                "source", 
                "sourceId", 
                "createdAt", 
                "updatedAt"
            )
            SELECT 
                "name",
                'mineral_deposit',
                "location",
                jsonb_build_object(
                    'depositType', "depositType",
                    'commodities', "commodities",
                    'properties', "properties"
                ),
                "source",
                "sourceId",
                "createdAt",
                "updatedAt"
            FROM "mineral_deposits"
        `);
        // Drop old table
        await queryRunner.query(`DROP TABLE "mineral_deposits"`);
    }
    async down(queryRunner) {
        // Recreate mineral_deposits table
        await queryRunner.query(`
            CREATE TABLE "mineral_deposits" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" varchar(255) NOT NULL,
                "depositType" varchar(100),
                "commodities" varchar(100),
                "location" geometry(Point, 4326) NOT NULL,
                "properties" jsonb,
                "source" varchar(100),
                "sourceId" varchar(255),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
        // Migrate data back
        await queryRunner.query(`
            INSERT INTO "mineral_deposits" (
                "name",
                "depositType",
                "commodities",
                "location",
                "properties",
                "source",
                "sourceId",
                "createdAt",
                "updatedAt"
            )
            SELECT 
                "name",
                "properties"->>'depositType',
                "properties"->>'commodities',
                "location",
                "properties"->'properties',
                "source",
                "sourceId",
                "createdAt",
                "updatedAt"
            FROM "geo_locations"
            WHERE "locationType" = 'mineral_deposit'
        `);
        // Drop new table
        await queryRunner.query(`DROP TABLE "geo_locations"`);
    }
}
//# sourceMappingURL=1697000000000-CreateGeoLocationsTable.js.map