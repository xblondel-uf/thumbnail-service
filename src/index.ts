/**
 * Start the application with the PORT and DB_PATH parameters defined in the environment.
 */
import * as dotenv from 'dotenv';
import setup from './app';

dotenv.config();
if (!process.env.PORT) {
  console.error('The PORT environment variable must be defined');
  process.exit(1);
}
const PORT: number = parseInt(process.env.PORT as string, 10);
if (!process.env.DB_PATH) {
  console.error('The DB_PATH environment variable must be defined');
  process.exit(1);
}

const DB_PATH = process.env.DB_PATH as string;

async function run(): Promise<void> {
  const app = await setup(DB_PATH);
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
}

run()
  .then(() => {
    console.log('started');
  })
  .catch((err) => {
    console.error(err);
  });
