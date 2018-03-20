const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const AWS = require('aws-sdk');

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE
const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }));

//Utility route (drop DB)
app.get('/', function (req, res) {
  var params = {
    TableName : PRODUCTS_TABLE,
  };
  dynamoDb.deleteTable(params, function(err, result) {
      if (err) {
          res.status(400).json({ error: "Unable to delete table. Error JSON: " + err.message });
      } else {
          res.json("Deleted table. Table description JSON:" + result);
      }
  });
});

app.patch('/products/:productId', (req, res) => {
  const params = {
    TableName: PRODUCTS_TABLE,
    Key: {
      productId: req.params.productId,
    },
    UpdateExpression: 'set quantity = quantity - :val',
    ConditionExpression: 'quantity >= :val',
    ExpressionAttributeValues: {
      ':val':req.body.quantity,
    },
    ReturnValues:"UPDATED_NEW"
  };

  dynamoDb.update(params, function(err, result) {
    if (err) {
        res.status(400).json({ error: "Unable to update item. Error JSON: " + err.message });
    } else {
        res.json(`Updated product ${req.params.productId}: ${result}`);
    }
  });

});

app.get('/products/:productId', function (req, res) {
  const params = {
    TableName: PRODUCTS_TABLE,
    Key: {
      productId: req.params.productId,
    },
  }

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get product' });
    }
    if (result.Item) {
      const {productId, name, quantity} = result.Item;
      res.json({ productId, name, quantity });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });
});

app.post('/products', function (req, res) {
  const { productId, name, quantity } = req.body;
  if (typeof productId !== 'string') {
    res.status(400).json({ error: '"productfId" must be a string' });
  } else if (typeof name !== 'string') {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: PRODUCTS_TABLE,
    Item: {
      productId,
      name,
      quantity,
    },
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not create product' });
    }
    res.json({ productId, name,  quantity });
  });
});

module.exports.handler = serverless(app);