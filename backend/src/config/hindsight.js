/**
 * Hindsight Cloud Memory Configuration
 * Keeps API secrets strictly server-side.
 */

const HINDSIGHT_API_KEY = process.env.HINDSIGHT_API_KEY || '';
const HINDSIGHT_BASE_URL = (process.env.HINDSIGHT_BASE_URL || 'https://api.hindsight.vectorize.io').replace(/\/$/, '');
const HINDSIGHT_MEMORY_BANK = process.env.HINDSIGHT_MEMORY_BANK || 'Meeting Prep Agent';

const isConfigured = Boolean(HINDSIGHT_API_KEY && HINDSIGHT_API_KEY.trim());

module.exports = {
  HINDSIGHT_API_KEY,
  HINDSIGHT_BASE_URL,
  HINDSIGHT_MEMORY_BANK,
  isConfigured
};
