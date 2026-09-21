import apiClient from './apiClient';
import type { BusinessProfile, BusinessProfileFormData } from '../types/businessProfile.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export const getBusinessProfile = async (): Promise<BusinessProfile | null> => {
  const response = await apiClient.get<ApiEnvelope<BusinessProfile | null>>('/business-profile');
  return response.data.data;
};

export const saveBusinessProfile = async (
  data: BusinessProfileFormData
): Promise<BusinessProfile> => {
  const response = await apiClient.put<ApiEnvelope<BusinessProfile>>('/business-profile', data);
  return response.data.data;
};

export const uploadBusinessLogo = async (file: File): Promise<BusinessProfile> => {
  const formData = new FormData();
  formData.append('logo', file);

  const response = await apiClient.post<ApiEnvelope<BusinessProfile>>(
    '/business-profile/logo',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data.data;
};
