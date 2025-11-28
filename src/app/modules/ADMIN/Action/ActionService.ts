import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../../errors/ApiError';
import { User } from '../../user/user.model';
import { Event } from '../../ORGANIZER/Event/Event.model';
import { USER_ROLES } from '../../../../enums/user';
import { generateEventCode } from '../../../../util/generateOTP';
import { QueryBuilder } from '../../../builder/QueryBuilder';



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

  const queryBuilder = new QueryBuilder(Event.find({ userId }), query);

  const result = await queryBuilder
    // .search(e)
    .filter()
    .dateRange()
    .sort()
    .fields()
    .paginate();

  const [meta, data] = await Promise.all([
    result.getMeta(),
    result.build()
  ]);

  return { meta, data };
};


export const ActionService = { statusChange, DashBoard, blockUser };
