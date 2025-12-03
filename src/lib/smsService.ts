import useSmsImportStore from '@/store/smsImportStore';

type IncomingMessage = {
    body?: string;
    originatingAddress?: string;
    timestamp?: number | string;
};

const amountRegex = /(?:Rs\.?|INR|₹)\s?([0-9,]+(?:\.\d{1,2})?)/i;
const bankRegex = /(HDFC|ICICI|SBI|State Bank|AXIS|Axis|Kotak|PhonePe|Google Pay|GooglePay|GPay|BHIM|Paytm|UPI|NPCI)/i;

function parseAmount(text: string): number | null {
    const m = text.match(amountRegex);
    if (!m) return null;
    const num = m[1].replace(/,/g, '');
    const v = parseFloat(num);
    if (isNaN(v)) return null;
    return v;
}

function parseBank(text: string): string | null {
    const m = text.match(bankRegex);
    if (!m) return null;
    return m[1];
}

function extractTitle(text: string): string {
    // crude heuristics: look for 'at <merchant>' or 'to <merchant>' or long token
    const atMatch = text.match(/(?:at|to|via)\s+([A-Za-z0-9 &.-]{3,40})/i);
    if (atMatch) return atMatch[1].trim();
    // fallback: first 50 chars
    return text.slice(0, 80);
}

export const parseSms = (raw: string) => {
    const amount = parseAmount(raw);
    const bank = parseBank(raw);
    const title = extractTitle(raw);
    return { amount, bank, title };
};

export const aiSMSParse = async (raw: string) => {
    // use AI classifier to extract fields
    const apiKey = "AIzaSyA_4ptYrQCcHFLtYGFYbd7SJl5ajK3O0q0";
    const prompt = `From this SMS, return ONLY:
    {"amount":A,"category":"C","date":"D","name":"N"}
    Rules:
    - A = amount in SMS
    - C = closest of [Food,Bills,Travel,Health,Entertainment,Shopping,Other]
    - D = date in SMS, else now (ISO8601)
    - N = merchant/description`;
    try {

        const model = "gemini-2.0-flash-lite";

        const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

        const body = {
            contents: [
                {
                    parts: [
                        {
                            text: `From this SMS return JSON:
{"amount":A,"category":"C","date":"D","name":"N"}
A=amount, C from [Food,Bills,Travel,Health,Entertainment,Shopping,Other],
D=date or now ISO8601, N=merchant.`
                        },
                        { text: raw }
                    ]
                }
            ]
        };

        const res = await fetch(`${url}?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        return res;
    } catch (e) {
        console.warn('AI SMS parse failed, falling back to regex parse', e);
        return { category: null, confidence: 0 };
    }
};

export const handleIncomingSms = async (message: IncomingMessage) => {
    try {
        const body = message.body || '';
        const { amount, bank, title } = parseSms(body);

        // Only consider messages that look like transactions
        if (!amount) return null;

        // Debug log parsed values so we can verify parsing in dev
        // eslint-disable-next-line no-console
        console.log('[smsService] parsed incoming SMS', { amount, bank, title, raw: body });

        const date = message.timestamp ? new Date(Number(message.timestamp)).toISOString() : new Date().toISOString();

        await useSmsImportStore.getState().addPending({
            raw_text: body,
            amount,
            title,
            bank,
            date,
        });

        // eslint-disable-next-line no-console
        console.log('[smsService] pending import created');
        return true;
    } catch (e) {
        console.warn('[smsService] handleIncomingSms error', e);
        return null;
    }
};

export default { parseSms, handleIncomingSms };
