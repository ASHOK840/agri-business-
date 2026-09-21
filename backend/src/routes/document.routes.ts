import { Router } from 'express';
import {
  getFarmerPurchaseReceipt,
  getFarmerPaymentReceipt,
  getBuyerSalesInvoice,
  getBuyerPaymentReceipt,
} from '../controllers/document.controller';
import { authenticate } from '../middleware/authenticate.middleware';
import { authorize } from '../middleware/authorize.middleware';

const router = Router();

// Admin-only — these documents surface purchase/sale amounts, which are
// accounting information off-limits to Staff and Transportation.
//
// Read-only — a GET here assembles the document's current figures live
// (assigning a stable document number on first view) rather than
// creating/editing any record. No PDF bytes are ever stored; a future
// PDF-rendering step consumes this same JSON shape.
router.use(authenticate, authorize('ADMIN'));

router.get('/purchases/:purchaseId/receipt', getFarmerPurchaseReceipt);
router.get('/purchases/:purchaseId/payment-receipt', getFarmerPaymentReceipt);
router.get('/sales/:saleId/invoice', getBuyerSalesInvoice);
router.get('/buyer-payments/:buyerPaymentId/receipt', getBuyerPaymentReceipt);

export default router;
