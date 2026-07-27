import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { chatbotPlugin } from './plugins/chatbotPlugin';
import { navModule } from './modules/nav';

export default createApp({
  features: [catalogPlugin, chatbotPlugin, navModule],
});
