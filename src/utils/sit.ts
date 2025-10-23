export interface RiskInfo {
    risk: 'low' | 'medium' | 'high';
    message: string;
    avg?: number;
    raw?: number;
}

export function getOnscreenRisk(totalMinutes: number, forDay: 1 | 7): RiskInfo {
    const avg = forDay === 7 ? totalMinutes / 7 : totalMinutes;

    if (avg > 480) { // มากกว่า 8 ชม./วัน
        return {
            risk: 'high',
            message:
                'คุณนั่งรวมมากกว่า 8 ชั่วโมงต่อวัน เสี่ยงออฟฟิศซินโดรม ควรพักยืดเส้นหรือเดินทุก 30–60 นาที',
            avg,
            raw: totalMinutes,
        };
    } else if (avg >= 240) { // 4–8 ชม./วัน
        return {
            risk: 'medium',
            message:
                'คุณนั่งรวม 4–8 ชั่วโมงต่อวัน ควรลุกยืดเส้นหรือเปลี่ยนอิริยาบถระหว่างวันให้บ่อยขึ้น',
            avg,
            raw: totalMinutes,
        };
    } else {
        return {
            risk: 'low',
            message:
                'คุณนั่งรวมไม่เกิน 4 ชั่วโมงต่อวัน ถือว่าอยู่ในเกณฑ์ดี ควรรักษาพฤติกรรมนี้ไว้',
            avg,
            raw: totalMinutes,
        };
    }
}


export function getSitMaxRisk(badCount: number, forDay: 1 | 7): RiskInfo {
    const avg = forDay === 7 ? badCount / 7 : badCount;

    if (avg > 7) {
        return {
            risk: 'high',
            message: 'คุณนั่งต่อเนื่องเกิน 20 นาทีบ่อยเกินไป เสี่ยงต่อ Office Syndrome และกล้ามเนื้อล้า ควรลุกยืดเส้นทุก 20–30 นาที',
            avg: avg
        };
    } else if (avg >= 4) {
        return {
            risk: 'medium',
            message: 'คุณนั่งต่อเนื่องเกิน 20 นาทีบ่อยระดับปานกลาง ควรตั้งเตือนพักบ้างในแต่ละช่วง',
            avg: avg
        };
    } else {
        return {
            risk: 'low',
            message: 'คุณพักระหว่างการนั่งได้ดี พฤติกรรมนี้เหมาะสมต่อสุขภาพ',
            avg: avg
        };
    }
}