const axios = require("axios");
const moment = require("moment");

const getAccessToken = async () => {

    const consumerKey = process.env.CONSUMER_KEY;
    const consumerSecret = process.env.CONSUMER_SECRET;

    const auth =
        Buffer.from(
            `${consumerKey}:${consumerSecret}`
        ).toString("base64");

    const response = await axios.get(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
            headers: {
                Authorization: `Basic ${auth}`
            }
        }
    );

    return response.data.access_token;
};

exports.stkPush = async (req, res) => {

    try {

        const token = await getAccessToken();

        const phone = req.body.phone;
        const amount = req.body.amount;

        const shortcode = "174379";

        const passkey =
            "PASTE_SANDBOX_PASSKEY_HERE";

        const timestamp =
            moment().format("YYYYMMDDHHmmss");

        const password =
            Buffer.from(
                shortcode + passkey + timestamp
            ).toString("base64");

        const response = await axios.post(

            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",

            {
                BusinessShortCode: shortcode,
                Password: password,
                Timestamp: timestamp,
                TransactionType:
                    "CustomerPayBillOnline",
                Amount: amount,
                PartyA: phone,
                PartyB: shortcode,
                PhoneNumber: phone,

                CallBackURL:
                    "https://your-domain.com/api/payment/callback",

                AccountReference:
                    "MEGHAWATT",

                TransactionDesc:
                    "Restaurant Order"
            },

            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }

        );

        res.json(response.data);

    } catch (error) {

        console.log(error.response?.data);

        res.status(500).json({
            message: "Payment failed"
        });

    }

};