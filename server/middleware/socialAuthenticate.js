let {User} = require('./../db/models/user');

let socialAuthenticate = (req, res, next) => {
	let token = req.header('social-x-auth');

	User.findBySocialToken(token).then((user) => {
		if(!user){
			return Promise.reject();
		}
		req.user = user;
		req.token = token;
		next();
	}).catch((e) => {
		res.status(401).send();
	});
};

module.exports = {socialAuthenticate};