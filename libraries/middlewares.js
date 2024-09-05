import express from 'express';

const injectMiddleware = (api) => {
  api.use(express.json({ limit: '250mb' }));
};

export default injectMiddlewares
