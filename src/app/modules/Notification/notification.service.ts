import { StatusCodes } from "http-status-codes";
import { INotification } from "./notification.interface";
import mongoose from "mongoose";
import { JwtPayload } from "jsonwebtoken";
import { Event } from "../ORGANIZER/Event/Event.model";
import AppError from "../../../errors/AppError";
import { User } from "../user/user.model";
import { sendNotifications } from "../../../helpers/notificatio-helper";
import { USER_ROLES } from "../../../enums/user";
import { QueryBuilder } from "../../builder/QueryBuilder";
import { Notification } from "./notification.model";
import { excludeField } from "../../../shared/constrant";
import { Message } from "../Message/message-model";
import { sendFirebaseNotification } from "../../../helpers/firebaseAdmin";

interface GetNotificationsResult {
  meta: {
    total: number;
    page: number;
    limit: number;
  };
  data: INotification[];
}

/* **************************************
     ADMIN SEND NOTIFICATION TO ORGANIZER
*****************************************/
const sendAdminNotification = async (
  eventId: string,
  user: JwtPayload,
  status: "success" | "rejected"
) => {
  if (USER_ROLES.ADMIN !== user.role) {
    throw new AppError(StatusCodes.BAD_REQUEST, "You are not permitted for this API");
  }

  if (!eventId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Event ID is required");
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError(StatusCodes.NOT_FOUND, "Event not found");
  }

  const organizerId = event.userId?.toString();
  if (!organizerId) {
    throw new AppError(StatusCodes.NOT_FOUND, "Organizer not found in event");
  }

  const organizer = await User.findById(organizerId);
  if (!organizer) {
    throw new AppError(StatusCodes.NOT_FOUND, "Organizer user not found");
  }

  if (!event.notification) {
    throw new AppError(StatusCodes.BAD_REQUEST, "No notification message found on event");
  }

  const title = status === "rejected"
    ? "Your notification broadcast has been rejected"
    : "Your notification has been successfully broadcast";

  const message = event.notification;

  const notificationData: Partial<INotification> = {
    title,
    message,
    receiver: new mongoose.Types.ObjectId(organizerId),
    type: "NOTIFICATION",
    read: false,
    eventId: event._id,
    eventTitle: event.eventName,
    status,
  };

  // 🔥 Clear event notification if rejected
  if (status === "rejected") {
    event.notification = "";
    event.notificationStatus = "idle";
    await event.save();
  }

  await sendNotifications(notificationData, "notification");

  // 🔥 Firebase Push Notification
  if (organizer?.fcmToken) {
    // await sendFirebaseNotification(
    //   organizer.fcmToken,
    //   title,
    //   message,
    //   {
    //     type: "NOTIFICATION",
    //     eventId: event._id.toString(),
    //     status,
    //   }
    // );
  }


  return true;
};

/* **************************************
     GET NOTIFICATIONS WITH META + UNREAD
*****************************************/
const getNotificationFromDB = async (
  user: JwtPayload,
  query: Record<string, any>
): Promise<GetNotificationsResult> => {

  if (!user?.id) {
    throw new Error("User ID is required");
  }

  // Base query
  const baseQuery = Notification.find({ receiver: user.id })
    .sort({ createdAt: -1 }).select('-status');

  // Query builder initialize
  const qb = new QueryBuilder(baseQuery, query);

  qb.search(excludeField)
    .filter()
    .dateRange()
    .sort()
    .paginate()
    .fields();

  await Notification.updateMany({ receiver: user.id }, { read: true });

  // Build & meta should come from qb (not result of build)
  const dataPromise = qb.build();
  const metaPromise = qb.getMeta();

  const [data, meta] = await Promise.all([dataPromise, metaPromise]);

  return { data, meta };
};

const getUnreadNotificationCount = async (user: JwtPayload): Promise<{ notificationCount: number; messageCount: number }> => {
  if (!user?.id) {
    throw new Error("User ID is required");
  }

  const count = await Notification.countDocuments({ receiver: user.id, read: false });
  const messageCount = await Message.countDocuments({ sender: { $ne: user.id }, read: false });

  return { notificationCount: count, messageCount: messageCount, }
};

export const NotificationService = {
  sendAdminNotification,
  getNotificationFromDB,
  getUnreadNotificationCount,
};
