const app = require('./src/interfaces/http/app');
const config = require('./src/config');
const { sequelize, testConnection } = require('./src/infrastructure/database/sequelize');

async function bootstrap() {
    console.log('Bootstrapping backend service...');

    // Test database connection on startup
    const dbHealth = await testConnection();
    console.log(dbHealth.message);

    if (dbHealth.connected) {
        try {
            console.log('Synchronizing database models...');
            await sequelize.sync();
            console.log('Database schema synchronized successfully.');
        } catch (syncError) {
            console.error('Failed to sync database models:', syncError);
        }
    }

    // Start HTTP server
    app.listen(config.port, () => {
        console.log(`Server is running in environment: development`);
        console.log(`Listening at http://localhost:${config.port}`);
        console.log(`Health endpoint: http://localhost:${config.port}/api/health`);
    });
}

bootstrap().catch((err) => {
    console.error('Fatal initialization error:', err);
    process.exit(1);
});