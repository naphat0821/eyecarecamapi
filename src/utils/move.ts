export interface RiskInfo {
    risk: 'low' | 'medium' | 'high';
    message: string;
    raw?: number;
    avg?: number;
}

export function getNotMoveRisk(badCount: number, forDay: 1 | 7): RiskInfo {
    const avg = forDay === 7 ? badCount / 7 : badCount;

    if (avg > 6) {
        return {
            risk: 'high',
            message: 'คุณไม่ขยับตัวบ่อยเกินไป เสี่ยงต่ออาการปวดหลังและไหล่ ควรลุกยืดเส้นทุก 15-20 นาที',
            avg: avg,
            raw: badCount
        };
    } else if (avg >= 4) {
        return {
            risk: 'medium',
            message: 'คุณเริ่มมีพฤติกรรมไม่ขยับตัวนานเกินไป ควรตั้งเตือนให้ขยับทุก 30 นาที',
            avg: avg,
            raw: badCount
        };
    } else {
        return {
            risk: 'low',
            message: 'คุณขยับตัวเป็นระยะอยู่แล้ว ถือว่าอยู่ในเกณฑ์ดี',
            avg: avg,
            raw: badCount
        };
    }
}