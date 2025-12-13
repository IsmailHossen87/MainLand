import { NextFunction, Request, Response } from "express";
import { getMultipleFilesPath, IFolderName } from "../../shared/getFilePath";

export const parseMultipleFilesdata = (fieldName: IFolderName) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const file = getMultipleFilesPath(req.files, fieldName);
            if (req.body.data) {
                const data = JSON.parse(req.body.data);
                req.body = { ...data, [fieldName]: file };
            } else {
                req.body = { ...req.body, [fieldName]: file };
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};
