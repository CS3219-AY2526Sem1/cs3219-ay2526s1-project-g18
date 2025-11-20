import app from './app.js';
import config from './config/config.js';
app.listen(config.serverPort, () => {
    console.log(`PeerPrep Question Service is running on port ${config.serverPort}`);
});
//# sourceMappingURL=index.js.map