const express = require('express');
const router = express.Router();
const store = require('./store');

router.get('/policies', (req, res) => {
    const items = store.readAll();
    res.render('policies', { items: items });
});

router.get('/items', (req, res) => {
    const items = store.readAll();
    res.status(200).json(items);
});

router.get('/items/:id', (req, res) => {
    const id = Number(req.params.id);
    const item = store.getByID(id);
    res.status(200).json(item);
});

router.post('/items', (req, res) => {
    const newItem = req.body;
    store.create(newItem);
    res.status(201).json(newItem);
});

router.put('/items/:id', (req, res) => {
    const id = Number(req.params.id);
    const newItem = req.body;
    store.update(id, newItem);
    res.status(201).json(newItem);
});

router.delete('/items/:id', (req, res) => {
    const id = Number(req.params.id);
    store.remove(id);
    res.status(200).json({message: 'Deleted'});
});

module.exports = router;

