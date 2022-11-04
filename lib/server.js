
import express from 'express';
import SSE from 'express-sse';
import compression from 'compression';

export default function runServer (dir, port = 8023) {
  const app = express();
  const sse = new SSE();
  // You might wonder "why use compression for a purely local and basic system?"
  // express-sse expects res.flush() which compression provides
  app.use(compression());
  app.use(express.static(dir));
  app.get('/ipseity', sse.init);
  app.listen(port);
  return () => sse.send('refresh');
}
