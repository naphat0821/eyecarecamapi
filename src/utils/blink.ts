type BlinkRisk = 'low' | 'medium' | 'high';
type BlinkRiskInfo = {
    risk: BlinkRisk;
    message: string;
    avg?: number;
    raw?: number;
};

export function getBlinkRisk(blinkPerMin:number, forDay: 1 | 7): BlinkRiskInfo {
    if (forDay === 7) {
        if (blinkPerMin < 5 ) {
            return { risk: 'high', message: 'อัตราการกระพริบตาของคุณต่ำมาก ซึ่งอาจนำไปสู่อาการตาล้าและไม่สบายตา ลองพักสายตาเป็นระยะๆ และปฏิบัติตามกฎ 20-20-20', avg: blinkPerMin };
        } else if (blinkPerMin < 11) {
            return {
                risk: 'medium', message: 'อัตราการกระพริบตาของคุณต่ำกว่าค่าเฉลี่ย พยายามกระพริบตาให้บ่อยขึ้นเพื่อรักษาความชุ่มชื้นและความสบายตา', avg: blinkPerMin };
        } else {
            return { risk: 'low', message: 'อัตราการกระพริบตาของคุณดีมากเลย รักษาสุขภาพดวงตาให้ดีต่อไปนะ!', avg: blinkPerMin };
        }
    } else {
        if (blinkPerMin < 8) {
            return { risk: 'high', message: 'อัตราการกระพริบตาของคุณต่ำมาก ซึ่งอาจนำไปสู่อาการตาล้าและไม่สบายตา ลองพักสายตาเป็นระยะๆ และปฏิบัติตามกฎ 20-20-20', avg: blinkPerMin };
        } else if (blinkPerMin <= 15) {
            return { risk: 'medium', message: 'อัตราการกระพริบตาของคุณต่ำกว่าค่าเฉลี่ย พยายามกระพริบตาให้บ่อยขึ้นเพื่อรักษาความชุ่มชื้นและความสบายตา', avg: blinkPerMin };
        } else {
            return { risk: 'low', message: 'อัตราการกระพริบตาของคุณดีมากเลย รักษาสุขภาพดวงตาให้ดีต่อไปนะ!', avg: blinkPerMin };
        }
    }
    
}