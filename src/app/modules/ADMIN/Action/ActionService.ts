import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../../../errors/AppError';
import { isDeleted, User } from '../../user/user.model';
import { Category, Event } from '../../ORGANIZER/Event/Event.model';
import { USER_ROLES } from '../../../../enums/user';
import { generateEventCode } from '../../../../util/generateOTP';
import { QueryBuilder } from '../../../builder/QueryBuilder';
import { TicketPurchase } from '../../Ticket/ticket.model';
import { TransactionHistory } from '../../Payment/transactionHistory';
import { excludeField } from '../../../../shared/constrant';
import { Notification } from '../../Notification/notification.model';
import userSearchableFields from './userExcludeField';



const statusChange = async (userId: string, eventId: string) => {
  // ✅ Check user
  const isExistUser = await User.findById(userId);
  if (!isExistUser) {
    throw new AppError(StatusCodes.FORBIDDEN, "User doesn't exist!");
  }
  if (isExistUser.role !== USER_ROLES.ADMIN) {
    throw new AppError(StatusCodes.FORBIDDEN, "Only admin can update it");
  }

  // ✅ Check event
  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError(StatusCodes.NOT_FOUND, "Event doesn't exist!");
  }
  const generateEvent = generateEventCode(event._id.toString());

  // ✅ Determine new status
  let newStatus;
  switch (event.EventStatus) {
    case "UnderReview":
      newStatus = "Live";
      break;
    case "Live":
      newStatus = "UnderReview";
      break;
    default:
      newStatus = "UnderReview";
      break;
  }

  // ✅ Update the correct field
  const updatedEvent = await Event.findByIdAndUpdate(
    eventId,
    {
      EventStatus: newStatus,
      eventCode: generateEvent,
    },
    { new: true, runValidators: true }
  );

  return updatedEvent;
};

const blockUser = async (userId: string, adminInfo: JwtPayload) => {
  if (adminInfo.role !== USER_ROLES.ADMIN) {
    throw new AppError(StatusCodes.FORBIDDEN, "Only admin can update it");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User doesn't exist!");
  }
  let newStatus;
  switch (user.status) {
    case "Active":
      newStatus = "Blocked";
      break;
    case "Blocked":
      newStatus = "Active";
      break;
    default:
      newStatus = "Active";
      break;
  }
  const updateUser = await User.findByIdAndUpdate(userId, { status: newStatus }, { new: true });
  return { user: updateUser, message: newStatus };
};

// Dashboard
const DashBoard = async (user: JwtPayload, query: Record<string, string>) => {
  const userId = user.id;

  if (user.role !== USER_ROLES.ADMIN) {
    throw new AppError(StatusCodes.FORBIDDEN, "Only admin can access it");
  }

  // 📊 Overview Stats
  const totalUsers = await User.countDocuments({
    role: { $in: [USER_ROLES.USER, USER_ROLES.ORGANIZER] }
  });

  const totalSoldTickets = await TicketPurchase.countDocuments();

  const totalCategories = await Category.countDocuments();

  const totalRevenue = await Event.aggregate([
    { $group: { _id: null, total: { $sum: "$totalEarned" } } }
  ]);

  // 📈 Income Ratio (Monthly data for chart)
  const year = query.year ? parseInt(query.year) : new Date().getFullYear();

  const incomeRatio = await TransactionHistory.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalAmount: { $sum: "$sellAmount" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Format income ratio data for chart
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedIncomeRatio = monthNames.map((month, index) => {
    const monthData = incomeRatio.find(item => item._id === index + 1);
    return {
      month,
      amount: monthData ? monthData.totalAmount : 0
    };
  });

  // 🎟️ Tickets Selling (Donut Chart Data)
  const month = query.month || new Date().toLocaleString('default', { month: 'long' });
  const monthIndex = new Date(`${month} 1, ${year}`).getMonth();

  const ticketsSelling = await TransactionHistory.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(year, monthIndex, 1),
          $lt: new Date(year, monthIndex + 1, 1)
        }
      }
    },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$sellAmount" },
        count: { $sum: 1 }
      }
    }
  ]);

  const directSales = ticketsSelling.find(item => item._id === "directPurchase") || { total: 0, count: 0 };
  const resales = ticketsSelling.find(item => item._id === "resellPurchase") || { total: 0, count: 0 };

  // 🎯 Final Response Structure (matching UI)
  const dashboardData = {
    overview: {
      totalUser: totalUsers,
      totalSoldTickets: totalSoldTickets,
      categories: totalCategories,
      totalRevenue: totalRevenue[0]?.total || 0
    },

    incomeRatio: {
      year: year,
      data: formattedIncomeRatio
    },

    ticketsSelling: {
      month: month,
      directSales: {
        amount: directSales.total,
        count: directSales.count
      },
      resales: {
        amount: resales.total,
        count: resales.count
      }
    }
  };

  return dashboardData;
};
// All User

