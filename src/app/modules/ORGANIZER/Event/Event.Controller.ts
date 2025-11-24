/* eslint-disable no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';
import { EventService } from './Event.Service';

// SubCategory
const createSubCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req?.user?.id;
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
    const userId = req?.user?.id;
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

// 1️⃣ Create Event (Draft or Full)
const createEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id; 

    if (req.files && 'image' in req.files && req.files.image[0]) {
      req.body.image = `/image/${req.files.image[0].filename}`;
    }

    const isDraft = req.body.isDraft === true || req.body.isDraft === 'true';

    const event = await EventService.createEvent({
      ...req.body,
      userId,
      isDraft,
    });

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
    const userId = req.user?.id;
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
const singleEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id
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

// ------------------------------------------------------------------
// 2️⃣ Update Event (Draft update or Publish)
// const myEvents = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const userId= req.user?.id
//     const result = await EventService.myEvents(userId as string)
//     await sendResponse(res, {
//       success: true,
//       statusCode: StatusCodes.OK,
//       message:"My event Retrived Successfully",
//       data: result,
//     });
//   }
// );

const allLiveEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id
    const result = await EventService.allLiveEvent()
    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "My event Retrived Successfully",
      data: result,
    });
  }
);

// All Data Use Query
const allDataUseQuery = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id
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


// Closed Event ✅✅✅✅
const closedEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id 
    const query = req.query

    const result = await EventService.closedEvent(userId as string , query as Record<string, string>)
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
    
    const result = await EventService.allCategory()

    await sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Category All Data Retrived Successfully",
      data: result,
    });
  }
);
export const EventController = {
  createSubCategory,
  createCategory,
  createEvent,
  updateEvent,
  allLiveEvent,
  singleEvent,
  allDataUseQuery,
  closedEvent,
  updateCategory,
  subCategory,
  allCategory
};
