import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { NotificationRoutes } from '../app/modules/ADMIN/Notification/notification.route';
import { PaymentRouter } from '../app/modules/Payment/Payment.route';
import { EventRoutes } from '../app/modules/ORGANIZER/Event/Event.Route';
import { ActionRouter } from '../app/modules/ADMIN/Action/Action.Router';
import { SettingRouter } from '../app/modules/Setting/SettingRoute';
import { TicketRouter } from '../app/modules/Ticket/ticket.route';
import { FavouriteRouter } from '../app/modules/Favoutite/Favourite.route';



const router = express.Router();

const apiRoutes = [
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },

  {
    path: '/notification',
    route: NotificationRoutes,
  },
  {
    path: '/event',
    route: EventRoutes,
  },
  {
    path: '/payment',
    route:PaymentRouter ,
  },
  {
    path: '/action',
    route:ActionRouter ,
  },
  {
    path: '/ticket',
    route:TicketRouter,
  },

  {
    path: '/settings',
    route:SettingRouter ,
  },
  {
    path: '/favourite',
    route:FavouriteRouter ,
  },
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
