import { fetchApi } from './client';

export type RegisterAccountDto = {
  name: string;
  email: string;
  password: string;
};

export type RegisterTenantDto = {
  nama: string;
  slug: string;
  alamat?: string;
  noHp?: string;
};

export type RegisterOutletDto = {
  nama: string;
  kode: string;
  alamat?: string;
  noHp?: string;
};

export type RegisterCompleteDto = {
  account: RegisterAccountDto;
  tenant: RegisterTenantDto;
  outlet: RegisterOutletDto;
};

export type RegisterResponse = {
  tenant: {
    id: string;
    nama: string;
    slug: string;
  };
  outlet: {
    id: string;
    nama: string;
    kode: string;
    tenantId: string;
  };
};

async function registerComplete(data: RegisterCompleteDto): Promise<RegisterResponse> {
  return fetchApi('/register', {
    method: 'POST',
    data,
  });
}

export const registerApi = {
  registerComplete,
};
