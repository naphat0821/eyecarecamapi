export interface RiskInfo {
    risk: 'low' | 'medium' | 'high';
    message: string;
    avg?: number;
    raw?: number;
}

export function getNeckPostureRisk(badCount: number, forDay: 1 | 7): RiskInfo {
    const avg = forDay === 7 ? badCount / 7 : badCount;

    if (avg > 50) {
        return {
            risk: 'high',
            message: 'คุณก้ม/เงยคอบ่อยเกินไป เสี่ยงต่อการตึงกล้ามเนื้อคอและออฟฟิศซินโดรม ควรปรับระดับจอให้อยู่ระดับสายตา',
            avg: avg,
            raw: badCount
        };
    } else if (avg >= 21) {
        return {
            risk: 'medium',
            message: 'คุณก้ม/เงยคอค่อนข้างบ่อย ควรจัดท่านั่งและความสูงของจอให้เหมาะสม',
            avg: avg,
            raw: badCount
        };
    } else {
        return {
            risk: 'low',
            message: 'ท่าทางการนั่งและระดับคออยู่ในเกณฑ์ดี',
            avg: avg,
            raw: badCount
        };
    }
}