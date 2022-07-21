import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
	clean: true,
	dts: true,
	entry: ['src/**/*.ts'],
	format: ['esm'],
	minify: false,
	watch: options.watch,
	skipNodeModulesBundle: true,
	sourcemap: true,
	target: 'esnext',
	tsconfig: 'tsconfig.json',
	bundle: false,
	shims: false,
	keepNames: true,
	splitting: false,
	silent: options.silent,
}));
