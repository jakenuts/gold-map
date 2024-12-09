import { AppDataSource } from './config/database.js';
async function runMigrations() {
    try {
        await AppDataSource.initialize();
        console.log('Database connection initialized');
        await AppDataSource.runMigrations();
        console.log('Migrations completed successfully');
        await AppDataSource.destroy();
        console.log('Database connection closed');
    }
    catch (error) {
        console.error('Error running migrations:', error);
        process.exit(1);
    }
}
runMigrations();
//# sourceMappingURL=run-migrations.js.map