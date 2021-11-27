const url = new URL("/", "http://127.0.0.1:5454");
let form = document.getElementById("form");
let indicator = document.getElementById("loadIndicator");
let abort = document.getElementById("abort");
let renewal = document.getElementById("renewal");
let file;

// выбор файла и инициирование загрузки
form.addEventListener("change", (event) => {
    if (file) {
        return;
    } else {
        file = event.target.files[0];
        uploadFile(file);
    }
});

// возобновление загрузки
renewal.addEventListener("click", () => {
    if (file) {
        uploadFile(file);
        renewal.style.visibility = "hidden";
    } else {
        return;
    }
});

// загрузка файла
async function uploadFile(file) {
    // получаем длину файла
    let startByte = await getUploadedBytes(file.name);

    // создаем id файла
    let fileId = JSON.stringify({
        name: file.name,
        size: +file.size,
        mod: +file.lastModifiedDate,
    });

    console.log(JSON.parse(fileId).name);
    const url = new URL(file.name, "http://127.0.0.1:5454/");
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    // Идентификатор файла
    xhr.setRequestHeader("X-File-Id", fileId);

    // индикация прогресса отправки
    xhr.upload.onprogress = function (event) {
        indicator.innerHTML = `Sended ${Math.trunc(
            (event.loaded + startByte) / 1024 / 1024
        )} Mb from ${Math.trunc((event.total + startByte) / 1024 / 1024)} Mb`;
    };

    // проверка того какой файл отсылать
    if (startByte == file.size) {
        return;
    } else if (startByte < file.size) {
        let sliced = new Blob(
            [file.slice(startByte)] /* { type: "text/plain" } */
        );
        xhr.send(sliced);
    } else if (startByte == 0) {
        xhr.send(file);
    }

    xhr.onload = function () {
        console.log("SERVER RESPONSE: " + xhr.responseText);
    };

    // принудительная отмена загрузки
    abort.addEventListener("click", () => {
        xhr.abort();
        renewal.style.visibility = "visible";
    });
}

// запрос заголовков
async function GET(url) {
    const response = await fetch(url);
    // получили все заголовки
    for (const [key, value] of response.headers) {
        console.log(`Header: ${key} = ${value}`);
    }
}

GET(url);

// запрос длины файла
async function getUploadedBytes(file) {
    console.log("/" + file);
    let response = await fetch("/" + file);
    let text = await response.text();
    if (!text) return 0;
    console.log(text);
    return +text;
}
