import { createLunaServer, listen, loadEnvironment } from '../backend/server.mjs';
await loadEnvironment();
const { server } = await createLunaServer();
await listen(server);
process.once('SIGINT', () => server.close(() => process.exit(0)));
process.once('SIGTERM', () => server.close(() => process.exit(0)));
