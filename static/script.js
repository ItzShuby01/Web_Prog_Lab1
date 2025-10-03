"use strict";

const form = document.getElementById("data-form");
const rParamInput = document.getElementById("r-param-input");
const xSelect = document.getElementById("x-select");
const yParamInput = document.getElementById("y-param-input");
const errorDisplay = document.getElementById("error");
const resultTableBody = document.querySelector("#result-table tbody");
const currentTimeSpan = document.getElementById("curr-time");
const executionTimeSpan = document.getElementById("exec-time");
const clearResButton = document.getElementById("clear-results");

const canvas = document.getElementById('graph');
const ctx = canvas.getContext('2d');
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

const rButtonGroup = document.getElementById("r-button-group");

let state = { x: 0, y: 0, r: 2.0 };
let points = [];

function drawGraph(rValue) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const scale = canvasWidth / (2 * rValue);
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.moveTo(0, centerY); ctx.lineTo(canvasWidth, centerY);
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, canvasHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvasWidth - 5, centerY - 3);
    ctx.lineTo(canvasWidth, centerY);
    ctx.lineTo(canvasWidth - 5, centerY + 3);
    ctx.moveTo(centerX - 3, 5);
    ctx.lineTo(centerX, 0);
    ctx.lineTo(centerX + 3, 5);
    ctx.stroke();

    ctx.fillStyle = "black";
    ctx.font = "12px Arial";
    ctx.fillText("X", canvasWidth - 15, centerY + 15);
    ctx.fillText("Y", centerX + 10, 15);
    ctx.fillText("0", centerX + 5, centerY - 5);

    ctx.fillStyle = "rgba(51, 153, 255, 0.4)";
    ctx.strokeStyle = "#3399FF";

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + rValue / 2 * scale, centerY);
    ctx.lineTo(centerX, centerY - rValue / 2 * scale);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.beginPath();
    ctx.rect(centerX - rValue * scale, centerY, rValue * scale, rValue / 2 * scale);
    ctx.fill(); ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, rValue / 2 * scale, 0, Math.PI / 2, false);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    points.forEach(p => drawPoint(p.x, p.y, rValue, p.hit));
}

function drawPoint(x, y, r, hit) {
    const scale = canvasWidth / (2 * r);
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    const px = centerX + x * scale;
    const py = centerY - y * scale;

    ctx.strokeStyle = hit ? "green" : "red";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(px - 4, py - 4);
    ctx.lineTo(px + 4, py + 4);
    ctx.moveTo(px - 4, py + 4);
    ctx.lineTo(px + 4, py - 4);
    ctx.stroke();
}

function updateCurrentTime() {
    currentTimeSpan.textContent = new Date().toLocaleString();
}
setInterval(updateCurrentTime, 1000);
updateCurrentTime();

const validationRules = {
    r: {
        input: rParamInput,
        hint: rParamInput.nextElementSibling,
        isValid: (val) => {
            const normalizedVal = val.replace(',', '.');

            if (!/^-?\d+(\.\d+)?$/.test(normalizedVal)) {
                return "Value is not a valid number.";
            }

            const parts = normalizedVal.split('.');
            if (parts.length > 1 && parts[1].length > 15) {
                return "Too many decimal places (max 15).";
            }

            const num = parseFloat(normalizedVal);

            const allowedRValues = [1, 1.5, 2, 2.5, 3];
            if (!allowedRValues.includes(num)) {
                return `Value must be one of: ${allowedRValues.join(", ")}.`;
            }

            return true;
        },
        updateState: (val) => {
            const normalizedVal = val.replace(',', '.');
            state.r = parseFloat(normalizedVal);
        },
        errorMessage: ""
    },
    x: {
        input: xSelect,
        hint: xSelect.nextElementSibling,
        isValid: (val) => {
            const num = parseFloat(val);
            const allowedXValues = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
            if (!allowedXValues.includes(num)) {
                return "Select a valid value for X.";
            }
            return true;
        },
        errorMessage: ""
    },
    y: {
        input: yParamInput,
        hint: yParamInput.nextElementSibling,
        isValid: (val) => {
            const normalizedVal = val.replace(',', '.');

            if (!/^-?\d+(\.\d+)?$/.test(normalizedVal)) {
                return "Value is not a valid number.";
            }

            const parts = normalizedVal.split('.');
            if (parts.length > 1 && parts[1].length > 15) {
                return "Too many decimal places (max 15).";
            }

            const num = parseFloat(normalizedVal);

            if (isNaN(num) || num < -5 || num > 3) {
                return "Value must be between -5 and 3.";
            }

            return true;
        },
        updateState: (val) => {
            const normalizedVal = val.replace(',', '.');
            state.y = parseFloat(normalizedVal);
        },
        errorMessage: ""
    }
};

