import { ExtractExecutorSchema } from './schema';
import executor from './executor';

const options: ExtractExecutorSchema = {};

describe('Extract Executor', () => {
  it('can run', async () => {
    const output = await executor(options);
    expect(output.success).toBe(true);
  });
});