import setup from './app';

const PORT: number = parseInt(process.env.PORT as string, 10);

async function run(): Promise<void> {
  const app = await setup();
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
}
