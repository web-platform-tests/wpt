const defaultCurrency = Object.freeze({ value: "1.0", currency: "USD" });
const defaultTotal = Object.freeze({ label: "Total", amount: defaultCurrency });
const defaultDetails = Object.freeze({ total: defaultTotal });
const methodCard = Object.freeze({
  supportedMethods: ["basic-card"],
});

const defaultBillingAddress = Object.freeze({
  addressLine: ["1 web st"],
  city: "w3c",
  country: "AF",
  dependentLocality: "",
  languageCode: "",
  organization: "",
  phone: "+9312345678910",
  postalCode: "1234",
  recipient: "web platform test",
  region: "",
  sortingCode: "",
});

const defaultVisa = {
  billingAddress: defaultBillingAddress,
  cardNumber: "4111111111111111",
  cardSecurityCode: "123",
  cardholderName: "web platform test",
  expiryMonth: "01",
  expiryYear: "2026",
};

async function getCardResponse(data) {
  const method = Object.assign({ data }, methodCard);
  const response = await new PaymentRequest([method], defaultDetails).show();
  await response.complete("success");
  return response.details;
}
