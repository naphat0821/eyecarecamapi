type BlinkRisk = 'low' | 'medium' | 'high';
type RiskInfo = {
    risk: BlinkRisk;
    message: string;
    avg?: number;
    raw?: number;
};

export function getDistanceRisk(badCount: number, forDay: 1 | 7): RiskInfo {
    const avg = forDay === 7 ? badCount / 7 : badCount;

    if (avg > 60) {
        return {
            risk: 'high',
            message: 'คุณเข้าใกล้จอบ่อยเกินไป อาจเสี่ยงตาล้าและปวดคอ ควรปรับท่านั่ง',
            avg: avg,
            raw: badCount
        };
    } else if (avg >= 30) {
        return {
            risk: 'medium',
            message: 'คุณเข้าใกล้จอบ่อยกว่าปกติ แนะนำให้ตรวจสอบระยะห่างจากจอให้อยู่ประมาณ 40 - 70 ซม.',
            avg: avg,
            raw: badCount
        };
    } else {
        return {
            risk: 'low',
            message: 'ระยะห่างจากจออยู่ในเกณฑ์ดี',
            avg: avg,
            raw: badCount
        };
    }
}