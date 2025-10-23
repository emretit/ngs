export interface IyzicoPaymentResult {
  success: boolean;
  paymentId?: string;
  conversationId?: string;
  price?: string;
  paidPrice?: string;
  error?: string;
  errorCode?: string;
}

export interface IyzicoBasketItem {
  id: string;
  name: string;
  category: string;
  price: number;
}

export interface IyzicoBuyer {
  id: string;
  name: string;
  surname: string;
  email: string;
  identityNumber: string;
  registrationAddress: string;
  city: string;
  country: string;
}

export interface IyzicoAddress {
  contactName: string;
  city: string;
  country: string;
  address: string;
}

export interface IyzicoPaymentCard {
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string;
  expireYear: string;
  cvc: string;
}
