import './index';

// Listen to SIGUSR2 indicating hot updates:
import './signal';

// This is dumb but I don't understand how else to prevent process from exiting.
// If it exits, it will get restarted by nodemon, but then hot reloading won't work.
setInterval(() => {}, 1000);
