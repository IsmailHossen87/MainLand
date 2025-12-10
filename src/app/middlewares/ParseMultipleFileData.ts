import { NextFunction, Request, Response } from "express";
import { getMultipleFilesPath, IFolderName } from "../../shared/getFilePath";

export const parseMultipleFilesdata = (fieldName: IFolderName) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const image = getMultipleFilesPath(req.files, fieldName);
            if (req.body.data) {
                const data = JSON.parse(req.body.data);
                req.body = { ...data, [fieldName]: image };
            } else {
                req.body = { ...req.body, [fieldName]: image };
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};
