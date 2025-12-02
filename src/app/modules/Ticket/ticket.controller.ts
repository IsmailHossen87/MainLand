import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { query, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TicketService } from './ticket.service';
import { IResellTicket } from './ticket.interface';


// ================= Primary Event Ticket Purchase =================
const getAllTicket = catchAsync(async (req: Request, res: Response) => {
    //   const eventId = req.params.id;
    const userId = req.user?.id as string;
    const query = req.query;
    const result = await TicketService.getAllTicket(
        userId,
        query
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Get All Ticket',
        data: result?.data,
        meta: result?.meta,
    });
});

// GetOneTicket
const getOneTicket = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const ticketId = req.params.id;
    const result = await TicketService.getOneTicket(
        userId,
        ticketId
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Get All Ticket',
        data: result,
    });
});
// UNIQUE EVENT
const getUniqueEvents = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const query = req.query;
    const result = await TicketService.getUniqueEvents(userId, query as Record<string, string>);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Unique Events retrived Successfully',
        data: result,
    });
});
// UNIQUE SOLD
// UNIQUE EVENT
const getSoldEvent = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const result = await TicketService.getSoldEvent(userId);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Unique Sold Event retrived Successfully',
        data: result,
    });
});

const sellTicketInfoUsers = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const eventId = req.params.id;
    const query = req.query;
    const result = await TicketService.sellTicketInfoUsers(userId, eventId, query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Purchase Ticket  retrived Successfully',
        data: result,
    });
});
// All
const allOnsellTicketInfo = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const query = req.query;
    const result = await TicketService.allOnsellTicketInfo(userId, query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Purchase Ticket  retrived Successfully',
        data: result,
    });
});

const resellTicket = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const eventId = req.params.id;
    const { ticketType, quantity, resellAmount } = req.body;

    const result = await TicketService.resellTicket(userId, eventId, { ticketType, quantity, resellAmount });

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Purchase Ticket  retrived Successfully',
        data: result,
    });
});

const withdrawTicket = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const eventId = req.params.id;
    const { ticketType, quantity } = req.body;

    const result = await TicketService.withdrawTicket(userId, eventId, { ticketType, quantity } as IResellTicket);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Purchase Ticket  retrived Successfully',
        data: result,
    });
});
const soldTicket = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const result = await TicketService.soldTicket(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Sold Ticket  retrived Successfully',
        data: result
    });
});
const ticketExpired = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;
    const result = await TicketService.ticketExpired(userId);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Event Expired retrived Successfully',
        data: result
    });
});

// Bar code generate
// const barCodeGenerate = catchAsync(async (req: Request, res: Response) => {
//     const userId = req.user?.id as string;
//     const result = await TicketService.barCodeGenerate(userId);

//     sendResponse(res, {
//         statusCode: StatusCodes.OK,
//         success: true,
//         message: 'Bar Code Generated Successfully',
//         data: result,
//     });
// });

export const TicketController = {
    getAllTicket,
    getOneTicket,
    getUniqueEvents,
    sellTicketInfoUsers,
    allOnsellTicketInfo,
    resellTicket,
    withdrawTicket,
    soldTicket,
    ticketExpired,
    getSoldEvent,
    // barCodeGenerate
};