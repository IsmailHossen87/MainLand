import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import stripe from '../../config/stripe.config';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../user/user.model';

import { successHTMLstripeConnection } from './stripeAccount.utils';
import config from '../../../config';

const createConnectedStripeAccount = async (user: JwtPayload, host: string, protocol: string): Promise<any> => {

     const existingAccount = await User.findById(user.id);
     const baseUrl = config.BACKEND_URL

     if (existingAccount && existingAccount.stripeAccountInfo?.stripeAccountId) {
          const onboardingLink = await stripe.accountLinks.create({
               account: existingAccount.stripeAccountInfo?.stripeAccountId,
               refresh_url: `${baseUrl}/api/v1/stripe/refreshAccountConnect/${existingAccount.stripeAccountInfo.stripeAccountId}`,
               return_url: `${baseUrl}/api/v1/stripe/success-account/${existingAccount.stripeAccountInfo.stripeAccountId}`,
               type: 'account_onboarding',
          });
          // console.log('onboardingLink-1', onboardingLink);

          return {
               success: true,
               message: 'Please complete your account',
               url: onboardingLink.url,
          };
     } else {
          const account = await stripe.accounts.create({
               type: 'express',
               email: user.email,
               country: 'US',
               capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
               },
          });

          await User.findByIdAndUpdate(user.id, { $set: { stripeAccountInfo: { stripeAccountId: account.id } } });

          const onboardingLink = await stripe.accountLinks.create({
               account: account.id,
               refresh_url: `${baseUrl}/api/v1/stripe/refreshAccountConnect/${account.id}`,
               return_url: `${baseUrl}/api/v1/stripe/success-account/${account.id}`,
               type: 'account_onboarding',
          });

          return {
               success: true,
               message: 'Please complete your account',
               url: onboardingLink.url,
          };
     }




};

const refreshAccountConnect = async (id: string, host: string, protocol: string): Promise<string> => {
     const onboardingLink = await stripe.accountLinks.create({
          account: id,
          refresh_url: `${protocol}://${host}/api/v1/stripe/refreshAccountConnect/${id}`,
          return_url: `${protocol}://${host}/api/v1/stripe/success-account/${id}`,
          type: 'account_onboarding',
     });
     return onboardingLink.url;
};

const onConnectedStripeAccountSuccess = async (accountId: string) => {
     console.log({ accountId });
     if (!accountId) {
          throw new AppError(StatusCodes.NOT_FOUND, 'account Id not found');
     }

     type TPopulatedUser = {
          full_name: string;
          email: string;
          image: string;
     };

     const stripeAccounts = await User.findOne({ stripeAccountInfo: { stripeAccountId: accountId } });

     if (!stripeAccounts) {
          throw new AppError(StatusCodes.NOT_FOUND, 'account not found');
     }

     await User.updateOne({ stripeAccountInfo: { stripeAccountId: accountId } }, { isCompleted: true });

     const userUpdate = await User.findByIdAndUpdate(stripeAccounts._id, { $set: { stripeConnectedAccount: accountId } }, { new: true });

     if (!userUpdate) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }

     // const user = stripeAccounts.userId as unknown as TPopulatedUser;

     const html = successHTMLstripeConnection({
          name: userUpdate.name,
          email: userUpdate.email,
          image: `${config.BACKEND_URL}${userUpdate.image}`,
          dashboardLink: `${config.FRONTEND_URL_DASHBOARD}/seller/overview`,
     });

     // const data = { user: { name: user.full_name } };
     // io.emit('join stripe account', data);

     return html;
};

const stripeLoginLink = async (userPayload: JwtPayload) => {
     const userId = userPayload.id;
     const user = await User.findById(userId);
     if (!user) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }
     // check if shop owner has stripe connected account
     const hasStripeAccount = await User.findOne({ "stripeAccountInfo.stripeAccountId": user.stripeAccountInfo?.stripeAccountId });

     if (!hasStripeAccount) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Stripe account not found');
     }

     const stripeAccountId = hasStripeAccount?.stripeAccountInfo?.stripeAccountId || '';
     const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
     return loginLink.url;
};

export const stripeAccountService = {
     createConnectedStripeAccount,
     refreshAccountConnect,
     onConnectedStripeAccountSuccess,
     stripeLoginLink,
};
