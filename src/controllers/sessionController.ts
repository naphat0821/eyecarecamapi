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

    // Last 7 days including today
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const sessions = await Session.find({
      userId,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ createdAt: 1 });

    const weekUsage = sessions.length;

    // unigue วันทั้งหมด
    const uniqueDays = [...new Set(sessions.map(session => session.createdAt.toISOString().split('T')[0]))];

    //Usage //end-start
    const sumHourUsage = sessions.reduce((acc, session) => acc + (session.data.endAt - session.data.startAt), 0) / 3600000; // ms to hr //eg. 0.04 hour 
    const avgHourUsage = sumHourUsage / uniqueDays.length

    // onScreenTime (hours)
    const sumHourOnscreen = sessions.reduce((acc, session) => {
      const perSessionMs = (session.data.sit.sitted || []).reduce((sum: number, sit: any) => {
        const start = sit?.start ?? 0;
        const end = sit?.end ?? 0;
        return sum + (end - start);
      }, 0);
      return acc + perSessionMs;
    }, 0) / 3600000;
    const avgHourOnscreen = sumHourOnscreen / uniqueDays.length

    const onScreenObj = sessions.map((session) => {
      const perSessionMs = (session.data.sit.sitted || []).map((sit: any) => {
        const start = sit?.start ?? 0;
        const end = sit?.end ?? 0;
        return {msDuration: end - start, start, end};
      });

      return perSessionMs

    }).flat()
    const mostMsOnscreen = onScreenObj.reduce((prev, current) => {
      return (prev.msDuration > current.msDuration) ? prev : current;
    });

    //blink
    const sumMinOnscreen = sumHourOnscreen * 60
    const sumBlink = sessions.reduce((acc, session) => acc + session.data.blinkCount, 0)
    const avgBlinkPerMin = sumBlink / sumMinOnscreen

    const payload = {
      weekUsage,
      uniqueDays,
      sumHourUsage,
      avgHourUsage,
      sumHourOnscreen,
      avgHourOnscreen,
      sumMinOnscreen,
      sumBlink,
      avgBlinkPerMin,
      mostMsOnscreen,
      mostMsOnscreenInHr: mostMsOnscreen.msDuration / 3600000
    }

    res.status(200).json(payload);
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

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await Session.find({
      userId,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).sort({ createdAt: 1 });

    res.status(200).json(sessions);
  } catch (error) {
    console.error('Get sessions by date error:', error);
    res.status(500).json({
      message: 'Error getting sessions by date',
      error: error instanceof Error ? error.message : error,
    });
  }
};
