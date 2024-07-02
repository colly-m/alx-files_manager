import { Router } from 'express';

const router = Router();
const AppController = require('../controllers/AppController');

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

module.exports = router;
