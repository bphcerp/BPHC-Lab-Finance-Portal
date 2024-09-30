import mongoose, {Schema} from 'mongoose';

const projectSchema = new Schema({
	project_name: { type: String, required: true },
	start_date: { type: Date},
	end_date: { type: Date},
	total_amount: {type: Number, required: true},
	project_heads: { type: Map, of: [Number], required: true }
});

export const ProjectModel = mongoose.model('Project', projectSchema);
