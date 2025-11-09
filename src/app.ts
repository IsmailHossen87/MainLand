import cors from 'cors';
import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import router from './routes';
import webhookHandler from './app/modules/stripeAccount/webhookHandler';
import './app/config/Passport';
import passport from 'passport';
import expressSession from 'express-session';
import { Morgan } from './shared/morgen';

const app = express(); 
app.use(passport.initialize());
app.use(
  expressSession({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
  })
)

//morgan
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);

//body parser
app.use(cors());
app.post(
  '/api/v1/stripe/webhook',
  express.raw({ type: 'application/json' }),
  webhookHandler
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//file retrieve
app.use(express.static('uploads'));

//router
app.use('/api/v1', router);

//live response
app.get('/', (req: Request, res: Response) => {
  const date = new Date(Date.now());
  res.send(
    `<h1 style="text-align:center; color:#173616; font-family:Verdana;">Beep-beep! The server is alive and kicking.</h1>
    <p style="text-align:center; color:#173616; font-family:Verdana;">${date}</p>
    `
  );
});

//global error handle
app.use(globalErrorHandler);

//handle not found route;
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Not found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: "API DOESN'T EXIST",
      },
    ],
  });
});

export default app;
