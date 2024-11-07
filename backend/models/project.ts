import mongoose, { Schema } from 'mongoose';

const projectSchema = new Schema({
    project_name: { type: String, required: true },
    start_date: { type: Date },
    end_date: { type: Date },
    total_amount: { type: Number, required: true },
    project_heads: { type: Map, of: [Number], required: true },
    project_head_expenses : { type: Map, of: Number, default : {}},
    pis: { type: [String], required: true }, 
    copis: { type: [String], required: true }, 
    sanction_letter_file_id: { type: Schema.Types.ObjectId, ref: 'uploads.files' }, 
    description : {type : String, default : null}
});

export const ProjectModel = mongoose.model('Project', projectSchema);