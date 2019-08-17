import { Router } from 'express';
import multer from 'multer';
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';
import authMiddleware from './app/middlewares/auth';
import multerConfig from './config/multer';
import AppointmentsController from './app/controllers/AppointmentsController';
import ScheduleController from './app/controllers/ScheduleController';
import NotificationController from './app/controllers/NotificationController';
import AvaiableController from './app/controllers/AvaiableController';

import ValidateUserStore from './app/validators/UserStore';
import ValidateUserUpdate from './app/validators/UserUpdate';
import ValidateSessionStore from './app/validators/SessionStore';
import ValidateAppointmentStore from './app/validators/AppointmentStore';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', ValidateUserStore, UserController.store);
routes.post('/sessions', ValidateSessionStore, SessionController.store);

routes.use(authMiddleware);
routes.put('/users', ValidateUserUpdate, UserController.update);

routes.get('/providers', ProviderController.index);
routes.get('/providers/:providerId/avaiable', AvaiableController.index);

routes.post(
  '/appointments',
  ValidateAppointmentStore,
  AppointmentsController.store
);
routes.get('/appointments', AppointmentsController.index);
routes.delete('/appointments/:id', AppointmentsController.delete);
routes.get('/appointments/:id', AppointmentsController.show);

routes.get('/schedule', ScheduleController.index);
routes.get('/notifications', NotificationController.index);
routes.put('/notifications/:id', NotificationController.update);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;
