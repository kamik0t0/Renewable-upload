const http = require("http");
// let static = require("node-static");
// let fileServer = new static.Server(".");
const path = require("path");
const fs = require("fs");

const PORT = 5454;
http.createServer(accept).listen(PORT, () =>
    console.log(`SERVER LISTENING ON ${PORT}`)
);

function accept(req, res) {
    const currDir = fs.readdirSync("./");
    // Загрузка стартовой страницы (файла page.html)
    if (req.url == "/") {
        if (req.method == "GET") {
            fs.readFile("page.html", (err, data) => {
                res.write(data);
                res.end();
            });
        }
        // подтягивание скрипта uploader.js
    } else if (path.extname(req.url) == ".js") {
        let js = path.join(__dirname + req.url);
        fs.readFile(js, (err, data) => {
            res.write(data);
            res.end();
        });

        // загрузка файла на сервер
    } else if (req.method === "POST") {
        console.log(req.url);
        // получение и parse id файла в виде объекта
        let fileId = req.headers["x-file-id"];
        let file = JSON.parse(fileId);
        let files;
        // промисы используются поскольку функции чтения данных занимают время
        // (можно было решить проще используя синхронные методы)
        new Promise((resolve, rejects) => {
            // получение массива файлов в каталоге
            fs.readdir("./", (err, arr) => {
                resolve(arr);
            });
        })
            .then((arr) => {
                files = Array.from(arr);
                return files;
            })
            .then((arr) => {
                // возвращаем new Promise потому что сначала нужно получить размер файла...
                return new Promise((resolve, reject) => {
                    // получение размера файла если существует
                    if (arr.includes(req.url.slice(1))) {
                        fs.stat("./" + req.url.slice(1), (err, stats) => {
                            resolve(stats.size);
                        });
                        // если не существует то возвращаем null
                    } else {
                        resolve(null);
                    }
                });
            })
            // ... и далее с ним работать
            .then((size) => {
                // файл существует полностью
                if (files.includes(file.name) && file.size == size) {
                    console.log("File already exist");
                    res.end(
                        `File ${file.name} already on SERVER. Size = ${file.size} bytes`
                    );
                    // дозагрузка
                } else if (files.includes(file.name) && file.size != size) {
                    fileStream = fs.createWriteStream(file.name, {
                        // файл открывается для записи с установкой указателя в конец потока
                        flags: "a",
                    });
                    req.pipe(fileStream);
                    res.end(`File ${req.url} loaded`);
                } else if (!files.includes(file.name)) {
                    // создание файла
                    createFile(req, res, file.name);
                }
            });

        // обработка запроса текущего размера файла, если файл существует
    } else if (req.method == "GET" && currDir.includes(req.url.slice(1))) {
        fs.stat("." + req.url, (err, stats) => {
            if (err) {
                console.log(err);
            } else {
                console.log("File size: " + stats.size);
                res.end(String(stats.size));
            }
        });
        // обработка запроса текущего размера файла, если файла нет
    } else if (req.method == "GET" && !currDir.includes(req.url.slice(1))) {
        res.end(0);
    } else {
        res.end("no such file");
    }
}

// функция создания файла
function createFile(req, res, file) {
    console.log("Writing a new file. Name: " + file);
    let fileStream = fs.createWriteStream(file, "utf-8");
    req.pipe(fileStream);
    res.end(`File ${req.url} loaded`);
}
