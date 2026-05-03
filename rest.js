import express from 'express';
import * as store from './store.js';
const router = express.Router();

router.get('/policies', async (req, res) => {
    try {
        const ROWS_PER_PAGE = 3;

        const pageRaw = Number.parseInt(req.query.page, 10);
        const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

        const sortOrder = req.query.sort === 'desc' ? 'desc' : 'asc';
        const search = (req.query.search ?? '').toString().trim().toLowerCase();

        let allItems = await store.readAll();

        allItems = allItems.map((item, idx) => ({ ...item, id: idx }));

        if (search) {
            allItems = allItems.filter((item) =>
                (item.name ?? '').toString().toLowerCase().includes(search)
            );
        }

        allItems.sort((a, b) => {
            const aName = (a.name ?? '').toString().toLowerCase();
            const bName = (b.name ?? '').toString().toLowerCase();
            const cmp = aName.localeCompare(bName, 'ru');
            return sortOrder === 'asc' ? cmp : -cmp;
        });

        const totalItems = allItems.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / ROWS_PER_PAGE));
        const safePage = Math.min(page, totalPages);
        const start = (safePage - 1) * ROWS_PER_PAGE;
        const items = allItems.slice(start, start + ROWS_PER_PAGE);

        res.render('policies', {
            items,
            currentPage: safePage,
            totalPages,
            sortOrder,
            search: (req.query.search ?? '').toString().trim(),
        });
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

