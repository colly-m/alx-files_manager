import express from 'express';
const bodypParser = require('body-parser');
const routes = require('./routes/index');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use('/', routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
