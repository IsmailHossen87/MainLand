import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../../errors/ApiError';
import { User } from '../../user/user.model';
import { Event } from '../../ORGANIZER/Event/Event.model';
import { USER_ROLES } from '../../../../enums/user';
import { generateEventCode } from '../../../../util/generateOTP';



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
