import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GeoLocation } from '../entities/GeoLocation.js';
import { DataSource as GeoDataSource } from '../entities/DataSource.js';
config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    synchronize: false,
    logging: true,
    entities: [GeoLocation, GeoDataSource],
    subscribers: [],
    migrations: [join(__dirname, '../migrations/*.{ts,js}')],
});
//# sourceMappingURL=database.js.map