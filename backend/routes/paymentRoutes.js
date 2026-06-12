const express = require("express");
const router = express.Router();

const {
    stkPush
} = require(
    "../controllers/paymentController"
);

router.post(
    "/stkpush",
    stkPush
);

module.exports = router;