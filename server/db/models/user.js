const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

let UserSchema = new mongoose.Schema({
	userName: {
		type: String,
		required: true,
		minlenght: 2,
		trim: true
	},
	email: {
		type: String,
		required: true,
		trim: true,
		minlenght: 1,
		unique: true,
		validate: {
          validator: (value) => {
            return validator.isEmail(value);
          },
          message: '{VALUE} is not a valid email!'
        }
	},
	password: {
		type: String,
		minlenght: 6,
		required: true
	},
	socialId: {
		type: String,
		minlenght: 6,
		required: true
	},
	pic: {
		type: String,
		required: true,
		minlenght: 2,
		trim: true
	}
});

UserSchema.methods.toJSON = function(){
	let user = this;
	let userObject = user.toObject();

	return _.pick(userObject, ['_id','userName','email'])
}

UserSchema.methods.generateSocialAuthToken = function(){
	let user = this;
	let access = 'socialAuth';
	let token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET, { expiresIn: 60 * 60 }).toString();

	return token
}
UserSchema.methods.generateFinalAuthToken = function(){
	let user = this;
	let access = 'finalAuth';
	let token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET, { expiresIn: 60 * 60 }).toString();

	return token
}

// UserSchema.methods.generateAuthToken = function(){
// 	let user = this;
// 	let access = 'auth';
// 	let token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET, { expiresIn: 60 * 60 * 24 * 30 * 12 }).toString();
// 	user.tokens.push({access,token});

// 	return user.save().then(() => {
// 		return token
// 	});
// }

// UserSchema.methods.removeToken = function(token){
// 	let user = this;
// 	return user.update({
// 		$pull: {
// 			tokens: {token}
// 		}
// 	});
// }
UserSchema.statics.findBySocialToken = function(token){
	let User = this;
	let decoded;
	try {
	  decoded = jwt.verify(token, process.env.JWT_SECRET);
	} catch(err) {
		return Promise.reject();
	}
	if(decoded.access === 'socialAuth'){
		return User.findOne({
			'_id': decoded._id
		});
	}else{
		return Promise.reject();
	}
}
UserSchema.statics.findByFinalToken = function(token){
	let User = this;
	let decoded;
	try {
	  decoded = jwt.verify(token, process.env.JWT_SECRET);
	} catch(err) {
		// console.log(err.name);
		// console.log(err.message);
		// console.log(err.expiredAt);
		return Promise.reject();
	}

	if(decoded.access === 'finalAuth'){
		return User.findOne({
			'_id': decoded._id
		});
	}else{
		return Promise.reject();
	}
}
UserSchema.statics.findByCredentials = function(email, password){
	User = this;
	return User.findOne({email}).then((user) => {
		if(!user){
			return Promise.reject();
		}
		return new Promise((resolve, reject) => {
			bcrypt.compare(password, user.password, (err, res) => {
				if(res){
					resolve(user);
				}else{
					reject();
				}
			});
		});
	});
}

UserSchema.pre('save', function(next){
	let user = this;
	if(user.isModified('password')){
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(user.password, salt, (err, hash) => {
				user.password = hash;
				next();
			});
		});
	}else{
		next();
	}
});

let User = mongoose.model('User', UserSchema);

module.exports = {User}