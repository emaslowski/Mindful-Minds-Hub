import app from "./app";
import { logger } from "./lib/logger";
import { runSeed } from "./lib/seed";
import { ensureStudioVideoProductions } from "./lib/studioVideoMigration";
import { repairOrphanedEditorialAssignments } from "./lib/editorialRouting";
import { ensurePlantJournal } from "./lib/plantJournalMigration";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

ensurePlantJournal().then(ensureStudioVideoProductions).then(repairOrphanedEditorialAssignments).then(() => app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Run seed asynchronously after startup (creates default jobs, teams, teacher account)
  runSeed().catch((seedErr) => logger.error({ err: seedErr }, "Seed failed"));
})).catch((err) => {
  logger.error({ err }, 'Could not initialize Studio workflows');
  process.exit(1);
});
