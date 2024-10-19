import mongoose, { Schema } from 'mongoose';

const projectHeadSchema = new Schema({
    head_name: { 
        type: String, 
        required: true, 
        trim: true, 
        unique: true
    }
});

// Middleware to auto-capitalize the head_name before saving
projectHeadSchema.pre('save', function (next) {
    if (this.head_name) {
        this.head_name = this.head_name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    next();
});

export const ProjectHeadModel = mongoose.model('project_heads', projectHeadSchema);
