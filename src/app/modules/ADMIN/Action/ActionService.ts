import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../../errors/ApiError';
import { User } from '../../user/user.model';
import { Category, Event } from '../../ORGANIZER/Event/Event.model';
import { USER_ROLES } from '../../../../enums/user';
import { QueryBuilder } from '../../../builder/QueryBuilder';
import { excludeField } from '../../../../shared/constrant';
import mongoose from 'mongoose';

// const DashBoard = async (user: JwtPayload, query: Record<string, string>) => {
//   // Check admin
//   if (USER_ROLES.ADMIN != user.role) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Only admin can permission');
//   }

//   // Year and Month from query
//   const year = query.year ? parseInt(query.year) : 2024;
//   const month = query.month ? parseInt(query.month) : 2;

//   // 1. Basic Counts
//   const totalUser = await User.countDocuments();
//   const category = await Category.countDocuments();

//   const totalTickets = await TicketPurchase.aggregate([
//     { $unwind: '$tickets' },
//     { $group: { _id: null, total: { $sum: '$tickets.quantity' } } },
//   ]);
//   const totalSold = totalTickets[0]?.total || 0;

//   const revenue = await Event.aggregate([
//     { $group: { _id: null, total: { $sum: '$totalEarned' } } },
//   ]);
//   const totalEarned = revenue[0]?.total || 0;

//   // 2. Monthly Income Chart Data (12 months)
//   const monthlyData = await Event.aggregate([
//     {
//       $match: {
//         createdAt: {
//           $gte: new Date(year, 0, 1),
//           $lt: new Date(year + 1, 0, 1),
//         },
//       },
//     },
//     {
//       $group: {
//         _id: { $month: '$createdAt' },
//         income: { $sum: '$totalEarned' },
//       },
//     },
//   ]);

//   // Format for chart
//   const months = [
//     'Jan',
//     'Feb',
//     'Mar',
//     'Apr',
//     'May',
//     'Jun',
//     'Jul',
//     'Aug',
//     'Sep',
//     'Oct',
//     'Nov',
//     'Dec',
//   ];
//   const incomeRatio = months.map((name, index) => {
//     const data = monthlyData.find(d => d._id === index + 1);
//     return {
//       month: name,
//       income: data ? data.income : 0,
//     };
//   });

//   // 3. Ticket Sales Pie Chart (Direct vs Re-Sales for selected month)
//   const ticketSales = await TicketPurchase.aggregate([
//     {
//       $match: {
//         createdAt: {
//           $gte: new Date(year, month - 1, 1),
//           $lt: new Date(year, month, 1),
//         },
//       },
//     },
//     { $unwind: '$tickets' },
//     {
//       $lookup: {
//         from: 'tickets',
//         localField: 'tickets.ticketId',
//         foreignField: '_id',
//         as: 'ticket',
//       },
//     },
//     { $unwind: '$ticket' },
//     {
//       $group: {
//         _id: '$ticket.type', // "Direct Sales" or "Re-Sales"
//         sold: { $sum: '$tickets.quantity' },
//       },
//     },
//   ]);

//   const directSales =
//     ticketSales.find(t => t._id === 'Direct Sales')?.sold || 0;
//   const reSales = ticketSales.find(t => t._id === 'Re-Sales')?.sold || 0;

//   // Return all data
//   return {
//     // Stats
//     totalUser,
//     totalSold,
//     category,
//     totalEarned,

//     // Income Chart
//     incomeRatio,

//     // Pie Chart
//     ticketSelling: {
//       directSales,
//       reSales,
//       total: directSales + reSales,
//     },
//   };
// };

// const AllTicketBuyer = async (user: JwtPayload) => {
//   if (USER_ROLES.ADMIN !== user.role) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Only admin can access');
//   }

//   // সব ticketPurchase load + populate user info
//   const ticketPurchases = await TicketPurchase.find()
//     .populate(
//       "userId",
//       "personalInfo.firstName role email personalInfo.phone address.country createdAt"
//     );

//   // unique userId filter
//   const uniqueUsersMap = new Map();

//   ticketPurchases.forEach(purchase => {
//     const user = purchase.userId;
//     if (user && !uniqueUsersMap.has(user._id.toString())) {
//       uniqueUsersMap.set(user._id.toString(), user);
//     }
//   });

//   // শুধু unique user info return
//   const uniqueUsers = Array.from(uniqueUsersMap.values());

//   return uniqueUsers;
// };
// const allResellTicket = async (user: JwtPayload, query: Record<string, string>) => {
 
//   const isExistUser = await User.findById(user.id);
//   if (!isExistUser) {
//     throw new ApiError(StatusCodes.FORBIDDEN, "User doesn't exist!");
//   }
//   if (isExistUser.role !== USER_ROLES.ADMIN) {
//     throw new ApiError(StatusCodes.FORBIDDEN, "Only admin can update it");
//   }
//   const allResellTicket = await ResellTicket.find({}).populate("eventId")


//   return allResellTicket;
// };


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
    { EventStatus: newStatus },
    { new: true, runValidators: true }
  );

  return updatedEvent;
};



// const ticketActivity = async (user: JwtPayload, query: Record<string, string>) => {
//   const userId = new mongoose.Types.ObjectId(query.userId)
//   const isExistUser = await User.findById(userId);

