import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);

export const createInvoiceNumber = () => `NTH-${Date.now()}-${nanoid()}`;
export const createVendorRef = (transactionId) => `NTH-DG-${transactionId}-${nanoid()}`;
