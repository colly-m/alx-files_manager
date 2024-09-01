import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = Router();

router.use((req, res, next) => {
  const paths = ['/connect'];
  if (!paths.includes(req.path)) {
    next();
  } else if (!request.headers.authorization) {
    res.status(401).json({ error: 'Unauthorized' }).end();
  } else {
    next();
  }
});

router.use((req, res, next) => {
  const paths = ['/disconnect', '/users/me', '/files'];
  if (!paths.includes(req.path)) {
    next();
  } else if (!req.headers['x-token']) {
    res.status(401).json({ error: 'Unauthorized' }).end();
  } else {
    next();
  }
});


router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);
router.post('/files', FilesController.postUpload);
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);
router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);
router.get('/files/:id/data', FilesController.getFile);

export defaul router;
