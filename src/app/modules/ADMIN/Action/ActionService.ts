import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../../errors/ApiError';
import { User } from '../../user/user.model';
import { Category, Event } from '../../ORGANIZER/Event/Event.model';
import { USER_ROLES } from '../../../../enums/user';
import { TicketPurchase } from '../../user/Ticket/Purchase.Mode';

const DashBoard = async (user: JwtPayload, query: Record<string, string>) => {
  // Check admin
  if (USER_ROLES.ADMIN != user.role) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Only admin can permission');
  }

  // Year and Month from query
  const year = query.year ? parseInt(query.year) : 2024;
  const month = query.month ? parseInt(query.month) : 2;

  // 1. Basic Counts
  const totalUser = await User.countDocuments();
  const category = await Category.countDocuments();

  const totalTickets = await TicketPurchase.aggregate([
    { $unwind: '$tickets' },
    { $group: { _id: null, total: { $sum: '$tickets.quantity' } } },
  ]);
  const totalSold = totalTickets[0]?.total || 0;

  const revenue = await Event.aggregate([
    { $group: { _id: null, total: { $sum: '$totalEarned' } } },
  ]);
  const totalEarned = revenue[0]?.total || 0;

  // 2. Monthly Income Chart Data (12 months)
  const monthlyData = await Event.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        income: { $sum: '$totalEarned' },
      },
    },
  ]);

  // Format for chart
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const incomeRatio = months.map((name, index) => {
    const data = monthlyData.find(d => d._id === index + 1);
    return {
      month: name,
      income: data ? data.income : 0,
    };
  });

  // 3. Ticket Sales Pie Chart (Direct vs Re-Sales for selected month)
  const ticketSales = await TicketPurchase.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(year, month - 1, 1),
          $lt: new Date(year, month, 1),
        },
      },
    },
    { $unwind: '$tickets' },
    {
      $lookup: {
        from: 'tickets',
        localField: 'tickets.ticketId',
        foreignField: '_id',
        as: 'ticket',
      },
    },
    { $unwind: '$ticket' },
    {
      $group: {
        _id: '$ticket.type', // "Direct Sales" or "Re-Sales"
        sold: { $sum: '$tickets.quantity' },
      },
    },
  ]);

  const directSales =
    ticketSales.find(t => t._id === 'Direct Sales')?.sold || 0;
  const reSales = ticketSales.find(t => t._id === 'Re-Sales')?.sold || 0;

  // Return all data
  return {
    // Stats
    totalUser,
    totalSold,
    category,
    totalEarned,

    // Income Chart
    incomeRatio,

    // Pie Chart
    ticketSelling: {
      directSales,
      reSales,
      total: directSales + reSales,
    },
  };
};

const AllTicketBuyer = async (user: JwtPayload) => {
  if (USER_ROLES.ADMIN !== user.role) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Only admin can access');
  }

  // সব ticketPurchase load + populate user info
  const ticketPurchases = await TicketPurchase.find()
    .populate(
      "userId",
      "personalInfo.firstName role email personalInfo.phone address.country createdAt"
    );

  // unique userId filter
  const uniqueUsersMap = new Map();

  ticketPurchases.forEach(purchase => {
    const user = purchase.userId;
    if (user && !uniqueUsersMap.has(user._id.toString())) {
      uniqueUsersMap.set(user._id.toString(), user);
    }
  });

  // শুধু unique user info return
  const uniqueUsers = Array.from(uniqueUsersMap.values());

  return uniqueUsers;
};


const statusChange = async (userId: string, eventId: String) => {
  const isExistUser = await User.findById(userId);
  if (isExistUser?.role != USER_ROLES.ADMIN) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Only admin can update it');
  }
  if (!isExistUser) {
    throw new ApiError(StatusCodes.FORBIDDEN, "User doesn't exist!");
  }
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Event doesn't exist!");
  }
  const eventStatus = event.status;
  let newStatus;
  if (eventStatus === 'Pending') {
    newStatus = 'Accepted';
  } else if (eventStatus === 'Accepted') {
    newStatus = 'Pending';
  } else {
    newStatus = 'Pending';
  }

  const updateStatus = await Event.findByIdAndUpdate(
    eventId,
    { status: newStatus },
    { new: true }
  );
  return updateStatus;
};

export const ActionService = { DashBoard, AllTicketBuyer, statusChange };
