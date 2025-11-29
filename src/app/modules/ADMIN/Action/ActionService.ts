import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../../errors/ApiError';
import { User } from '../../user/user.model';
import { Category, Event } from '../../ORGANIZER/Event/Event.model';
import { USER_ROLES } from '../../../../enums/user';
import { generateEventCode } from '../../../../util/generateOTP';
import { QueryBuilder } from '../../../builder/QueryBuilder';
import { TicketPurchase } from '../../Ticket/ticket.model';
import { TransactionHistory } from '../../Payment/transactionHistory';



const statusChange = async (userId: string, eventId: string) => {
  // ✅ Check user
  const isExistUser = await User.findById(userId);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.FORBIDDEN, "User doesn't exist!");
  }
  if (isExistUser.role !== USER_ROLES.ADMIN) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only admin can update it");
  }

  // ✅ Check event
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Event doesn't exist!");
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
    throw new ApiError(StatusCodes.FORBIDDEN, "Only admin can update it");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User doesn't exist!");
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
    throw new ApiError(StatusCodes.FORBIDDEN, "Only admin can access it");
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


export const ActionService = { statusChange, DashBoard, blockUser };
