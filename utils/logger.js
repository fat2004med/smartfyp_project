import SystemLog from "../models/SystemLog.js";

export const logEvent = async ({ level = "Info", event, user = "System", details, ip = "Internal" }) => {
  try {
    await SystemLog.create({ level, event, user, details, ip });
    console.log(`[Log ${level}] ${event} by ${user} - Details: ${details}`);
  } catch (error) {
    console.error("System Log Creation Failed:", error.message);
  }
};
