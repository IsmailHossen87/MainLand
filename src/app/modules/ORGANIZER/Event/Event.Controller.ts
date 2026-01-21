/* eslint-disable no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';
import { EventService } from './Event.Service';
import { User } from '../../user/user.model';
import stripe from '../../../config/stripe.config';
import { IJwtUser } from '../../../../types';
import AppError from '../../../../errors/AppError';

// SubCategory
const createSubCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id as string;
    req.body.userId = userId;

    const result = await EventService.creteSubCategory(req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Sub-Category created successfully',
      data: result,
    });
  }
);
const createCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as IJwtUser)?.id;
    req.body.userId = userId;

    if (req.body.data) {
      const data = JSON.parse(req.body.data);
      req.body = { ...data, userId };
    }

    if (req.files && 'image' in req.files && req.files.image[0]) {
      req.body.coverImage = `/image/${req.files.image[0].filename}`;
    }
    const result = await EventService.creteCategory(req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Category created successfully',
      data: result,
    });
  }
);
// UPDATEcategory
const updateCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const categoryId = req.params.id;

    // Handle image if uploaded
    if (req.files && "image" in req.files && req.files.image[0]) {
      req.body.coverImage = `/image/${req.files.image[0].filename}`;
    }

    const updatedCategory = await EventService.updateCategory(categoryId, req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  }
);
// UPDATEcategory
const updateSubCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const SubcategoryId = req.params.id;

    const updatedCategory = await EventService.updateSubCategory(SubcategoryId, req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "SubCategory updated successfully",
      data: updatedCategory,
    });
  }
);
// Delete Category
const deleteCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const type = req.query.type;
    const deletedCategory = await EventService.deleteCategory(id, type as string);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `${type} deleted successfully`,
      data: deletedCategory,
    });
  }
);



// // 1️⃣ Create Event (Draft or Full)
// const createEvent = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const userId = (req.user as IJwtUser)?.id;

//     if (req.files && 'image' in req.files && req.files.image[0]) {
//       req.body.image = `/image/${req.files.image[0].filename}`;
//     }

//     const isDraft = req.body.isDraft === true || req.body.isDraft === 'true';

//     const user = await User.findById(userId);
//     if (!user) {
//       throw new AppError(
//         StatusCodes.NOT_FOUND,
//         'User not found'
//       );
//     }

//     if (req.body.isDraft === 'true') {
//       if (!user.stripeAccountInfo?.stripeAccountId) {
//         throw new AppError(
//           StatusCodes.BAD_REQUEST,
//           'You must connect your Stripe account before creating paid events. Please connect your account from Settings.'
//         );
//       }
//       // Verify Stripe account is active
//       try {
//         const account = await stripe.accounts.retrieve(
//           user.stripeAccountInfo.stripeAccountId
//         );

//         if (!account.charges_enabled || !account.payouts_enabled) {
//           throw new AppError(
//             StatusCodes.BAD_REQUEST,
//             'Your Stripe account is not fully activated. Please complete the onboarding process.'
//           );
//         }
//       } catch (error) {
//         throw new AppError(
//           StatusCodes.BAD_REQUEST,
//           'Invalid Stripe account. Please reconnect your account.'
//         );
//       }
//     }


//     const event = await EventService.createEvent({
//       ...req.body,
//       userId,
//       isDraft,
//     });



//     await sendResponse(res, {
//       success: true,
//       statusCode: StatusCodes.CREATED,
//       message: isDraft
//         ? 'Draft saved successfully'
//         : 'Event created successfully',
//       data: event,
//     });
//   }
// );
const createEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as IJwtUser)?.id;

    // Image upload handle করা
    if (req.files && 'image' in req.files && req.files.image[0]) {
      req.body.image = `/image/${req.files.image[0].filename}`;
    }

    const isDraft = req.body.isDraft === true || req.body.isDraft === 'true';

    // User check করা
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(
        StatusCodes.NOT_FOUND,
        'User not found'
      );
    }

    // ✅ FIX: isFreeEvent check - string এবং boolean দুটোই handle করা
    const isFreeEvent = req.body.isFreeEvent === true || req.body.isFreeEvent === 'true';

    // ✅ FIX: Stripe check শুধুমাত্র published paid event এর জন্য
    // Logic: isDraft === 'false' (published) এবং isFreeEvent === false (paid)
    if (req.body.isDraft === 'false' && !isFreeEvent) {
      // Check if Stripe account exists
      if (!user.stripeAccountInfo?.stripeAccountId) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          'You must connect your Stripe account before creating paid events. Please connect your account from Settings.'
        );
      }

      // Verify Stripe account is active and ready for payments
      try {
        const account = await stripe.accounts.retrieve(
          user.stripeAccountInfo.stripeAccountId
        );

        if (!account.charges_enabled || !account.payouts_enabled) {
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            'Your Stripe account is not fully activated. Please complete the onboarding process.'
          );
        }
      } catch (error) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          'Invalid Stripe account. Please reconnect your account.'
        );
      }
    }

    // Event create/update করা
    const event = await EventService.createEvent({
      ...req.body,
      userId,
      isDraft,
    });

    // Success response
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: isDraft
        ? 'Draft saved successfully'
        : 'Event created successfully',
      data: event,
    });
  }
);

// 2️⃣ Update Event (Draft update or Publish)
const updateEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as IJwtUser)?.id;
    const eventId = req.params.id;

    if (req.files && 'image' in req.files && req.files.image[0]) {
      req.body.image = `/image/${req.files.image[0].filename}`;
    }

    const isDraft = req.body.isDraft === true || req.body.isDraft === 'true';

    const updatedEvent = await EventService.updateEvent(
      eventId,
      userId as string,
      { ...req.body, isDraft }
    );

    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: isDraft
        ? 'Draft updated successfully'
        : 'Event published successfully',
      data: updatedEvent,
    });
  }
);
// 2️⃣ UpdateNotification
const updateNotification = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as IJwtUser)?.id;
    const eventId = req.params.id;
    const notification = req.body.notification;
    console.log(eventId, userId, notification);

    const updatedEvent = await EventService.updateNotification(
      eventId,
      userId as string,
      notification
    );

    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Notification updated successfully',
      data: updatedEvent,
    });
  }
);

const singleEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as IJwtUser)?.id
    const eventId = req.params.id
    const result = await EventService.singleEvent(userId as string, eventId as string)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Event details Successfully",
      data: result,
    });
  }
);



const allLiveEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query
    const result = await EventService.allLiveEvent(query as Record<string, string>)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "My event Retrived Successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);

const popularEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const query = req.query
    const result = await EventService.popularEvent(query as Record<string, string>)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "My event Retrived Successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);

// All Data Use Query
const allDataUseQuery = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const userId = (req.user as IJwtUser)?.id
    const query = req.query
    const result = await EventService.allDataUseQuery(userId as string, query as Record<string, string>)

    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Event All Data Retrived Successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);
// All Data Use Query
const AllUnderReview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const userId = (req.user as IJwtUser)?.id
    const query = req.query
    console.log(query)
    const result = await EventService.allUndewReview(userId as string, query as Record<string, string>)

    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Event All Undew-Review Retrived Successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);


// Closed Event ✅✅✅✅
const closedEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as IJwtUser)?.id
    const query = req.query

    const result = await EventService.closedEvent(userId as string, query as Record<string, string>)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Event All Closed Retrived Successfully",
      meta: result.meta,
      data: result.data,
    });
  }
);

// All Data Use Query
const subCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const categoryID = req.query.categoryId as string;
    const result = await EventService.subCategory(categoryID)

    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Category All Data Retrived Successfully",
      data: result,
    });
  }
);
// All Data Use Query
const allCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as IJwtUser)?.id
    const query = req.query
    const result = await EventService.allCategory(userId as string, query as Record<string, string>)

    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Category All Data Retrived Successfully",
      data: result,
    });
  }
);
// All Event History
const eventTicketHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await EventService.eventTicketHistory(req.params.id as string)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Event History Retrived Successfully",
      data: result,
    });
  }
);
// Bar Code Check
const barCodeCheck = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as IJwtUser)?.id
    const eventId = req.params.id
    const query = req.query

    const result = await EventService.barCodeCheck(query.ownerId as string, userId as string, eventId as string, query.isUpdate as string)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Bar Code Check Successfully",
      data: result,
    });
  }
);
const perticipentCount = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await EventService.perticipentCount(req.params.eventCode as string)
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Event Perticipent Count Retrived Successfully",
      data: result,
    });
  }
);
export const EventController = {
  createSubCategory,
  createCategory,
  createEvent,
  updateEvent,
  updateNotification,
  updateSubCategory,
  allLiveEvent,
  popularEvent,
  singleEvent,
  allDataUseQuery,
  closedEvent,
  updateCategory,
  deleteCategory,
  subCategory,
  allCategory,
  eventTicketHistory,
  AllUnderReview,
  barCodeCheck,
  perticipentCount
};
