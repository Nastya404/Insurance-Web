import express from 'express';
import * as store from './store.js';
const router = express.Router();

router.get('/policies', async (req, res) => {
    try {
        const items = await store.readAll();
        res.render('policies', { items: items });
    }
    catch(err) {
        res.status(500).json({ message: err.message });
    }
    
});

router.get('/items', async (req, res) => {
    try {
        const items = await store.readAll();
        res.status(200).json(items);
    }
    catch(err) {
        res.status(500).json({ message: err.message });
    }
    
});

router.get('/items/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
        const item = await store.getByID(id);
        res.status(200).json(item);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
    
});

router.post('/items', async (req, res) => {
    const newItem = req.body; 
    try {
        await store.create(newItem);
        res.status(201).json(newItem);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
    
});

router.put('/items/:id', async (req, res) => {
    const id = Number(req.params.id);
    const newItem = req.body;
    
    try {
        await store.update(id, newItem);
        res.status(201).json(newItem);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/items/:id', async (req, res) => {
    const id = Number(req.params.id);

    try {
           await store.remove(id);
            res.status(200).json({message: 'Deleted'});
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;

