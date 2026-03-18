"use strict";
/**
 * Plugin Example
 *
 * This is a sample plugin that demonstrates how to implement the Plugin interface.
 * It registers a simple command and listens to a hook.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const metadata = {
    name: 'example-plugin',
    version: '1.0.0',
    description: 'A simple example plugin that demonstrates basic functionality.',
};
class ExamplePlugin {
    constructor() {
        this.metadata = metadata;
    }
    async initialize(context) {
        const { logger, hooks, program } = context;
        logger.info('Initializing ExamplePlugin');
        // Register a simple command
        program
            .command('example')
            .description('Run the example command')
            .action(() => {
            logger.info('Example command executed!');
        });
        // Listen to a hook (for demonstration)
        hooks.register('example-hook', async (data) => {
            logger.info(`Received data on example-hook: ${JSON.stringify(data)}`);
        });
    }
}
exports.default = new ExamplePlugin();
//# sourceMappingURL=index.js.map