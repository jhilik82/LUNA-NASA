import { createLunaServer, listen, loadEnvironment } from '../backend/server.mjs';
await loadEnvironment();
// npm.cmd run multiplayer (or LUNA_MULTIPLAYER=true, e.g. on an online host) lets other devices join crew missions.
const shared = process.argv.includes('--multiplayer') || process.env.LUNA_MULTIPLAYER === 'true';
const { server } = await createLunaServer({ shared });
await listen(server, undefined, { shared });
process.once('SIGINT', () => server.close(() => process.exit(0)));
process.once('SIGTERM', () => server.close(() => process.exit(0)));
