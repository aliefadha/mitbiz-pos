import { fetchApi } from './client';

export interface CreateSnapTokenResponse {
  snapToken: string;
  orderId: string;
  redirectUrl: string;
}

export const paymentsApi = {
  createSnapToken: async (planId: string): Promise<CreateSnapTokenResponse> => {
    return fetchApi<CreateSnapTokenResponse>('/payments/snap/token', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  },
};
