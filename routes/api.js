const express = require('express');
const router = express.Router();

const mongojs = require('mongojs');
const db = mongojs('client-keeper', ['clients']);

// Get client - GET
router.get('/clients', (req, res, next) => {
  const queryParams = req.query;
  const filter = queryParams.filter || '';
  const sortField = queryParams.sortField || 'first_name';
  const sortOrder = queryParams.sortOrder;
  const pageNumber = parseInt(queryParams.pageNumber) || 0;
  const pageSize = parseInt(queryParams.pageSize);
  let sorting = {[sortField]:-1};
  const initialPos = pageNumber * pageSize;
  let clientsPage;

  if (sortOrder) {
    if (sortOrder !== 'asc') {
      sorting = {[sortField]:1};
    }
  }

  if (filter) {
    filterClient(filter, sorting, (error, data) => {
      if (error) {
        return res.send(error);
      }
      clientsPage = data.slice(initialPos, initialPos + pageSize);
      return res.json(clientsPage);
    });
  } else {
    db.clients.find().sort(sorting, (error, data) => {
        if (error) {
            return res.send(error);
        }
        clientsPage = data.slice(initialPos, initialPos + pageSize);
        return res.json(clientsPage);
    });
  }
});

router.get('/clients-all' , (req, res, next) => {
  const queryParams = req.query;
  const filter = queryParams.filter || '';

  if (filter) {
    filterClient(filter, {}, (error, data) => {
      if (error) {
        res.send(error);
      }
      res.json({length: data.length});
    });
  } else {
    db.clients.find({}, (error, data) => {
      if (error) {
          res.send(error);
      }
      res.json({length: data.length});
    });
  }
});

// Add client - POST
router.post('/clients', (req, res, next) => {
    db.clients.insert(req.body, (error, data) => {
        if (error) {
            res.send(error);
        }
        res.json(data);
    });
});

// Put client - POST
router.put('/clients/:id', (req, res, next) => {
    const id = req.params.id;
    db.clients.findAndModify({query: {_id: mongojs.ObjectId(id)},
        update: { $set: {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email
        }},
        new: true}, (error, data) => {
            res.json(data);
        });
});

// Delete client - POST
router.delete('/clients/:id', (req, res, next) => {
    const id = req.params.id;
    db.clients.remove({_id: mongojs.ObjectId(id)}, (error, data) => {
        if (error) {
            res.send(error);
        }
        res.json(data);
    });
});

function filterClient(filter, sorting, callback) {
  // mongojs syntax
  const regExp = new RegExp(filter, "i");
  const results = [];
  // find value in all fields
  db.clients.find().sort(sorting, (err, data) => {
    if (err) {
      callback(err);
    } else {
      data.forEach(doc => {
        const recursiveFunc = (docsArray, docKey) => {
          const docValue = docsArray[docKey];
          if (regExp.test(docValue)) {
            results.push(doc);
          }
          if(typeof docValue === "object") {
            Object.keys(docValue).forEach((docValueKey) => {
              recursiveFunc(docValue, docValueKey);
            });
          }
        };
        Object.keys(doc).forEach(docItem => {
          recursiveFunc(doc, docItem);
        });
      });

      const setTemp = new Set();
      // filter off duplicate document
      const filteredResult = results.filter((item) => {
        const key = item._id, isNew = !setTemp.has(key);
        if (isNew) setTemp.add(key);
        return isNew;
      });
      callback(null, filteredResult);
    }
  });
}

module.exports = router;
