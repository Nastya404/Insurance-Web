import fs from "fs";

export async function readAll() {
    const data = await fs.promises.readFile("db.json", "utf-8");
    return JSON.parse(data);
}

export async function saveAll(items) {
    await fs.promises.writeFile("db.json", JSON.stringify(items));
}

export async function getByID(id) {
    const items = await readAll();
    return items[id];
}

export async function create(item) {
    const items = await readAll();
    items.push(item);
    await saveAll(items);
}

export async function update(id, newItem) {
    const items = await readAll();
    items[id] = newItem;
    await saveAll(items);
}

export async function remove(id) {
    const items = await readAll();
    items.splice(id, 1);
    await saveAll(items);
}