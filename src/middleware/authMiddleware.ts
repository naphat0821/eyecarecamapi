import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };

            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(401).send('Not authorized, user not found');
            }
            req.user = user;
            next();
        } catch (error) {
            res.status(401).send('Not authorized, token failed');
        }
    } else {
        res.status(401).send('Not authorized, no token');
    }
};
