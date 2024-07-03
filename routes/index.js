import { Router } from 'express';

const router = Router();
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UserController.postNew);

module.exports = router;
