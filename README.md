#  Magento 2 PayPal PLUS

PayPal PLUS is a solution where PayPal offers PayPal, Credit Card, Direct Debit (ELV) and Pay Upon Invoice (Kauf auf Rechnung) as individual payment options on the payment selection page. These payment methods cover around 80% customer demand in Germany.

No matter how customer chooses to pay, it is always a single PayPal transaction for merchant, including all resulting advantages like Seller Protection and easy refund.

Based on the payment method selected by the buyer, he will be presented with either the PayPal Login page or an input mask for bank / credit card details. Should PayPal PLUS service be unavailable, standard Magento payment methods will be displayed.

## Installation

To install the Magento 2 PayPal PLUS extension you need to require our module.

There are two possibilities:

1. Run the command _composer require iwaysgmbh/module-pay-pal-plus_
2. Add it manually to your _composer.json_

    "require": {
        "iwaysgmbh/module-pay-pal-plus": "~1.0.0"
    }

## Enable our module in Magento

To enable our module via Magento 2 CLI go to your Magento root and run:

    bin/magento module:enable --clear-static-content Iways_PayPalPlus

In order to initialize database updates please run following command afterwards:

    bin/magento setup:upgrade

Depending on your Magento 2 installation setup, you may want to run following additional command:

	bin/magento setup:di:compile

The Magento 2 PayPal PLUS module should now be installed and ready to use.

## Issues
Please use our Servicedesk at: https://support.i-ways.net/hc/de
