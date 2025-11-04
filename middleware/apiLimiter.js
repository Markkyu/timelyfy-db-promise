const rateLimit = require("express-rate-limit");

// Limiter for login
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: { message: "Too many requests, please try again in a minute." },
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: { message: "Too many refresh requests, try again later" },
});

module.exports = { loginLimiter, apiLimiter };