//   if (!isExistUser) {
//     throw new ApiError(StatusCodes.FORBIDDEN, "User doesn't exist!");
//   }
//   if (user?.role !== USER_ROLES.ADMIN) {
//     throw new ApiError(StatusCodes.FORBIDDEN, "Only admin can update it");
//   }
//   const { userId: _, ...filteredQuery } = query;
//   const queryBuilder = new QueryBuilder(SecondaryTicketPurchase.find({ buyerId: userId.toString() })
//     .populate({
//       path: 'resellTicketId',
//       select: 'ticketType originalPrice resellPrice status eventId',
//       populate: {
//         path: 'eventId',
//         select: 'eventName image category eventDate startTime endTime'
//       }
//     })
//     .populate({
//       path: 'originalTicketId',
//       select: 'eventId tickets totalAmount'
//     })
//     .lean(), filteredQuery)

//   if (!queryBuilder) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid query");
//   }

//   const totalTicketSold = await SecondaryTicketPurchase.countDocuments({ buyerId: userId.toString() })
//   const totalTicketPurchase = await TicketPurchase.countDocuments({ userId: userId.toString() })

//   const totalTicketPurchaseAmount = await TicketPurchase.aggregate([
//     { $match: { userId: userId } },
//     { $group: { _id: null, total: { $sum: '$totalAmount' } } }
//   ])
//   const totalTicketPurchaseAMOUNT = totalTicketPurchaseAmount[0]?.total || 0



//   const result = await queryBuilder
//     .search(excludeField)
//     .filter()
//     .dateRange()
//     .sort()
//     .fields()
//     .paginate();

//   const [meta, data] = await Promise.all([
//     result.getMeta(),
//     result.build()
//   ])
//   return {  
//     meta,
//   data,
//   totalTicketSold,
//   totalTicketPurchase,
//   totalTicketPurchaseAMOUNT, }

// };
// const ticketActivity = async (user: JwtPayload, query: Record<string, string>) => {
//   const userId = new mongoose.Types.ObjectId(query.userId);

//   const isExistUser = await User.findById(userId);
//   if (!isExistUser) {
//     throw new ApiError(StatusCodes.FORBIDDEN, "User doesn't exist!");
//   }

//   if (user?.role !== USER_ROLES.ADMIN) {
//     throw new ApiError(StatusCodes.FORBIDDEN, "Only admin can access this");
//   }

//   const { userId: _, ...filteredQuery } = query;

//   // ✅ Populate করে event details নিন
//   const queryBuilder = new QueryBuilder(
//     SecondaryTicketPurchase.find({ buyerId: userId })
//       .populate({
//         path: 'resellTicketId',
//         select: 'ticketType originalPrice resellPrice status eventId',
//         populate: {
//           path: 'eventId',
//           select: 'eventName image category eventDate startTime endTime'
//         }
//       })
//       .populate({
//         path: 'originalTicketId',
//         select: 'eventId tickets totalAmount',
//         populate: {
//           path: 'eventId',  // ✅ Event details populate করুন
//           select: 'eventName image category eventDate startTime endTime'
//         }
//       })
//       .lean(),
//     filteredQuery
//   );

//   // ✅ Statistics calculation
//   const [
//     totalTicketSold,
//     totalTicketPurchase,
//     totalSpentData,
//     totalEarnedData
//   ] = await Promise.all([
//     // Tickets sold as reseller
//     SecondaryTicketPurchase.countDocuments({ buyerId: userId }),

//     // Total tickets purchased
//     TicketPurchase.countDocuments({ userId: userId }),

//     // Total amount spent
//     TicketPurchase.aggregate([
//       { $match: { userId: userId } },
//       { $group: { _id: null, total: { $sum: '$totalAmount' } } }
//     ]),

//     // Total amount earned from reselling
//     SecondaryTicketPurchase.aggregate([
//       { $match: { resellersUserId: userId } },
//       { $group: { _id: null, total: { $sum: { $multiply: ['$resellPrice', '$quantity'] } } } }
//     ])
//   ]);

//   const totalSpent = totalSpentData[0]?.total || 0;
//   const totalEarned = totalEarnedData[0]?.total || 0;

//   // ✅ Query execution
//   const result = await queryBuilder
//     .search(['eventName', 'category'])  // ✅ Event name দিয়ে search করতে পারবেন
//     .filter()
//     .dateRange()
//     .sort()
//     .fields()
//     .paginate();

//   const [meta, data] = await Promise.all([
//     result.getMeta(),
//     result.build()
//   ]);

//   // ✅ Format data with event details
//   const formattedData = data.map((purchase: any) => {
//     // Event details from resellTicket or originalTicket
//     const event = purchase.resellTicketId?.eventId || purchase.originalTicketId?.eventId;

//     return {
//       eventName: event?.eventName || 'N/A',
//       category: event?.category?.[0]?.categoryId || 'Concert',
//       ticketId: `#${purchase._id.toString().slice(-8).toUpperCase()}`,
//       quantity: purchase.quantity,
//       purchaseDate: new Date(purchase.createdAt).toLocaleDateString('en-GB'),
//       payment: purchase.resellPrice
//         ? (purchase.resellPrice * purchase.quantity).toFixed(2)
//         : purchase.originalTicketId?.totalAmount || 'N/A',
//       paymentStatus: 'Paid',
//       eventDate: event?.eventDate
//         ? new Date(event.eventDate).toLocaleDateString('en-GB')
//         : 'N/A',
//       attended: event?.eventDate && new Date(event.eventDate) < new Date()
//         ? 'Attended'
//         : 'Upcoming',

//       // ✅ Original data যদি frontend এ লাগে
//       _id: purchase._id,
//       personalInfo: purchase.personalInfo
//     };
//   });

//   return {
//     summary: {
//       totalTicketsSold: totalTicketSold,
//       totalTicketsPurchased: totalTicketPurchase,
//       totalSpent: totalSpent.toFixed(2),
//       totalEarned: totalEarned.toFixed(2)
//     },
//     meta,
//     data: formattedData
//   };
// };


export const ActionService = { statusChange };
