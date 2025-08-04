import { Request, Response } from 'express';
import Session from '../models/Session';
import mongoose from 'mongoose';

export const insertData = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    const newSession = new Session({ data });
    await newSession.save();
    res.status(201).json({ message: 'Data inserted successfully', session: newSession });
  } catch (error) {
    res.status(500).json({ message: 'Error inserting data', error });
  }
};


export const insertData1 = async (req: Request, res: Response) => {
  try {
    const { userId, data } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    const newSession = new Session({
      userId, // Mongoose, cast string, ObjectId อัตโนมัติ
      data,
    });

    await newSession.save();

    res.status(201).json({
      message: 'Data inserted successfully',
      session: newSession,
    });
  } catch (error) {
    console.error('Insert error:', error);
    res.status(500).json({
      message: 'Error inserting data',
      error: error instanceof Error ? error.message : error,
    });
  }
};
////////////////////////// fix insert /////////////////////////