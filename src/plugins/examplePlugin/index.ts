/**
 * Plugin Example
 * 
 * This is a sample plugin that demonstrates how to implement the Plugin interface.
 * It registers a simple command and listens to a hook.
 */

import { Plugin, PluginContext, PluginMetadata } from '../../types/plugin';

const metadata: PluginMetadata = {
  name: 'example-plugin',
  version: '1.0.0',
  description: 'A simple example plugin that demonstrates basic functionality.',
};

class ExamplePlugin implements Plugin {
  public metadata = metadata;

  public async initialize(context: PluginContext): Promise<void> {
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
    hooks.register<unknown>('example-hook', async (data) => {
      logger.info(`Received data on example-hook: ${JSON.stringify(data)}`);
    });
  }
}

export default new ExamplePlugin();