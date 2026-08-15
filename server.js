require('dotenv').config();
const app = require('./api');
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SRVM running at http://localhost:${PORT}`));
