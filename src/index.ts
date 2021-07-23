import * as dotenv from 'dotenv';
import setup from './app';

dotenv.config();
if (!process.env.PORT) {
  console.error('The PORT environment variable must be defined');
  process.exit(1);
}

const PORT: number = parseInt(process.env.PORT as string, 10);

async function run(): Promise<void> {
  const app = await setup();
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
}

run()
  .then(() => {
    console.log('started');
  })
  .catch((err) => {
    console.log(err);
  });
