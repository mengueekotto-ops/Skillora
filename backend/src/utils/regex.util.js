/**
 * Build a case-insensitive "contains" RegExp from untrusted text.
 * Escaping stops users from injecting regex syntax (e.g. catastrophic
 * backtracking patterns that would freeze the server), and the length cap
 * keeps queries cheap.
 */
const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const safeRegex = (text, maxLength = 100) => new RegExp(escapeRegex(String(text).slice(0, maxLength)), "i");

module.exports = { escapeRegex, safeRegex };
