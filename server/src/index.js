const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/clients', require('./routes/clients'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/time-entries', require('./routes/timeentries'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/email', require('./routes/email'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/public', require('./routes/public'));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`✅ FreelanceFlow serveur lancé sur http://localhost:${PORT}`);
});
