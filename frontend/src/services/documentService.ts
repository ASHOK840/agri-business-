import apiClient from './apiClient';
import type {
  FarmerReceiptDocument,
  BuyerSalesInvoiceDocument,
  BuyerPaymentReceiptDocument,
} from '../types/document.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export const getFarmerPurchaseReceipt = async (purchaseId: string): Promise<FarmerReceiptDocument> => {
  const response = await apiClient.get<ApiEnvelope<FarmerReceiptDocument>>(
    `/documents/purchases/${purchaseId}/receipt`
  );
  return response.data.data;
};

export const getFarmerPaymentReceipt = async (purchaseId: string): Promise<FarmerReceiptDocument> => {
  const response = await apiClient.get<ApiEnvelope<FarmerReceiptDocument>>(
    `/documents/purchases/${purchaseId}/payment-receipt`
  );
  return response.data.data;
};

export const getBuyerSalesInvoice = async (saleId: string): Promise<BuyerSalesInvoiceDocument> => {
  const response = await apiClient.get<ApiEnvelope<BuyerSalesInvoiceDocument>>(
    `/documents/sales/${saleId}/invoice`
  );
  return response.data.data;
};

export const getBuyerPaymentReceipt = async (
  buyerPaymentId: string
): Promise<BuyerPaymentReceiptDocument> => {
  const response = await apiClient.get<ApiEnvelope<BuyerPaymentReceiptDocument>>(
    `/documents/buyer-payments/${buyerPaymentId}/receipt`
  );
  return response.data.data;
};
