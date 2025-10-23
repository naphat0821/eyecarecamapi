import { Request, Response } from 'express';
import Session, { SessionData } from '../models/Session';
import mongoose from 'mongoose';

import moment from "moment-timezone";

import { getBlinkRisk } from '../utils/blink';
import { getDistanceRisk } from '../utils/onscreenDistance';
import { getOnscreenRisk, getSitMaxRisk } from '../utils/sit';
import { getNeckPostureRisk } from '../utils/neck';
import { getNotMoveRisk } from '../utils/move';

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

const getChartSeriesOld = (sessions: SessionData[]): { x: string; y: number }[] => {
  if (!sessions?.length) return [];

  const countsByDay = sessions.reduce((map, session) => {
    const day = session.createdAt.toISOString().slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
  console.log(countsByDay)
  return Array.from(countsByDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([x, y]) => ({ x, y }));
}

const getChartSeries = (sessions: SessionData[]): { x: string; y: number }[] => {
  if (!sessions?.length) return [];

  const usageByDay = sessions.reduce((map, session) => {
    const day = moment(session.createdAt).tz("Asia/Bangkok").format("YYYY-MM-DD");
    map.set(day, (map.get(day) ?? 0) + 1);
    return map;
  }, new Map<string, number>());

  return Array.from(usageByDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([x, y]) => ({ x, y }));
};


export const getThisWeekDataOld = async (req: Request, res: Response) => {
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

    if (!sessions.length) {
      return res.status(404).json({ message: "Session not found or dont have" })
    }

    const weekUsage = sessions.length;
    const dailyChartSeries = getChartSeries(sessions)

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

    type onScreenType = {
      msDuration: number,
      start: number,
      end: number,
    }
    const onScreenObj: onScreenType[] = sessions.map((session) => {
      const perSessionMs = (session.data.sit.sitted || []).map((sit: any) => {
        const start = sit?.start ?? 0;
        const end = sit?.end ?? 0;
        return { msDuration: end - start, start, end };
      });

      return perSessionMs

    }).flat()

    const mostMsOnscreen = onScreenObj.length
      ? onScreenObj.reduce((prev, current) => (prev.msDuration > current.msDuration ? prev : current))
      : { msDuration: 0, start: 0, end: 0 };

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
      mostMsOnscreenInHr: mostMsOnscreen.msDuration / 3600000,
      dailyChartSeries,
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

const getNeckPostureChartSeries = (sessions: SessionData[]): { x: string; y: number }[] => {
  if (!sessions?.length) return [];

  const neckBadCountByDay = sessions.reduce((map, session) => {
    const day = moment(session.createdAt).tz("Asia/Bangkok").format("YYYY-MM-DD");
    const neckBadCount = session.data.neck?.neckBadCount ?? 0;
    map.set(day, (map.get(day) ?? 0) + neckBadCount);
    return map;
  }, new Map<string, number>());

  return Array.from(neckBadCountByDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([x, y]) => ({ x, y }));
};

const getOnScreenTimeChartSeries = (sessions: SessionData[]): { x: string; y: number }[] => {
  if (!sessions?.length) return [];

  const onScreenTimeByDay = sessions.reduce((map, session) => {
    const day = moment(session.createdAt).tz("Asia/Bangkok").format("YYYY-MM-DD");
    const sessionOnScreenTime = (session.data.sit?.sitted || []).reduce(
      (sum: number, sit: any) => sum + ((sit.end ?? 0) - (sit.start ?? 0)),
      0
    );
    map.set(day, (map.get(day) ?? 0) + sessionOnScreenTime);
    return map;
  }, new Map<string, number>());

  return Array.from(onScreenTimeByDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([x, y]) => ({ x, y: y / 60000 })); // convert ms to minutes
};

export const getThisWeekData = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    // thai timezone last 7 days
    const endDate = moment.tz("Asia/Bangkok").endOf("day").toDate();
    const startDate = moment.tz("Asia/Bangkok").subtract(6, "days").startOf("day").toDate();

    console.log("Start of Week:", startDate.toISOString());
    console.log("End of Week:", endDate.toISOString());

    const sessions = await Session.find({
      userId,
      createdAt: { $gte: startDate, $lte: endDate },
    }).sort({ createdAt: 1 });

    if (!sessions.length) {
      return res.status(404).json({ message: "No session found this week" });
    }


    const weekUsage = sessions.length;

    // all unique days in this week
    const uniqueDays = [...new Set(
      sessions.map(s => s.createdAt.toISOString().split("T")[0])
    )];


    const sumHourUsage =
      sessions.reduce((acc, s) => acc + ((s.data.endAt ?? 0) - (s.data.startAt ?? 0)), 0) / 3600000;

    const sumNotMove = sessions.reduce((acc, s) => acc + (s.data.move.notMoveMaxCount ?? 0), 0);
    const sumMaxSitting = sessions.reduce((acc, s) => acc + (s.data.sit.sitMaxTimeCount ?? 0), 0);

    const avgHourUsage = sumHourUsage / uniqueDays.length;

    // sum on-screen time (hours)
    const sumHourOnscreen =
      sessions.reduce((acc, s) => {
        const totalSitMs = (s.data.sit?.sitted || []).reduce(
          (sum: number, sit: any) => sum + ((sit.end ?? 0) - (sit.start ?? 0)),
          0
        );
        return acc + totalSitMs;
      }, 0) / 3600000;

    const avgHourOnscreen = sumHourOnscreen / uniqueDays.length;

    const onScreenObj = sessions.flatMap((s) =>
      (s.data.sit?.sitted || []).map((sit: any) => ({
        msDuration: (sit.end ?? 0) - (sit.start ?? 0),
        start: sit.start ?? 0,
        end: sit.end ?? 0,
      }))
    );

    const mostMsOnscreen = onScreenObj.length
      ? onScreenObj.reduce((max, cur) => (cur.msDuration > max.msDuration ? cur : max))
      : { msDuration: 0, start: 0, end: 0 };

    const sumMinOnscreen = sumHourOnscreen * 60;
    const sumBlink = sessions.reduce((acc, s) => acc + (s.data.blinkCount ?? 0), 0);
    const avgBlinkPerMin = sumMinOnscreen > 0 ? sumBlink / sumMinOnscreen : 0;

    const dailyChartSeries = getChartSeries(sessions);
    const neckPostureChartSeries = getNeckPostureChartSeries(sessions);
    const onScreenTimeChartSeries = getOnScreenTimeChartSeries(sessions);

    const distanceCount = sessions.reduce((acc, s) => acc + (s.data.diatance?.badCount ?? 0), 0);
    const neckBadCount = sessions.reduce((acc, s) => acc + (s.data.neck?.neckBadCount ?? 0), 0);

    // ==========================
    const payload = {
      sessions,
      startDate,
      endDate,
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
      mostMsOnscreenInHr: mostMsOnscreen.msDuration / 3600000,
      dailyChartSeries,
      neckPostureChartSeries,
      onScreenTimeChartSeries,
      sumNotMove,
      sumMaxSitting,
      recommendations: [
        {
          type: 'blinkRisk',
          info: getBlinkRisk(avgBlinkPerMin, 7),
        },
        {
          type: 'distanceRisk',
          info: getDistanceRisk(distanceCount, 7),
        },
        {
          type: 'totalOnScreenRisk',
          info: getOnscreenRisk(sumMinOnscreen, 7),
        },
        {
          type: 'overMaxOnScreenRisk',
          info: getSitMaxRisk(sumMaxSitting, 7),
        },
        {
          type: 'neckRisk',
          info: getNeckPostureRisk(neckBadCount, 7),
        },
        {
          type: 'moveRisk',
          info: getNotMoveRisk(sumNotMove, 7),
        }
      ],
    };

    res.status(200).json(payload);
  } catch (error) {
    console.error("Get this week data error:", error);
    res.status(500).json({
      message: "Error getting this week data",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getSessionsByDateOld = async (req: Request, res: Response) => {
  try {
    const { userId, date } = req.body;
    if (!userId || !date) {
      return res.status(400).json({ message: 'Invalid userId or date' });
    }

    // const startOfDay = new Date(date);
    // startOfDay.setHours(0, 0, 0, 0);

    // const endOfDay = new Date(date);
    // endOfDay.setHours(23, 59, 59, 999);
    // console.log('raw date:', date);
    // console.log('Start of Day:', startOfDay);
    // console.log('End of Day:', endOfDay);

    const startOfDay = new Date(`${date}T00:00:00+07:00`);
    const endOfDay = new Date(`${date}T23:59:59.999+07:00`);

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


const getOnScreenTimeChartSeriesByHour = (sessions: SessionData[]): { x: string; y: number }[] => {
  if (!sessions?.length) return [];

  const onScreenTimeByHour = new Map<string, number>();

  sessions.forEach(session => {
    (session.data.sit?.sitted || []).forEach(sit => {
      const start = moment(sit.start).tz("Asia/Bangkok");
      const end = moment(sit.end).tz("Asia/Bangkok");
      let current = start.clone();

      while (current.isBefore(end)) {
        const hour = current.format("HH:00");
        const nextHour = current.clone().endOf('hour');
        const diff = moment.min(end, nextHour).diff(current);
        onScreenTimeByHour.set(hour, (onScreenTimeByHour.get(hour) ?? 0) + diff);
        current = nextHour.add(1, 'millisecond');
      }
    });
  });

  const sortedByHour = Array.from(onScreenTimeByHour.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([x, y]) => ({ x, y: y / 60000 })); // convert ms to minutes

  //fill data
  const filledData = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0') + ':00';
    const data = sortedByHour.find(d => d.x === hour);
    if (data) {
      filledData.push(data);
    } else {
      filledData.push({ x: hour, y: 0 });
    }
  }
  return filledData

};

export const getTodayData = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    // thai timezone today
    const startDate = moment.tz("Asia/Bangkok").startOf("day").toDate();
    const endDate = moment.tz("Asia/Bangkok").endOf("day").toDate();

    const sessions = await Session.find({
      userId,
      createdAt: { $gte: startDate, $lte: endDate },
    }).sort({ createdAt: 1 });

    if (!sessions.length) {
      return res.status(404).json({ message: "No session found today" });
    }


    const todayUsage = sessions.length;

    const sumHourUsage =
      sessions.reduce((acc, s) => acc + ((s.data.endAt ?? 0) - (s.data.startAt ?? 0)), 0) / 3600000;

    const sumNotMove = sessions.reduce((acc, s) => acc + (s.data.move.notMoveMaxCount ?? 0), 0);
    const sumMaxSitting = sessions.reduce((acc, s) => acc + (s.data.sit.sitMaxTimeCount ?? 0), 0);

    // sum on-screen time (hours)
    const sumHourOnscreen =
      sessions.reduce((acc, s) => {
        const totalSitMs = (s.data.sit?.sitted || []).reduce(
          (sum: number, sit: any) => sum + ((sit.end ?? 0) - (sit.start ?? 0)),
          0
        );
        return acc + totalSitMs;
      }, 0) / 3600000;


    const onScreenObj = sessions.flatMap((s) =>
      (s.data.sit?.sitted || []).map((sit: any) => ({
        msDuration: (sit.end ?? 0) - (sit.start ?? 0),
        start: sit.start ?? 0,
        end: sit.end ?? 0,
      }))
    );

    const mostMsOnscreen = onScreenObj.length
      ? onScreenObj.reduce((max, cur) => (cur.msDuration > max.msDuration ? cur : max))
      : { msDuration: 0, start: 0, end: 0 };

    const sumMinOnscreen = sumHourOnscreen * 60;
    const sumBlink = sessions.reduce((acc, s) => acc + (s.data.blinkCount ?? 0), 0);
    const avgBlinkPerMin = sumMinOnscreen > 0 ? sumBlink / sumMinOnscreen : 0;

    const dailyChartSeries = getChartSeries(sessions);
    const neckPostureChartSeries = getNeckPostureChartSeries(sessions);
    const onScreenTimeChartSeries = getOnScreenTimeChartSeriesByHour(sessions);

    const distanceCount = sessions.reduce((acc, s) => acc + (s.data.diatance?.badCount ?? 0), 0);
    const neckBadCount = sessions.reduce((acc, s) => acc + (s.data.neck?.neckBadCount ?? 0), 0);
    // ==========================
    const payload = {
      sessions,
      startDate,
      endDate,
      todayUsage,
      sumHourUsage,
      sumHourOnscreen,
      sumMinOnscreen,
      sumBlink,
      avgBlinkPerMin,
      recommendations: [
        {
          type: 'blinkRisk',
          info: getBlinkRisk(avgBlinkPerMin, 1),
        },
        {
          type: 'distanceRisk',
          info: getDistanceRisk(distanceCount, 1),
        },
        {
          type: 'totalOnScreenRisk',
          info: getOnscreenRisk(sumMinOnscreen, 1),
        },
        {
          type: 'overMaxOnScreenRisk',
          info: getSitMaxRisk(sumMaxSitting, 1),
        },
        {
          type: 'neckRisk',
          info: getNeckPostureRisk(neckBadCount, 1),
        },
        {
          type: 'moveRisk',
          info: getNotMoveRisk(sumNotMove, 1),
        }
      ],
      mostMsOnscreen,
      mostMsOnscreenInHr: mostMsOnscreen.msDuration / 3600000,
      dailyChartSeries,
      neckPostureChartSeries,
      onScreenTimeChartSeries,
      sumNotMove,
      sumMaxSitting
    };

    res.status(200).json(payload);
  } catch (error) {
    console.error("Get today data error:", error);
    res.status(500).json({
      message: "Error getting today data",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getSessionsByDate = async (req: Request, res: Response) => {
  try {
    const { userId, date } = req.body;
    if (!userId || !date) {
      return res.status(400).json({ message: "Invalid userId or date" });
    }

    const startOfDay = moment.tz(date, "Asia/Bangkok").startOf("day").toDate();
    const endOfDay = moment.tz(date, "Asia/Bangkok").endOf("day").toDate();

    console.log("Raw date:", date);
    console.log("Start of Day (local):", startOfDay);
    console.log("End of Day (local):", endOfDay);

    const sessions = await Session.find({
      userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ createdAt: 1 });

    res.status(200).json(sessions);
  } catch (error) {
    console.error("Get sessions by date error:", error);
    res.status(500).json({
      message: "Error getting sessions by date",
      error: error instanceof Error ? error.message : error,
    });
  }
};
