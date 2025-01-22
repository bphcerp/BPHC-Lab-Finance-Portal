import mongoose, { Schema } from 'mongoose';

const installmentSchema = new Schema({
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
}, { _id: false });

const overrideSchema = new Schema({
    type: { type: String, enum: ["yearly", "invoice"], required: true },
    index: { type: Number, required: true }
})

const projectSchema = new Schema({
    project_id: { type: String, required: true, unique: true },
    project_title: { type: String, default: null },
    project_name: { type: String, required: true },
    project_type: { type: String, enum: ["yearly", "invoice"], default: 'yearly' },
    start_date: { type: Date },
    end_date: { type: Date },
    total_amount: { type: Number, required: true },
    project_heads: { type: Map, of: [Number], required: true },
    pis: [{ type: Schema.Types.ObjectId, ref: 'members', required: true }],
    copis: [{ type: Schema.Types.ObjectId, ref: 'members', required: true }],
    sanction_letter_file_id: { type: Schema.Types.ObjectId, ref: 'uploads.files' },
    description: { type: String, default: null },
    installments: { type: [installmentSchema], default: [] },
    updated_at: { type: Date },
    negative_heads: { type: [String], default: [] },
    override: { type: overrideSchema, default: null },
    carry_forward: { type: Map, of: [Number] }
});

projectSchema.pre('save', function (next) {
    this.updated_at = new Date();
    if (this.carry_forward !== undefined){
        next()
        return
    }
    let carryForward : { [key : string] : number[] } = {}
    Object.keys(this.project_heads).forEach(key => {
        carryForward[key] = new Array(this.project_heads.get(key)!.length).fill(0);
    })
    next();
});

projectSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
});

export const ProjectModel = mongoose.model('Project', projectSchema);