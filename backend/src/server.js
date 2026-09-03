import { buildApp } from './app.js';
import { config } from './config.js';

async function start() {
  const app = buildApp();

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log('\n✅ Procurement MVP Backend Started');
    console.log(`   API: http://localhost:${config.port}`);
    console.log(`   Swagger UI: http://localhost:${config.port}/api-docs`);
    console.log(`   OpenAPI JSON: http://localhost:${config.port}/api-docs/json\n`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
