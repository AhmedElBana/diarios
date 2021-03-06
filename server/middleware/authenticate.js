let {User} = require('./../db/models/user');

let authenticate = (req, res, next) => {
	let token = req.header('final-x-auth');

	User.findByFinalToken(token).then((user) => {
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

module.exports = {authenticate};