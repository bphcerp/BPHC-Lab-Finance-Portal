import mongoose, { Schema } from 'mongoose';

const MemberSchema = new Schema({
    _id : { type : Schema.Types.ObjectId , default : null},
    institute_id : {type : String, unique : true, required : true},
    name: { type: String, required: true, unique: true },
    type: { type: String, required: true}
});

export const MemberModel = mongoose.model('members', MemberSchema);