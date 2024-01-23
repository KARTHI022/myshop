
const express = require('express');
const mysql = require('mysql2');
const path=require('path')
const app = express();
const PORT = 3000;
const cors = require('cors')
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'myshop'
});
connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});
app.use(cors())
app.get('/',(req,res)=>{
  res.redirect('/categoryPage');
});
app.get('/categoryPage',(req,res)=>{
  res.sendFile(path.join(__dirname,'index.html'));
 
});

app.get('/products',(req,res)=>{
  res.sendFile(path.join(__dirname,'products.html'));
});


app.get('/category', (req, res) => {
 
  connection.query('SELECT * FROM CATEGORY_TABLE', (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

   
    res.json(results);
   
  });
});

app.get('/products/api', (req, res) => {

   connection.query('SELECT * FROM PRODUCT_LIST', (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    res.json(results);
   
  });
});

app.use(express.static('public'));


app.get('/product-list.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product-list.html'));
});

app.get('/products/api/category/:categoryId', (req, res) => {
  const categoryId = req.params.categoryId;
 
  if (!categoryId) {
    res.status(400).send('Category ID is required');
    return;
  }

 connection.query('SELECT cd_id FROM CATEGORY_TABLE WHERE CD_ID = ?', [categoryId], (err, categoryResults) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
  
    if (categoryResults && categoryResults.length > 0) {
      const categoryId = categoryResults[0].cd_id;
  
       connection.query('SELECT * FROM PRODUCT_LIST WHERE CD_ID = ?', [categoryId], (err, productResults) => {
        if (err) {
          console.error('Error executing MySQL query:', err);
          res.status(500).send('Internal Server Error');
          return;
        }
  
        res.json(productResults);
      });
    } else {
      res.status(404).send('Category not found');
    }
  });
  
});



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// ---------------------------------------------------------------------



const elasticsearch = require('elasticsearch');
  
const client = new elasticsearch.Client({
  
  log: 'info',
});

app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname,  'search.html'));
});

app.get('/search/data', async (req, res) => {
  try {
    let searchTerm = req.query.q;
    const regex = /\bunder\b\s*(\d+(\.\d+)?)?/i;
    // searchTerm = searchTerm.replace(regex, '');
    var [NAME,MRP]= searchTerm.split('under')
    const body = await client.search({
      index: 'products_index',
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: NAME,
                  fields: ['PRODUCT_NAME', 'BRAND'],
                },
              },
              {
                bool: {
                  must: [
                    {
                      exists: {
                        field: 'MRP',
                      },
                    },
                    {
                      range: {
                        MRP: {
                          lte: parseFloat(MRP), 
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        _source: ['PRODUCT_NAME', 'BRAND', 'MRP', 'STOCKS', 'PD_ID', 'DISCOUNT_PRICE', 'NAME', 'CD_ID'],
      },
    });

     console.log('Elasticsearch Response:', JSON.stringify(body, null, 2));

    if (body.hits && body.hits.hits) {
      const result = body.hits.hits;
      // console.log(hits)
      // res.render('search', { data: hits });
    res.json(result);
    } else {
      console.error('No hits found in Elasticsearch response:', body);
      res.status(404).send('No data found');
    }
  } catch (error) {
    console.error('Error in Elasticsearch query:', error.message);
    res.status(500).send('Internal Server Error');
  }
});




const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});