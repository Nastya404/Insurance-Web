const fs = require("fs");

function readAll() {
    const data = fs.readFileSync("db.json", "utf-8");
    return JSON.parse(data);
}

function saveAll(items) {
    fs.writeFileSync("db.json", JSON.stringify(items));
}

function getByID(id) {
    const items = readAll();
    return items[id];
}

function create(item) {
    const items = readAll();
    items.push(item);
    saveAll(items);
}

function update(id, newItem) {
    const items = readAll();
    items[id] = newItem;
    saveAll(items);
}

function remove(id) {
    const items = readAll();
    items.splice(id, 1);
    saveAll(items);
}

module.exports = {
    readAll,
    saveAll,
    create,
    getByID,
    update,
    remove
};
