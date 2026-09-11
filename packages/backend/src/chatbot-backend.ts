import express from 'express';
import { coreServices, createBackendPlugin } from '@backstage/backend-plugin-api';
import { CatalogService } from './catalogService';
// import { OpenAIService } from './openaiService';
import { GeminiService } from './geminiService';
import { buildCatalogPrompt } from './promptBuilder';
import { RedisService } from './redisService';

type ChatbotQueryRequest = {
    sessionId?: string;
    question: string;
};

type ChatbotQueryResponse = {
    answer: string;
};

export type ChatHistoryMessage = {
    role: 'user' | 'assistant';
    content: string;
};

const sessionHistory = new Map<string, ChatHistoryMessage[]>();

function getSessionHistory(sessionId: string): ChatHistoryMessage[] {
    return sessionHistory.get(sessionId) ?? [];
}

function addSessionHistoryMessage(sessionId: string, message: ChatHistoryMessage) {
    const history = getSessionHistory(sessionId);
    history.push(message);
    while (history.length > 10) {
        history.shift();
    }
    sessionHistory.set(sessionId, history);
}

type ErrorResponse = {
    error: string;
    details?: string;
};

function validateChatbotQueryBody(body: unknown): body is ChatbotQueryRequest {
    return (
        typeof body === 'object' &&
        body !== null &&
        typeof (body as Record<string, unknown>).question === 'string' &&
        (body as Record<string, string>).question.trim().length > 0
    );
}

export default createBackendPlugin({
    pluginId: 'chatbot',
    register(reg) {
        reg.registerInit({
            deps: {
                httpRouter: coreServices.httpRouter,
                discovery: coreServices.discovery,
                logger: coreServices.logger,
                rootConfig: coreServices.rootConfig,
                auth: coreServices.auth, // add this
            },
            async init({ httpRouter, discovery, logger, rootConfig, auth }) {
                const router = express.Router();
                // const catalogService = new CatalogService(discovery, auth, logger); // pass auth
            const redisService = new RedisService();

            const catalogService = new CatalogService(
                discovery,
                auth,
                logger,
                redisService,
            );
                // const openaiService = new OpenAIService(rootConfig);
                const geminiService = new GeminiService(rootConfig);

                httpRouter.addAuthPolicy({
                    path: '/',
                    allow: 'unauthenticated',
                });
                httpRouter.addAuthPolicy({
                    path: '/message',
                    allow: 'unauthenticated',
                });
                httpRouter.addAuthPolicy({
                    path: '/query',
                    allow: 'unauthenticated',
                });

                router.get('/', (_req, res) => {
                    res.json({ message: 'Chatbot backend is running' });
                });

                router.post('/message', express.json(), (req, res) => {
                    const userMessage = req.body?.message ?? '';
                    logger.info(`chatbot-backend received message: ${userMessage}`);
                    res.json({ reply: `Echo: ${userMessage}` });
                });

                router.post(
                    '/query',
                    express.json(),
                    async (req, res: express.Response<ChatbotQueryResponse | ErrorResponse>) => {
                        const body = req.body;
                        const sessionId = typeof body.sessionId === 'string' && body.sessionId.trim().length > 0
                            ? body.sessionId.trim()
                            : 'default';

                        if (!validateChatbotQueryBody(body)) {
                            return res.status(400).json({
                                error: 'Invalid request body',
                                details: 'Request must contain a non-empty string `question` field',
                            });
                        }

                        try {
                            console.log("Step 1");
                            addSessionHistoryMessage(sessionId, { role: 'user', content: body.question });
                            console.log("Step 2");
                            const entities = await catalogService.getRelevantEntities(body.question);
                            console.log("Step 3");
                            const history = getSessionHistory(sessionId);
                            console.log("Step 4");
                            const prompt = buildCatalogPrompt(body.question, entities, history);
                            console.log("Step 5");
                            // const answer = await openaiService.generate(prompt);
                            const answer = await geminiService.generate(prompt);
                            console.log("Step 6");
                            addSessionHistoryMessage(sessionId, { role: 'assistant', content: answer });

                            return res.json({ answer });
                        } catch (error) {
                            logger.error(
                                'Error handling chatbot query',
                                error instanceof Error ? error : { error: String(error) },
                            );
                            return res.status(500).json({
                                error: 'Internal server error',
                                details: 'Unable to answer the chatbot query',
                            });
                        }
                    },
                );

                httpRouter.use(router);
            },
        });
    },
});


