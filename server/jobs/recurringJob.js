const { generateDueTransactionsAllUsers } = require('../services/recurringService');

/**
 * Runs generateDueTransactionsAllUsers on an interval. Called once from server.js.
 * Uses setInterval rather than a cron dependency to keep the deployment footprint
 * small (works fine on a single Render instance).
 */
const startRecurringJob = () => {
  const RUN_EVERY_MS = 60 * 60 * 1000; // hourly

  const run = async () => {
    try {
      const created = await generateDueTransactionsAllUsers();
      if (created > 0) {
        console.log(`[recurringJob] Generated ${created} due recurring transaction(s)`);
      }
    } catch (error) {
      console.error(`[recurringJob] Error: ${error.message}`);
    }
  };

  run(); // run once on boot
  setInterval(run, RUN_EVERY_MS);
};

module.exports = { startRecurringJob };
