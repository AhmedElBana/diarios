require('./config/config');

const express = require('express');

let app = express();

app.use('/', express.static('diarios-frontend/build'));

app.get('/',(req, res)=>{
	res.send('Hello world');
});

const port = process.env.PORT;
app.listen(port,() => {
    console.log(`Server is up on port ${port}`);
});
