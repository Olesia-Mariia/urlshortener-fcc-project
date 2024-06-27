require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('node:dns');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Basic Configuration
const port = process.env.PORT || 3000;

const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: String,
    required: true,
    unique: true
  }
});

let URLModel = mongoose.model('URL', urlSchema);

app.use(bodyParser.urlencoded({extended: false}))

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post("/api/shorturl", (req, res) => {  
  try {
    const urlObj = new URL(req.body.url);
    dns.lookup(urlObj.hostname, (err, address, family) => {
      if (!address) {
        res.json({ error: 'invalid url' });
        return;
      } 
      URLModel
        .findOne({original_url: urlObj.href})
        .then((result) => {
          if (result) {
            res.json({
              original_url: result.original_url, 
              short_url: result.short_url
            });
          }
        })
      URLModel
        .find({})
        .sort({short_url: "desc"})
        .limit(1)
        .then((result) => {
          let short_url = 1;
          if (result.length > 0) {
            short_url = +result[0].short_url + 1;
          }
          const resURL = {
            original_url: urlObj.href, 
            short_url: short_url
          };
          const newURL = new URLModel(resURL);
          newURL.save();
          res.json(resURL);
        })
    });
  } catch {
    res.json({ error: 'invalid url' });
  }
})

app.get("/api/shorturl/:shortUrl", (req, res) => {
  URLModel
    .findOne({short_url: req.params.shortUrl})
    .then((result) => {
      if (!result) {
        res.json({error: "No short URL found for the given input"});
        return;
      }
      res.redirect(result.original_url);
    });
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
