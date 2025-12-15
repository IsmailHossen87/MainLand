import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { query, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TicketService } from './ticket.service';
import { IResellTicket } from './ticket.interface';
import { IJwtUser } from '../../../types';


// ================= Primary Event Ticket Purchase =================
const getAllTicket = catchAsync(async (req: Request, res: Response) => {
    //   const eventId = req.params.id;
    const userId = (req.user as IJwtUser)?.id;
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
    const userId = (req.user as IJwtUser)?.id;
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
    const userId = (req.user as IJwtUser)?.id;
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
    const userId = (req.user as IJwtUser)?.id;
    const result = await TicketService.getSoldEvent(userId);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Unique Sold Event retrived Successfully',
        data: result,
    });
});

const sellTicketInfoUsers = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as IJwtUser)?.id;
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
const sellTicketInfoUsersOnsell = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as IJwtUser)?.id;
    const eventId = req.params.id;
    const query = req.query;
    const result = await TicketService.sellTicketInfoUsersOnsell(userId, eventId, query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Purchase Ticket  retrived Successfully',
        data: { tickets: result },
    });
});

// All
const allOnsellTicketInfo = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as IJwtUser)?.id;
    const query = req.query;
    const result = await TicketService.allOnsellTicketInfo(userId, query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'All Ticket Type retrived Successfully',
        data: result,
    });
});

const resellTicket = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as IJwtUser)?.id;
    const eventId = req.params.id;
    const tickets = req.body; // Array of objects asbe

    const result = await TicketService.resellTicket(userId, eventId, tickets);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Purchase Ticket retrived Successfully',
        data: result,
    });
});


// WITHDRAWpromocode
const withdrawPro = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as IJwtUser)?.id;
    const eventId = req.params.id;
    const result = await TicketService.withdrawPro(userId, eventId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Purchase Ticket  retrived Successfully',
        data: result,
    });
});
const soldTicket = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as IJwtUser)?.id;
    const result = await TicketService.soldTicket(userId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Sold Ticket  retrived Successfully',
        data: result
    });
});
const ticketExpired = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as IJwtUser)?.id;
    const result = await TicketService.ticketExpired(userId);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Event Expired retrived Successfully',
        data: result
    });
});
const eventSummary = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as IJwtUser)?.id;
    const { sellerType, ticketType, eventId } = req.query;

    console.log("sellerType", sellerType)
    console.log("ticketType", ticketType)
    console.log("eventId", eventId)

    const result = await TicketService.eventSummary({ userId, sellerType, ticketType, eventId });
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Event Expired retrived Successfully',
        data: result
    });
});
const PromoCodePercentage = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as IJwtUser)?.id;
    const { id } = req.params;
    const { code } = req.body;
    const result = await TicketService.promocode(userId, id as string, code as string);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Promo Code retrived Successfully',
        data: result
    });
});
const avaiableTypeHistory = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as IJwtUser)?.id;
    const { id } = req.params;

    const result = await TicketService.availableTypeHistory(userId, id as string);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Available Type retrived Successfully',
        data: result
    });
});

// Bar code generate
const checkEvent = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as IJwtUser)?.id;
    const { eventCode } = req.params
    const result = await TicketService.checkEvent(userId, eventCode);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Event retrived Successfully',
        data: result,
    });
});
// Bar code generate
const soldTicketHistory = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as IJwtUser)?.id;
    const { id } = req.params
    const { expired } = req.query;

    console.log("id", id)

    const result = await TicketService.soldTicketHistory(userId, id as string, expired as string);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Event retrived Successfully',
        // data: result.flatMap((item) => item.ticketInfo),
        data: result
    });
});
const historyTickets = catchAsync(async (req: Request, res: Response) => {
    const userId = (req.user as IJwtUser)?.id;
    const { id } = req.params
    console.log("id", id)
    const result = await TicketService.historyTickets(userId, id as string);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Event retrived Successfully',
        // data: result.flatMap((item) => item.ticketInfo),
        data: result
    });
});

export const TicketController = {
    getAllTicket,
    getOneTicket,
    getUniqueEvents,
    sellTicketInfoUsers,
    allOnsellTicketInfo,
    resellTicket,
    soldTicket,
    ticketExpired,
    getSoldEvent,
    eventSummary,
    PromoCodePercentage,
    withdrawPro,
    sellTicketInfoUsersOnsell,
    avaiableTypeHistory,
    checkEvent,
    soldTicketHistory,
    historyTickets,
};