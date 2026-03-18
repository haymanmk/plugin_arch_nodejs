/**
 * Plugin Example
 *
 * This is a sample plugin that demonstrates how to implement the Plugin interface.
 * It registers a simple command and listens to a hook.
 */
import { Plugin, PluginContext, PluginMetadata } from '../../types/plugin';
declare class ExamplePlugin implements Plugin {
    metadata: PluginMetadata;
    initialize(context: PluginContext): Promise<void>;
}
declare const _default: ExamplePlugin;
export default _default;
//# sourceMappingURL=index.d.ts.map