import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';
describe('i18n-core e2e', () => {
  it('should create i18n-core', async (done) => {
    const plugin = uniq('i18n-core');
    ensureNxProject('@nx-plugins/core', 'dist/packages/i18n/core');
    await runNxCommandAsync(`generate @nx-plugins/core:i18n-core ${plugin}`);

    const result = await runNxCommandAsync(`build ${plugin}`);
    expect(result.stdout).toContain('Executor ran');

    done();
  });

  describe('--directory', () => {
    it('should create src in the specified directory', async (done) => {
      const plugin = uniq('i18n-core');
      ensureNxProject('@nx-plugins/core', 'dist/packages/i18n/core');
      await runNxCommandAsync(
        `generate @nx-plugins/core:i18n-core ${plugin} --directory subdir`
      );
      expect(() =>
        checkFilesExist(`libs/subdir/${plugin}/src/index.ts`)
      ).not.toThrow();
      done();
    });
  });

  describe('--tags', () => {
    it('should add tags to nx.json', async (done) => {
      const plugin = uniq('i18n-core');
      ensureNxProject('@nx-plugins/core', 'dist/packages/i18n/core');
      await runNxCommandAsync(
        `generate @nx-plugins/core:i18n-core ${plugin} --tags e2etag,e2ePackage`
      );
      const nxJson = readJson('nx.json');
      expect(nxJson.projects[plugin].tags).toEqual(['e2etag', 'e2ePackage']);
      done();
    });
  });
});
