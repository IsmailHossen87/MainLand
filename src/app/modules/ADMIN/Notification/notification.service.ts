import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../../errors/ApiError';
import { INotification } from './notification.interface';
import { USER_ROLES } from '../../../../enums/user';
import Notification from './notification.model';
import { JwtPayload } from 'jsonwebtoken';import { QueryBuilder } from '../../../builder/QueryBuilder';
import { excludeField } from '../../../../shared/constrant';
;


const createNotification = async (payload: INotification) => {
  const { userId, title, isDraft } = payload;

  if (isDraft) {
    let notification = await Notification.findOne({
      userId,
      title,
      isDraft: true,
    });
    if (notification) {
      notification = await Notification.findByIdAndUpdate(
        notification._id,
        { $set: payload },
        { new: true, runValidators: true }
      );
      return notification;
    }
  }
  const result = await Notification.create(payload);
  if (!result) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create notification!'
    );
  }
  //@ts-ignore
  const io = global.io;
  await io?.emit(`NEW_NOTIFICATION`, result);
  return result;
};

const updateNotification = async (
  notificationId: string,
  user: JwtPayload,
  payload: INotification
) => {
  const notification = await Notification.findOne({
    _id: notificationId
  });
  if (!notification) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Notification not found!');
  }
  if (USER_ROLES.ADMIN != user.role) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Only admin can update it');
  }
  const updateNotification = await Notification.findByIdAndUpdate(
    notificationId,
    { $set: payload },
    { new: true, runValidators: true }
  );
  return updateNotification;
};

// all Notification
const getAllNotifications = async (query: Record<string, any>, user: any) => {
  if (USER_ROLES.ADMIN !== user.role) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You are not permit for this Api'
    );
  }
  const queryBuilder = new QueryBuilder(Notification.find(), query);

  const allNotification = queryBuilder
    .search(excludeField)
    .filter()
    .dateRange()
    .sort()
    .fields()
    .paginate();

  const [meta, data] = await Promise.all([
    queryBuilder.getMeta(),
    allNotification.build(),
  ]);

  return { meta, data };
};

const getNotificationById = async (
  id: string
): Promise<INotification | null> => {
  const result = await Notification.findById(id);
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Notification not found!');
  }
  return result;
};

const deleteNotification = async (
  id: string
): Promise<INotification | null> => {
  const isExistNotification = await getNotificationById(id);
  if (!isExistNotification) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Notification not found!');
  }

  const result = await Notification.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to delete notification!'
    );
  }
  return result;
};

const getNotificationCount = async (user: any): Promise<number> => {
  const result = await Notification.countDocuments({
    ...(user.role === USER_ROLES.ADMIN ? {} : { user: user.id }),
    status: 'unread',
  });
  return result;
};

export const NotificationService = {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  getNotificationCount,
};