function validateInput(inputName, value) {
    const rule = validationRules[inputName];
    const validationResult = rule.isValid(value);

    if (validationResult === true) {
        rule.hint.style.visibility = "hidden";
        rule.hint.classList.remove("error");
        rule.input.classList.remove("invalid");
        return true;
    } else {
        rule.hint.textContent = validationResult;
        rule.hint.style.visibility = "visible";
        rule.hint.classList.add("error");
        rule.input.classList.add("invalid");
        return false;
    }
}

rParamInput.addEventListener("input", (event) => {
    validateInput("r", event.target.value);
    validationRules.r.updateState(event.target.value);
});

rButtonGroup.addEventListener("click", (event) => {
    if (event.target.classList.contains("r-button")) {
        rButtonGroup.querySelectorAll('.r-button').forEach(btn => btn.classList.remove('selected-r'));
        event.target.classList.add('selected-r');

        const rValue = event.target.getAttribute('data-r');
        rParamInput.value = rValue;

        validateInput("r", rValue);
        validationRules.r.updateState(rValue);
        drawGraph(state.r);
    }
});

xSelect.addEventListener("change", (event) => {
    validateInput("x", event.target.value);
    state.x = parseFloat(event.target.value);
});

state.x = parseFloat(xSelect.value);

document.querySelector('.r-button[data-r="2.0"]').classList.add('selected-r');

yParamInput.addEventListener("input", (event) => {
    validateInput("y", event.target.value);
    validationRules.y.updateState(event.target.value);
});

Object.values(validationRules).forEach(rule => {
    if (rule.hint) rule.hint.style.visibility = "hidden";
});

form.addEventListener("submit", async function (ev) {
    ev.preventDefault();
    errorDisplay.hidden = true;

    const isRValid = validateInput("r", rParamInput.value);
    const isXValid = validateInput("x", state.x);
    const isYValid = validateInput("y", yParamInput.value);

    if (!isRValid || !isXValid || !isYValid) {
        errorDisplay.textContent = "Please correct the input errors.";
        errorDisplay.hidden = false;
        return;
    }

    const params = new URLSearchParams({
        x: state.x, y: state.y, r: state.r
    });

    const startTime = performance.now();
    try {
        const response = await fetch("/fcgi-bin/app.jar?" + params.toString());
        const endTime = performance.now();
        const executionTime = (endTime - startTime).toFixed(2);

        const result = await response.json();

        if (response.ok) {
            const newRowData = {
                x: state.x,
                y: state.y,
                r: state.r,
                time: new Date(result.now).toLocaleString(),
                execTime: `${executionTime} ms`,
                result: result.result ? 'Hit' : 'Miss',
            };

            executionTimeSpan.innerHTML = `${executionTime} ms`;
            addResultToTable(newRowData);
            saveResultToLocalStorage(newRowData);

            const hit = result.result;
            points.push({ x: state.x, y: state.y, hit });
            drawGraph(state.r);
        } else {
            const errorReason = result.reason || `Server responded with ${response.status}`;
            errorDisplay.textContent = `Server Error: ${errorReason}`;
            errorDisplay.hidden = false;
        }

    } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        errorDisplay.textContent = "Could not connect to the server.";
        errorDisplay.hidden = false;
    }
});

function addResultToTable(data) {
    const newRow = resultTableBody.insertRow(0);
    newRow.insertCell(0).textContent = data.r;
    newRow.insertCell(1).textContent = data.x;
    newRow.insertCell(2).textContent = data.y;
    newRow.insertCell(3).textContent = data.time;
    newRow.insertCell(4).textContent = data.execTime;
    newRow.insertCell(5).textContent = data.result;
}

function saveResultToLocalStorage(data) {
    const prev = JSON.parse(localStorage.getItem("results") || "[]");
    localStorage.setItem("results", JSON.stringify([data, ...prev]));
}

function loadResults() {
    const prev = JSON.parse(localStorage.getItem("results") || "[]");
    prev.forEach(d => {
        addResultToTable(d);
        points.push({ x: d.x, y: d.y, hit: d.result === "true" });
    });
    drawGraph(state.r);
}

function clearResults() {
    localStorage.removeItem("results");
    resultTableBody.innerHTML = "";
    points = [];
    drawGraph(state.r);
}
clearResButton.addEventListener("click", clearResults);

loadResults();