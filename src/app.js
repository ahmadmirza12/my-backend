import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import paymentsWebhookRouter from './routes/paymentsWebhook.routes.js';
import authRouter from './routes/auth.routes.js';
import productRouter from './routes/product.routes.js';
import adminRouter from './routes/admin.routes.js';
import orderRouter from './routes/order.routes.js';
import paymentsRouter from './routes/payments.routes.js';
import path from 'path';
import swaggerUiDist from 'swagger-ui-dist';
import { openapiSpec } from './docs/openapi.js';
const spec = {
  ...openapiSpec,
  servers: [
    { url: process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 8000}` }
  ]
}

const app = express();

app.use('/api/v1/payments', paymentsWebhookRouter);
app.use(express.json({ limit: '16kb' }));
app.use(
   cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
   })
);
app.use(express.static('public'));
app.use(cookieParser());
app.use(express.urlencoded({ limit: '16kb', extended: true }));

//routes

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/payments', paymentsRouter);
const swaggerAssetsPath = swaggerUiDist.getAbsoluteFSPath();
app.use('/docs', express.static(swaggerAssetsPath));
app.get('/docs/swagger-initializer.js', (req, res) => {
  const js = `window.onload = function() {\n  const ui = SwaggerUIBundle({\n    url: '/docs.json',\n    dom_id: '#swagger-ui',\n    deepLinking: true,\n    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],\n    layout: 'StandaloneLayout'\n  });\n  window.ui = ui;\n}`
  res.type('application/javascript').send(js)
})
app.get('/docs.json', (req, res) => {
  res.type('application/json').send(spec);
});

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.use((err, req, res, next) => {
   const code = err.status || 500
   res.status(code).json({ message: err.message || 'Server Error' })
})

export { app };
