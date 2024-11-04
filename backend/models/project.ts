import mongoose, { Schema } from 'mongoose';

const projectSchema = new Schema({
    project_name: { type: String, required: true },
    start_date: { type: Date },
    end_date: { type: Date },
    total_amount: { type: Number, required: true },
    project_heads: { type: Map, of: [Number], required: true },
    pis: { type: [String], required: true }, // Array of Principal Investigators (PIs)
    copis: { type: [String], required: true }, // Array of Co-Principal Investigators (Co-PIs)
    sanction_letter_file_id: { type: Schema.Types.ObjectId, ref: 'uploads.files' }, // Reference to GridFS file ID
    description : {type : String, default : null}
});

export const ProjectModel = mongoose.model('Project', projectSchema);