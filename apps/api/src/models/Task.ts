import { Schema, model, type InferSchemaType } from 'mongoose';
export const taskStatuses = ['pending', 'processing', 'completed', 'failed'] as const;
const taskSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 140, index: 'text' },
  description: { type: String, trim: true, maxlength: 3000, default: '' },
  status: { type: String, enum: taskStatuses, default: 'pending', index: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium', index: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  scheduledFor: { type: Date, default: null, index: true },
  attempts: { type: Number, default: 0 },
  lastError: { type: String, default: null },
  attachment: { filename: String, path: String, mimeType: String, size: Number }
}, { timestamps: true, versionKey: false });
taskSchema.index({ ownerId: 1, status: 1, createdAt: -1 });
export type TaskDocument = InferSchemaType<typeof taskSchema>;
export const Task = model('Task', taskSchema);
