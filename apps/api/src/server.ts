import { createApp } from "./app";
import { config } from "./lib/config";

const app = createApp();

app.listen(config.port, () => {
  console.log(`ATM API listening on port ${config.port}`);
});
