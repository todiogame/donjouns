
try {
    const { GameState } = require('./server/models/GameState');
    console.log("GameState loaded successfully");
    const BotAI = require('./server/controllers/BotAI');
    console.log("BotAI loaded successfully");
    console.log("Syntax check passed");
} catch (e) {
    console.error("Error loading modules:", e);
}
