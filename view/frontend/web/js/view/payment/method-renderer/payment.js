/*browser:true*/
/*global define*/
/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://opensource.org/licenses/osl-3.0.php
 *
 * Author Robert Hillebrand - hillebrand@i-ways.de - i-ways sales solutions GmbH
 * Copyright i-ways sales solutions GmbH © 2015. All Rights Reserved.
 * License http://opensource.org/licenses/osl-3.0.php Open Software License (OSL 3.0)
 */
define(
    [
        'ko',
        'jquery',
        'underscore',
        'Magento_Checkout/js/view/payment/default',
        'Magento_Checkout/js/model/quote',
        'Magento_Checkout/js/model/payment-service',
        'Iways_PayPalPlus/js/action/patch-ppp-payment',
        'Magento_Checkout/js/model/payment/additional-validators',
        '//www.paypalobjects.com/webstatic/ppplus/ppplus.min.js'
    ],
    function (ko, $, _, Component, quote, paymentService, patchPPPPayment, additionalValidators) {
        var paypalplusConfig = window.checkoutConfig.payment.iways_paypalplus_payment;
        return Component.extend(
            {
                isPaymentMethodSelected: ko.observable(false),
                lastCall: false,
                ppp: false,
                continueCount: 0,
                selectedMethod: "iways_paypalplus_payment",
                isInitialized: false,
                lastHash: false,
                defaults: {
                    template: 'Iways_PayPalPlus/payment',
                    paymentExperience: paypalplusConfig.paymentExperience,
                    mode: paypalplusConfig.mode,
                    showPuiOnSandbox: paypalplusConfig.showPuiOnSandbox,
                    showLoadingIndicator: paypalplusConfig.showLoadingIndicator,
                    country: paypalplusConfig.country,
                    language: paypalplusConfig.language,
                    thirdPartyPaymentMethods: paypalplusConfig.thirdPartyPaymentMethods,
                },
                
                /**
                 * Function initVars
                 *
                 * @function
                 */
                initVars: function () {
                    this.paymentExperience = paypalplusConfig ? paypalplusConfig.paymentExperience : '';
                    this.mode = paypalplusConfig ? paypalplusConfig.mode : '';
                    this.country = paypalplusConfig ? paypalplusConfig.country : '';
                    this.language = paypalplusConfig ? paypalplusConfig.language : '';
                    this.showPuiOnSandbox = paypalplusConfig ? paypalplusConfig.showPuiOnSandbox : '';
                    this.showLoadingIndicator = paypalplusConfig ? paypalplusConfig.showLoadingIndicator : '';
                    this.thirdPartyPaymentMethods = paypalplusConfig ? paypalplusConfig.thirdPartyPaymentMethods : [];
                    this.paymentCodeMappings = {};
                },
                
                /**
                 * Function canInitialise
                 *
                 * @returns {*|String}
                 */
                canInitialise: function () {
                    return this.paymentExperience;
                },
                
                /**
                 * Function initObservable
                 *
                 * @override
                 */
                initObservable: function () {
                    this._super();
                    this.initVars();
                    this.startIframeChecker(this);
                    var self = this;
                    quote.billingAddress.subscribe(
                        function (newAddress) {
                            try {
                                if (self.canInitialise() && self.isInitialized && newAddress !== null && newAddress.countryId != self.country) {
                                    self.country = newAddress.countryId;
                                    self.isInitialized = false;
                                    self.initPayPalPlusFrame();
                                }
                            } catch (e) {
                                console.log(e);
                            }
                        },
                        this
                    );
                    self.selectPaymentMethod();
                    self.isPPPMethod = ko.computed(
                        function () {
                            if (quote.paymentMethod()
                                && (quote.paymentMethod().method == 'iways_paypalplus_payment'
                                || typeof self.thirdPartyPaymentMethods[quote.paymentMethod().method] !== "undefined")
                            ) {
                                return quote.paymentMethod().method;
                            }
                            self.ppp.deselectPaymentMethod();
                            return null;
                        }
                    );
                    return this;
                },
                initPayPalPlusFrame: function () {
                    var self = this;
                    if (self.canInitialise() && !self.isInitialized) {
                        self.ppp = PAYPAL.apps.PPP(
                            {
                                approvalUrl: self.paymentExperience,
                                placeholder: "ppplus",
                                mode: self.mode,
                                useraction: "commit",
                                buttonLocation: "outside",
                                showPuiOnSandbox: self.showPuiOnSandbox,
                                showLoadingIndicator: self.showLoadingIndicator,
                                country: self.getCountry(),
                                language: self.language,
                                preselection: "paypal",
                                thirdPartyPaymentMethods: self.getThirdPartyPaymentMethods(),
                                onLoad: function () {
                                    self.lastCall = 'enableContinue';
                                    var billingAgreements = $('.checkout-agreement.field.choice.required input.required-entry[type="checkbox"]');
                                    billingAgreements.on(
                                        'click',
                                        function (e) {
                                            var clickedBillingAgreements = $(this);
                                            billingAgreements.each(
                                                function () {
                                                    if ($(this).attr('name') == clickedBillingAgreements.attr('name')) {
                                                        $(this).prop('checked', clickedBillingAgreements.prop('checked'));
                                                    }
                                                }
                                            );
                                        }
                                    );
                                },
                                onThirdPartyPaymentMethodSelected: function (data) {
                                    self.lastCall = 'onThirdPartyPaymentMethodSelected';
                                    self.selectedMethod = self.paymentCodeMappings[data.thirdPartyPaymentMethod];
                                    self.selectPaymentMethod();
                                },
                                enableContinue: function () {
                                    if (self.lastCall != 'onThirdPartyPaymentMethodSelected') {
                                        self.selectedMethod = 'iways_paypalplus_payment';
                                        self.selectPaymentMethod();
                                    }
                                    self.lastCall = 'enableContinue';
                                    self.isPaymentMethodSelected = true;
                                    $("#place-ppp-order").removeAttr("disabled");
                                },
                                disableContinue: function () {
                                    self.isPaymentMethodSelected = false;
                                    $("#place-ppp-order").attr("disabled", "disabled");
                                }
                            }
                        );
                        self.isInitialized = true;
                    }
                },
                startIframeChecker: function (self) {
                    var currentHash = window.location.hash;
                    if (self.isInitialized && currentHash == "#payment" && self.lastHash != "#payment") {
                        self.isInitialized = false;
                        self.initPayPalPlusFrame();
                    }
                    self.lastHash = currentHash;
                    setTimeout(self.startIframeChecker, 1000, self);
                },
                getThirdPartyPaymentMethods: function () {
                    var self = this;
                    var pppThirdPartyMethods = [];
                    _.each(
                        self.thirdPartyPaymentMethods,
                        function (activeMethod, code) {
                            try {
                                self.paymentCodeMappings[self.thirdPartyPaymentMethods[code].methodName] = code;
                                pppThirdPartyMethods.push(self.thirdPartyPaymentMethods[code]);
                            } catch (e) {
                                console.log(e);
                            }
                        }
                    );
                    return pppThirdPartyMethods;
                },
                /**
                 * Get payment method data
                 */
                getData: function () {
                    var self = this;
                    return {
                        "method": self.selectedMethod,
                        "po_number": null,
                        "additional_data": null
                    };
                },
                placePPPOrder: function (data, event) {
                    if (event) {
                        event.preventDefault();
                    }
                    var self = this;
                    if (self.selectedMethod == "iways_paypalplus_payment") {
                        if (this.validate() && additionalValidators.validate()) {
                            patchPPPPayment(this.messageContainer, this.getData(), self.ppp);
                            return true;
                        }
                        return false;
                    } else {
                        return this.placeOrder(data, event);
                    }
                },
                getCountry: function () {
                    try {
                        if (quote.billingAddress().countryId) {
                            return quote.billingAddress().countryId;
                        }
                    } catch (e) {
                        //console.log(e);
                    }
                    return this.country;
                },
            }
        );
    }
);