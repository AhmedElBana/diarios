require('./config/config');
const fs = require('fs');
const _ = require('lodash');
const bodyParser = require('body-parser');
const express = require('express');
let app = express();
app.use(bodyParser.json());

let {mongoose} = require('./db/mongoose');
let {User} = require('./db/models/user');
let {socialAuthenticate} = require('./middleware/socialAuthenticate');
let {authenticate} = require('./middleware/authenticate');

//serve the react app on some routes
app.use('/', express.static('build'));

//logs middleware
app.use((req, res, next)=>{
	let now = new Date().toString();
	let log = `${now}: ${req.method} ${req.url}`;
	console.log(log);
	fs.appendFile('server.log', log + '\n',(err)=>{
		if(err){
			console.log('Unable to append to server.log');
		}
	});
	next();
})

//--------------------------- start apis section ----------------------------
app.post('/user/create',(req,res) => {
	console.log('---------------------');
	let body = _.pick(req.body, ['userName','email','password','socialId','pic']);
	let userData = new User(body);
	console.log(userData);

	userData.save().then((user) => {
		res.send(user);
	}).catch((e) => {
		res.status(400).send(e);
	});
});
app.post('/login/social', (req, res)=>{
	var body = _.pick(req.body, ['social_id']);
	let selectedUser ;
	User.findOne({ 'social_id': body.social_id }).then((user) => {
		selectedUser = user;
		return user.generateSocialAuthToken();
	}).then((token)=>{
		res.header('social-x-auth', token).send(selectedUser);
	}).catch((e)=>{
		res.status(400).send(e);
	});
});
app.post('/login/auth',socialAuthenticate , (req, res)=>{
	var body = _.pick(req.body, ['email','password']);
	let selectedUser ;
	User.findByCredentials(body.email, body.password).then((user) => {
		selectedUser = user;
		if(user._id.toString() === req.user._id.toString()){
			return user.generateFinalAuthToken();
		}else{
			return null;
		}
	}).then((token)=>{
		if(token){
			res.header('final-x-auth', token).send(selectedUser);
		}else{
			res.status(400).send({"error": "User name and password is not correct for the social token."});
		}
	}).catch((e) => {
		res.status(400).send({"error": "User name or password is not correct."});
	});
});

app.get('/profile', authenticate, (req, res)=>{


	res.send(req.user);
});
//run the server 
const port = process.env.PORT;
app.listen(port,() => {
    console.log(`Server is up on port ${port}`);
});
