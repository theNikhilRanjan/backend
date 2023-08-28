const express = require('express');
const mongoose = require('mongoose');
const app = express();

mongoose.connect('mongodb://localhost/math_server', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to the MongoDB server.'))
  .catch(err => console.error('Could not connect to the MongoDB server.', err));

const historySchema = new mongoose.Schema({
  question: String,
  answer: Number
});

const History = mongoose.model('History', historySchema);
app.get('/', (req, res) => {
    res.send(`
      <h1>Math Server</h1>
      <p>Available endpoints:</p>
      <ul>
        <li><a href="/history">/history</a> - Lists the last 20 operations performed on the server, and the answers.</li>
        <li>/number1/operation/number2/... - Perform a mathematical operation. For example, <a href="/5/plus/3">/5/plus/3</a> will return {"question":"5+3","answer":8}.</li>
      </ul>
    `);
  });
  
app.get('/history', async (req, res) => {
    const history = await History.find({ question: { $ne: '' } }).sort('-_id').limit(20).select('question answer -_id');
    res.json(history);
  });
  
  
  app.get('/*', async (req, res) => {
    const operation = req.params[0].split('/');
    let result;
  
    const sanitizedOperation = operation.filter(el => ['plus', 'minus', 'into', 'divided'].includes(el) || !isNaN(el));
  
    if (sanitizedOperation.length !== operation.length) {
      res.status(400).json({ error: 'Invalid operation' });
      return;
    }
  
    let sanitizedOperationStr = '';
    for (let i = 0; i < sanitizedOperation.length; i++) {
      if (sanitizedOperation[i] === 'plus') {
        sanitizedOperationStr += '+';
      } else if (sanitizedOperation[i] === 'minus') {
        sanitizedOperationStr += '-';
      } else if (sanitizedOperation[i] === 'into') {
        sanitizedOperationStr += '*';
      } else if (sanitizedOperation[i] === 'divided') {
        sanitizedOperationStr += '/';
      } else {
        sanitizedOperationStr += sanitizedOperation[i];
      }
    }
  
    try {
      result = eval(sanitizedOperationStr);
    } catch (err) {
      res.status(400).json({ error: 'Invalid operation' });
      return;
    }
  
    const history = new History({ question: sanitizedOperationStr, answer: result });
    await history.save();
  
    res.json({ question: sanitizedOperationStr, answer: result });
  });
  
  
  

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

app.use((req, res, next) => {
  res.status(404).json({ error: 'Invalid request' });
});