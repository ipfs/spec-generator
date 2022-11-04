
import express from 'express';

export default function runServer (dir, port = 8023) {
  const app = express();
  app.use(express.static(dir));
  return app.listen(port);
}
