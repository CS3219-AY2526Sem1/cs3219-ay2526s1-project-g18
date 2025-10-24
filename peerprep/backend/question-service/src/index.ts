import app from './app.ts';
import config from './config/config.ts';

app.listen(config.serverPort, () => {
  console.log(`PeerPrep Question Service is running on port ${config.serverPort}`);
});