import { mergeMailSettings, type MailSettings } from './booking-mail';
import { readJsonStore, writeJsonStore } from './cloud-kv';

let writeChain: Promise<void> = Promise.resolve();
let memory: MailSettings | null = null;

export async function getMailSettings(): Promise<MailSettings> {
  if (memory) return memory;
  const fromStore = await readJsonStore<Partial<MailSettings>>('mail');
  memory = fromStore ? mergeMailSettings(fromStore) : mergeMailSettings();
  return memory;
}

export async function saveMailSettings(next: MailSettings): Promise<MailSettings> {
  const run = writeChain.then(async () => {
    const settings = mergeMailSettings(next);
    memory = settings;
    await writeJsonStore('mail', settings);
    return settings;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
