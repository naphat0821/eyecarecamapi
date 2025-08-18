import { Request, Response } from 'express';
import Session from '../models/Session';
import mongoose from 'mongoose';


export const insertData = async (req: Request, res: Response) => {
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

export const getSessionsByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    const sessions = await Session.find({ userId });
    res.status(200).json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      message: 'Error getting sessions',
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getThisWeekData = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const now = new Date();
    console.log("thisweek func")
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() - now.getDay() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const sessions = await Session.find({
      userId,
      createdAt: {
        $gte: startOfWeek,
        $lte: endOfWeek,
      },
    });

    res.status(200).json(sessions);
  } catch (error) {
    console.error("Get this week data error:", error);
    res.status(500).json({
      message: "Error getting this week data",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getSessionsByDate = async (req: Request, res: Response) => {
  try {
    const { userId, date } = req.body;
    if (!userId || !date) {
      return res.status(400).json({ message: 'Invalid userId or date' });
    }

    // แปลง "2025-08-18" → Date object
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // query โดยใช้ createdAt (Date object ใน MongoDB)
    const sessions = await Session.find({
      userId,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    res.status(200).json(sessions);
  } catch (error) {
    console.error('Get sessions by date error:', error);
    res.status(500).json({
      message: 'Error getting sessions by date',
      error: error instanceof Error ? error.message : error,
    });
  }
};
