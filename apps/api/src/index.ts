import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);

createApp().then((app) => {
  app.listen({ port, host: '0.0.0.0' }, (err) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
  });
});
