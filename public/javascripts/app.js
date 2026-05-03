"use strict";

// МОДЕЛЬ (Model из MVC)

let SPAState = {};
let products = [];
fetch('/data/products.json')
    .then(res => res.json())
    .then(data => {
        products = data;
        switchToStateFromURLHash();
    });

// КОНТРОЛЛЕР (Controller из MVC)

window.onhashchange = switchToStateFromURLHash;

function switchToStateFromURLHash() {
    const hash = window.location.hash;
    const stateStr = hash.substr(1);

    if (stateStr !== "") {
        SPAState = { pagename: stateStr };
    } else {
        SPAState = { pagename: "Main" };
    }
    console.log("Новое состояние:", SPAState);

    render();
    updateNavButtons();
}

function switchToState(newState) {
    location.hash = newState.pagename;
}

function switchToMainPage() {
    switchToState({ pagename: "Main" });
}

function switchToProductsPage() {
    switchToState({ pagename: "Products" });
}

function switchToAboutPage() {
    switchToState({ pagename: "About" });
}

function switchToPoliciesPage() {
    location.href = '/policies';
}

function switchToChatPage() {
    location.href = '/chat';
}

// ВИД (View из MVC)

function render() {

    const defaultCase = `
                <p style="color: #888; display: flex; flex-direction: column; gap: 1rem">
                   Страница не найдена.
                  <button class="btn" onclick="switchToMainPage()">На главную</button>
                </p>
                `;

    switch (SPAState.pagename) {
        case "Main":
            $.ajax("main.html", {
                type: "GET",
                dataType: "html",
                success: function (data) {
                    document.getElementById("IPage").innerHTML = data;
                },
                error: function () {
                    document.getElementById("IPage").innerHTML = defaultCase;
                },
            });
            break;

        case "Products":
            let html = "";
            html +=
                '<h2 style="color:#1a6fad; margin-bottom:1.5rem;">Страховые продукты</h2>';
            html += '<table class="products-table">';
            html +=
                "<thead><tr><th>Название продукта</th><th>Описание</th><th>Стоимость (в год)</th><th>Тип</th></tr></thead>";
            html += "<tbody>";
            for (var i = 0; i < products.length; i++) {
                const p = products[i];
                const badgeClass =
                    p.type === "required" ? "badge--required" : "badge--optional";
                const badgeLabel =
                    p.type === "required" ? "Обязательное" : "Добровольное";
                html += "<tr>";
                html += "  <td><strong>" + p.name + "</strong></td>";
                html += "  <td>" + p.desc + "</td>";
                html += "  <td>" + p.price + "</td>";
                html +=
                    '  <td><span class="badge ' +
                    badgeClass +
                    '">' +
                    badgeLabel +
                    "</span></td>";
                html += "</tr>";
            }
            html += "</tbody></table>";
            document.getElementById("IPage").innerHTML = html;
            break;

        case "About":
            $.ajax("about.html", {
                type: "GET",
                dataType: "html",
                success: function (data) {
                    document.getElementById("IPage").innerHTML = data;
                },
                error: function () {
                    document.getElementById("IPage").innerHTML = defaultCase;
                },
            });
            break;

        default:
            document.getElementById("IPage").innerHTML = defaultCase;
    }

}

function updateNavButtons() {
    const buttons = document.querySelectorAll(".nav button");
    const pageMap = { Main: 0, Products: 1, About: 2 };
    buttons.forEach(function (btn) {
        btn.classList.remove("active");
    });
    const idx = pageMap[SPAState.pagename];
    if (idx !== undefined) buttons[idx].classList.add("active");
}

function loadJSON() {
    const table = document.getElementById("main__table");

    if (table.innerHTML !== "") {
        table.innerHTML = "";
        return;
    }

    $.ajax('/items', {
        type: "GET",
        dataType: "json",
        success: function (data) {
            let html = "";
            html += '<table class="description-table">';
            html +=
                "<thead><tr><th>Название продукта</th><th>Описание</th></tr></thead>";
            html += "<tbody>";
            for (let i = 0; i < data.length; i++) {
                const p = data[i];
                html += "<tr>";
                html += "  <td><strong>" + p.name + "</strong></td>";
                html += "  <td>" + p.description + "</td>";
                html += "</tr>";
            }
            html += "</tbody></table>";
            document.getElementById("main__table").innerHTML = html;
        },
        error: function (xhr, status, error) {
            console.log('An error occurred: ' + error);
        }
    })
}
