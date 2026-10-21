import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    orderCode: { type: String, default: '' },
    productTitle: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    utr: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    accessUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
