import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../../errors/ApiError';
import { User } from '../../user/user.model';
import { Event } from '../../ORGANIZER/Event/Event.model';
import { USER_ROLES } from '../../../../enums/user';

const statusChange = async (userId: string, eventId: String) => {
  const isExistUser = await User.findById(userId);
  if(isExistUser?.role != USER_ROLES.ADMIN){
    throw new ApiError(StatusCodes.FORBIDDEN, "Only admin can update it");
  }
  if (!isExistUser) {
    throw new ApiError(StatusCodes.FORBIDDEN, "User doesn't exist!");
  }
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Event doesn't exist!");
  }
  const eventStatus = event.status;
  let newStatus ;
  if(eventStatus === "Pending"){
    newStatus = "Accepted"
  }else if(eventStatus === "Accepted"){
    newStatus = "Pending"
  }else{
    newStatus = "Pending";
  }

  const updateStatus = await Event.findByIdAndUpdate(
    eventId,
    {status:newStatus},
    {new:true}
  )
return updateStatus;
};

export const ActionService = { statusChange };
