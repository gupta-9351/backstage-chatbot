import ChatIcon from '@material-ui/icons/Chat';
import {
  PageBlueprint,
  createFrontendPlugin,
  createRouteRef,
} from '@backstage/frontend-plugin-api';

export const chatbotRouteRef = createRouteRef();

export const chatbotPlugin = createFrontendPlugin({
  pluginId: 'chatbot',
  title: 'Catalog Chatbot',
  icon: <ChatIcon />,
  routes: {
    root: chatbotRouteRef,
  },
  extensions: [
    PageBlueprint.make({
      params: {
        path: '/chatbot',
        title: 'Catalog Chatbot',
        icon: <ChatIcon />,
        routeRef: chatbotRouteRef,
        loader: () => import('./ChatbotPage').then(m => <m.ChatbotPage />),
      },
    }),
  ],
});
