(function (global) {
  "use strict";
  global.MOCK_PAYMENT_CHANNELS = [
  {
    "active": false,
    "fee": "0.0%",
    "channel": "bcacc*credit*close",
    "channel_type": "CREDIT",
    "channel_mode": "CLOSE",
    "code": "CARD",
    "provider": "BCACC*CREDIT*CLOSE",
    "minimum_amount": 1,
    "maximum_amount": 50000000,
    "is_online": true,
    "is_offline": true,
    "ots_type": "qr_image",
    "logo": "https://res.cloudinary.com/instapay/image/upload/v1635846522/payment_logo/card/creditcard.png",
    "description": {
      "en": "Bcacc (Credit)",
      "id": "Bcacc (Credit)"
    }
  },
  {
    "active": false,
    "fee": "0.0%",
    "channel": "biicc*credit*close",
    "channel_type": "CREDIT",
    "channel_mode": "CLOSE",
    "code": "CARD",
    "provider": "BIICC*CREDIT*CLOSE",
    "minimum_amount": 1,
    "maximum_amount": 9999999999999,
    "is_online": true,
    "is_offline": false,
    "ots_type": "no_ots",
    "logo": "https://res.cloudinary.com/instapay/image/upload/v1635846522/payment_logo/card/creditcard.png",
    "description": {
      "en": "Biicc (Credit)",
      "id": "Biicc (Credit)"
    }
  },
  {
    "active": false,
    "fee": "3.6%",
    "channel": "bricc*credit*close",
    "channel_type": "CREDIT",
    "channel_mode": "CLOSE",
    "code": "CARD",
    "provider": "BRICC*CREDIT*CLOSE",
    "minimum_amount": 1,
    "maximum_amount": 9999999999999,
    "is_online": true,
    "is_offline": true,
    "ots_type": "qr_image",
    "logo": "https://res.cloudinary.com/instapay/image/upload/v1635846522/payment_logo/card/creditcard.png",
    "description": {
      "en": "Bricc (Credit)",
      "id": "Bricc (Credit)"
    }
  },
  {
    "active": false,
    "fee": "0.0%",
    "channel": "bcacc*credit*installment",
    "channel_type": "CREDIT",
    "channel_mode": "INSTALLMENT",
    "code": "CARD",
    "provider": "BCACC*CREDIT*INSTALLMENT",
    "minimum_amount": 10000,
    "maximum_amount": 1000000000000,
    "is_online": true,
    "is_offline": false,
    "ots_type": "no_ots",
    "logo": "https://res.cloudinary.com/instapay/image/upload/v1635846522/payment_logo/card/creditcard.png",
    "description": {
      "en": "Bcacc (Installment)",
      "id": "Bcacc (Installment)"
    }
  },
  {
    "active": false,
    "fee": "IDR. 3.500",
    "channel": "va_permata*virtual_account*close",
    "channel_type": "VIRTUAL_ACCOUNT",
    "channel_mode": "CLOSE",
    "code": "VA",
    "provider": "PERMATA*VIRTUAL_ACCOUNT*CLOSE",
    "minimum_amount": 10000,
    "maximum_amount": 1000000000000,
    "is_online": true,
    "is_offline": false,
    "ots_type": "no_ots",
    "logo": "https://res.cloudinary.com/instapay/image/upload/v1635846534/payment_logo/bank/permata_2024.png",
    "description": {
      "en": "Va Permata (Virtual Account)",
      "id": "Va Permata (Virtual Account)"
    }
  },
  {
    "active": false,
    "fee": "IDR. 3.500",
    "channel": "va_bni*virtual_account*close",
    "channel_type": "VIRTUAL_ACCOUNT",
    "channel_mode": "CLOSE",
    "code": "VA",
    "provider": "BNI*VIRTUAL_ACCOUNT*CLOSE",
    "minimum_amount": 10000,
    "maximum_amount": 1000000000000,
    "is_online": true,
    "is_offline": false,
    "ots_type": "no_ots",
    "logo": "https://res.cloudinary.com/instapay/image/upload/v1635846533/payment_logo/bank/bni.png",
    "description": {
      "en": "Va Bni (Virtual Account)",
      "id": "Va Bni (Virtual Account)"
    }
  },
  {
    "active": false,
    "fee": "IDR. 3.500",
    "channel": "va_bri*virtual_account*close",
    "channel_type": "VIRTUAL_ACCOUNT",
    "channel_mode": "CLOSE",
    "code": "VA",
    "provider": "BRI*VIRTUAL_ACCOUNT*CLOSE",
    "minimum_amount": 10000,
    "maximum_amount": 1000000000000,
    "is_online": true,
    "is_offline": false,
    "ots_type": "no_ots",
    "logo": "https://res.cloudinary.com/instapay/image/upload/v1635846533/payment_logo/bank/bri.png",
    "description": {
      "en": "Va Bri (Virtual Account)",
      "id": "Va Bri (Virtual Account)"
    }
  },
  {
    "active": false,
    "fee": "IDR. 3.500",
    "channel": "va_bnc*virtual_account*close",
    "channel_type": "VIRTUAL_ACCOUNT",
    "channel_mode": "CLOSE",
    "code": "VA",
    "provider": "BNC*VIRTUAL_ACCOUNT*CLOSE",
    "minimum_amount": 10000,
    "maximum_amount": 9999999999999,
    "is_online": true,
    "is_offline": false,
    "ots_type": "no_ots",
    "logo": "https://res.cloudinary.com/instapay/image/upload/v1661918481/payment_logo/bank/neobank-01.png",
    "description": {
      "en": "Va Bnc (Virtual Account)",
      "id": "Va Bnc (Virtual Account)"
    }
  },
  {
    "active": false,
    "fee": "IDR. 3.500",
    "channel": "va_cimb*virtual_account*close",
    "channel_type": "VIRTUAL_ACCOUNT",
    "channel_mode": "CLOSE",
    "code": "VA",
    "provider": "CIMB*VIRTUAL_ACCOUNT*CLOSE",
    "minimum_amount": 10000,
    "maximum_amount": 1000000000,
    "is_online": true,
    "is_offline": false,
    "ots_type": "no_ots",
    "logo": "https://res.cloudinary.com/instapay/image/upload/v1635846533/payment_logo/bank/cimb.png",
    "description": {
      "en": "Va Cimb (Virtual Account)",
      "id": "Va Cimb (Virtual Account)"
    }
  },
  {
    "active": false,
    "fee": "IDR. 3.500",
    "channel": "va_mandiri_2*virtual_account*close",
    "channel_type": "VIRTUAL_ACCOUNT",
    "channel_mode": "CLOSE",
    "code": "VA",
    "provider": "MANDIRI_2*VIRTUAL_ACCOUNT*CLOSE",
    "minimum_amount": 1,
    "maximum_amount": 50000000,
    "is_online": true,
    "is_offline": false,
    "ots_type": "no_ots",
    "logo": "https://res.cloudinary.com/instapay/image/upload/v1635846533/payment_logo/bank/mandiri.png",
    "description": {
      "en": "Va Mandiri 2 (Virtual Account)",
      "id": "Va Mandiri 2 (Virtual Account)"
    }
  },
  {
    "active": false,
    "fee": "IDR. 1.000",
    "channel": "va_finpay*virtual_account*close",
    "channel_type": "VIRTUAL_ACCOUNT",
    "channel_mode": "CLOSE",
    "code": "VA",
    "provider": "FINPAY*VIRTUAL_ACCOUNT*CLOSE",
    "minimum_amount": 10000,
    "maximum_amount": 2500000,
    "is_online": true,
    "is_offline": false,
    "ots_type": "no_ots",
    "logo": "https://res.cloudinary.com/instapay/image/upload/v1636714098/payment_logo/app/virtual_account.png",
    "description": {
      "en": "Va Finpay (Virtual Account)",
      "id": "Va Finpay (Virtual Account)"
    }
  },
  {
    "active": false,
    "fee": "IDR. 3.500",
    "channel": "va_mandiri*virtual_account*close",
    "channel_type": "VIRTUAL_ACCOUNT",
    "channel_mode": "CLOSE",
    "code": "VA",
    "provider": "MANDIRI*VIRTUAL_ACCOUNT*CLOSE",
    "minimum_amount": 10000,
    "maximum_amount": 1000000000000,
    "is_online": true,
    "is_offline": false,
    "ots_type": "no_ots",
    "logo": "https://res.cloudinary.com/instapay/image/upload/v1635846533/payment_logo/bank/mandiri.png",
    "description": {
      "en": "Va Mandiri (Virtual Account)",
      "id": "Va Mandiri (Virtual Account)"
    }
  },
  {
    "active": true,
    "fee": "0.7%",
    "channel": "nobu*wallet*qr",
    "channel_type": "WALLET",
    "channel_mode": "QR",
    "code": "QRIS",
    "provider": "",
    "minimum_amount": 1000,
    "maximum_amount": 10000000,
    "is_online": true,
    "is_offline": true,
    "ots_type": "direct_webview",
    "logo": "https://res.cloudinary.com/instapay/image/upload/v1635846510/payment_logo/wallet/qris.png",
    "description": {
      "en": "Nobu (Qr)",
      "id": "Nobu (Qr)"
    }
  },
  {
    "active": true,
    "fee": "0.7%",
    "channel": "shopeepay*wallet*qr",
    "channel_type": "WALLET",
    "channel_mode": "QR",
    "code": "QRIS",
    "provider": "",
    "minimum_amount": 1000,
    "maximum_amount": 1000000000,
    "is_online": true,
    "is_offline": false,
    "ots_type": "no_ots",
    "logo": "https://res.cloudinary.com/instapay/image/upload/v1635846510/payment_logo/wallet/qris.png",
    "description": {
      "en": "Shopeepay (Qr)",
      "id": "Shopeepay (Qr)"
    }
  }
];
})(window);
