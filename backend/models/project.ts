import mongoose, { Schema } from 'mongoose';

const installmentSchema = new Schema({
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
}, { _id: false });

const projectSchema = new Schema({
    project_name: { type: String, required: true },
    project_type: { type: String, default : "yearly"},
    start_date: { type: Date },
    end_date: { type: Date },
    total_amount: { type: Number, required: true },
    project_heads: { type: Map, of: [Number], required: true },
    project_head_expenses : { type: Map, of: Number, default : {}},
    pis: { type: [String], required: true },
    copis: { type: [String], required: true },
    sanction_letter_file_id: { type: Schema.Types.ObjectId, ref: 'uploads.files' },
    description: { type: String, default: null },
    installments: { type: [installmentSchema], default: [] },
    updated_at : { type : Date},
    negative_heads : { type : [String], default : []}
});

// Add middleware to update the updated_at timestamp on save
projectSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});

// Add middleware to handle updates
projectSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
});

export const ProjectModel = mongoose.model('Project', projectSchema);
