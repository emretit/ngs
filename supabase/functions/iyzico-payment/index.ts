import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  price: string;
  paidPrice: string;
  currency: string;
  basketId: string;
  paymentCard: {
    cardHolderName: string;
    cardNumber: string;
    expireMonth: string;
    expireYear: string;
    cvc: string;
  };
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    identityNumber: string;
    registrationAddress: string;
    city: string;
    country: string;
  };
  shippingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    itemType: string;
    price: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('IYZICO_API_KEY');
    const secretKey = Deno.env.get('IYZICO_SECRET_KEY');
    
    if (!apiKey || !secretKey) {
      throw new Error('iyzico API credentials not configured');
    }

    const paymentRequest: PaymentRequest = await req.json();
    
    console.log('Processing iyzico payment request:', {
      basketId: paymentRequest.basketId,
      price: paymentRequest.price,
      buyer: paymentRequest.buyer.email
    });

    // iyzico API endpoint (sandbox veya production)
    const iyzicoUrl = 'https://sandbox-api.iyzipay.com/payment/auth';
    
    // Prepare request body for iyzico
    const iyzicoRequest = {
      locale: 'tr',
      conversationId: paymentRequest.basketId,
      price: paymentRequest.price,
      paidPrice: paymentRequest.paidPrice,
      currency: paymentRequest.currency || 'TRY',
      installment: 1,
      basketId: paymentRequest.basketId,
      paymentChannel: 'WEB',
      paymentGroup: 'PRODUCT',
      paymentCard: paymentRequest.paymentCard,
      buyer: paymentRequest.buyer,
      shippingAddress: paymentRequest.shippingAddress,
      billingAddress: paymentRequest.billingAddress,
      basketItems: paymentRequest.basketItems
    };

    // Create authorization header
    const randomString = Math.random().toString(36).substring(7);
    const authString = `apiKey:${apiKey}&randomKey:${randomString}&signature:${secretKey}`;
    const authHeader = btoa(authString);

    // Make request to iyzico
    const response = await fetch(iyzicoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `IYZIPAY ${authHeader}`,
        'x-iyzi-rnd': randomString,
      },
      body: JSON.stringify(iyzicoRequest),
    });

    const result = await response.json();
    
    console.log('iyzico payment response:', {
      status: result.status,
      paymentId: result.paymentId,
      conversationId: result.conversationId
    });

    if (result.status === 'success') {
      return new Response(
        JSON.stringify({
          success: true,
          paymentId: result.paymentId,
          conversationId: result.conversationId,
          price: result.price,
          paidPrice: result.paidPrice,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.errorMessage || 'Ödeme işlemi başarısız',
          errorCode: result.errorCode
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

  } catch (error) {
    console.error('Error processing payment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message || 'Ödeme işlemi sırasında bir hata oluştu'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