const AllTicketBuyerUser = async (user: JwtPayload, query: Record<string, string>) => {
  if (user.role !== USER_ROLES.ADMIN) {
    throw new AppError(StatusCodes.FORBIDDEN, "Only admin can access it");
  }

  // ✅ Get unique user IDs who bought tickets


  // ✅ Create query (don't execute with await yet)
  const userQuery = User.find({
    // _id: { $in: uniqueUserIds },
    role: { $in: [USER_ROLES.USER, USER_ROLES.ORGANIZER] }
  }).select('name email role createdAt personalInfo address status');

  // ✅ Pass the query object to QueryBuilder
  const queryBuilder = new QueryBuilder(userQuery, query);
  const result = queryBuilder.search(userSearchableFields)
    .filter()
    .dateRange()
    .sort()
    .fields()
    .paginate();

  const [meta, data] = await Promise.all([
    result.getMeta(),
    result.build(),
  ]);

  return { meta, data };
};

// // ticket Activity
const ticketActivity = async (user: JwtPayload, userId: string, query: Record<string, string>) => {
  if (user.role !== USER_ROLES.ADMIN) {
    throw new AppError(StatusCodes.FORBIDDEN, "Only admin can access it");
  }

  // ❌ Don't spread ...query here
  const baseQuery = TransactionHistory.find({ userId: userId })
    .select('ticketId ownerId createdAt purchaseAmount sellAmount earnedAmount ticketQuantity');
  console.log(baseQuery)

  // ✅ Pass query to QueryBuilder - it will handle the query params
  const queryBuilder = new QueryBuilder(baseQuery, query);

  const allHistory = queryBuilder
    .search(excludeField)
    .filter()  // Add this to handle filtering
    .sort();

  console.log('Query Builder:', allHistory);

  const [meta, data] = await Promise.all([
    allHistory.getMeta(),
    allHistory.build(),
  ]);

  return { meta, data };
};

const accountDeleteHistory = async (user: JwtPayload) => {
  if (user.role !== USER_ROLES.ADMIN) {
    throw new AppError(StatusCodes.FORBIDDEN, "Only admin can access it");
  }

  const accountDeleteHistory = await isDeleted.find().sort({ createdAt: -1 });

  return accountDeleteHistory;
};

const allNotification = async (user: JwtPayload, query: Record<string, string>) => {
  if (user.role !== USER_ROLES.ADMIN) {
    throw new AppError(StatusCodes.FORBIDDEN, "Only admin can access it");
  }

  const baseQuery = Notification.find().sort({ createdAt: -1 });
  const queryBuilder = new QueryBuilder(baseQuery, query);

  const allNotification = queryBuilder
    .search(excludeField)
    .filter()
    .sort();

  const [meta, data] = await Promise.all([
    allNotification.getMeta(),
    allNotification.build(),
  ]);

  return { meta, data };
};

const ticketHistory = async (
  user: JwtPayload,
  query: Record<string, string>,
  id: string
) => {
  // 🔒 Only Admin can access
  if (user.role !== USER_ROLES.ADMIN) {
    throw new AppError(StatusCodes.FORBIDDEN, "Only admin can access it");
  }

  const usersData = await User.findById(id);
  if (!usersData) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  let data = {};


  if (usersData.role === USER_ROLES.ORGANIZER) {
    const totalEvent = await Event.countDocuments({ userId: usersData._id })
    const activeEvents = await Event.countDocuments({
      userId: usersData._id,
      EventStatus: "Live"
    });
    const events = await Event.find({ userId: usersData._id }).select("tickets -_id");
    const allTickets = events.flatMap(event => event.tickets || []);
    const totalHaveEvent = allTickets.reduce(
      (sum, t) => sum + (t.availableUnits || 0),
      0
    );
    const totalOutstandingEvent = allTickets.reduce(
      (sum, t) => sum + (t.outstandingUnits || 0),
      0
    );
    const totalRevenue = await TransactionHistory.find({ organizerId: usersData._id, type: "directPurchase" }).select("revenue -_id")
    const revenue = totalRevenue.reduce((sum, t) => sum + (t.revenue || 0), 0)
    const totalSold = totalOutstandingEvent - totalHaveEvent;
    return data = {
      totalEvent,
      activeEvents,
      totalSold,
      revenue
    }


  }


  if (usersData.role === USER_ROLES.USER) {
    const ticketPurchase = await TransactionHistory.find({ userId: usersData._id });
    const ticketSell = await TransactionHistory.find({ sellerId: usersData._id });

    const purchaseQuantity = ticketPurchase.reduce((sum, t) => sum + (t.purchaseQuantity || 0), 0);
    const totalTicketSold = ticketSell.reduce((sum, t) => sum + (t.purchaseQuantity || 0), 0)

    data = {
      totalTicketSold,
      purchaseQuantity,
      user
    }

    console.log("Debug data:", data);

    return data;
  };
}

const allEventNotification = async (
  user: JwtPayload,
  query: Record<string, string>
) => {
  if (user.role !== USER_ROLES.ADMIN) {
    throw new AppError(StatusCodes.FORBIDDEN, "Only admin can access it");
  }

  const baseQuery = Event.find({
    notification: { $exists: true, $ne: "" }
  })
    .sort({ createdAt: -1 })
    .select("notification eventName eventDate -_id");

  const queryBuilder = new QueryBuilder(baseQuery, query);

  const allNotification = queryBuilder
    .search(excludeField)
    .filter()
    .sort();

  const [meta, data] = await Promise.all([
    allNotification.getMeta(),
    allNotification.build(),
  ]);

  return { meta, data };
};


export const ActionService = { allEventNotification, statusChange, DashBoard, blockUser, AllTicketBuyerUser, ticketActivity, ticketHistory, accountDeleteHistory, allNotification };
