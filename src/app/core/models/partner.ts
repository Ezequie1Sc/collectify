export interface Partner {
  id: string;
  name: string;
  email: string | null;
  is_active: boolean;
}

export interface PartnerCreate {
  name: string;
  email?: string | null;
}

export interface PartnerUpdate {
  name?: string;
  email?: string | null;
  is_active?: boolean;
}

export interface PartnersResponse {
  data: Partner[];
}

export interface PartnerResponse {
  data: Partner;
}