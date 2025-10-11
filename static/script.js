"use strict";

const request = window.superagent;

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

// Use SuperAgent for form submission
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

    const queryParams = {
        x: state.x,
        y: state.y,
        r: state.r
    };

    const startTime = performance.now();
    try {
        // Replaced fetch API with request.get().query()
        const response = await request
            .get("/fcgi-bin/app.jar")
            .query(queryParams); // SuperAgent automatically builds the QUERY STRING

        const endTime = performance.now();
        const clientExecutionTime = (endTime - startTime).toFixed(2); // To avoid confusion with server's execTime

        // SuperAgent parses JSON into response.body
        const result = response.body;

        if (response.ok) {
            const newRowData = {
                x: result.x, // Use server's returned x, y, r
                y: result.y,
                r: result.r,
                time: new Date(result.time).toLocaleString(), // Use server's time
                execTime: `${result.execTime.toFixed(2)} ms`, // Use formatted server's execTime
                result: result.result ? 'Hit' : 'Miss',
            };

            executionTimeSpan.innerHTML = `${clientExecutionTime} ms`; // Display client's measure
            addResultToTable(newRowData);

            const hit = result.result; // server's result (boolean)
            points.push({ x: result.x, y: result.y, hit });
            drawGraph(state.r);
        } else {
             // Handling error with SuperAgent
             const errorReason = result.reason || `Server responded with ${response.status}`;
             errorDisplay.textContent = `Server Error: ${errorReason}`;
             errorDisplay.hidden = false;
        }

    } catch (superAgentError) {
        // Handling error thrown by SuperAgent
        if (superAgentError.response && superAgentError.response.body) {
             const result = superAgentError.response.body;
             const errorReason = result.reason || `Server responded with ${superAgentError.response.status}`;
             errorDisplay.textContent = `Server Error: ${errorReason}`;
        } else {
             console.error("SuperAgent error:", superAgentError);
             errorDisplay.textContent = "Could not connect to the server.";
        }
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


// Rewrote loadResults  using SuperAgent
async function loadResults() {
    try {
        // Replaced fetch() with request.get().query()
        const response = await request
            .get("/fcgi-bin/app.jar") // Server endpoint
            .query("get_all_results"); // Send query parameter

        const results = response.body; // Server returns an array of results

        // Clear existing table and points before loading from server
        resultTableBody.innerHTML = "";
        points = [];

        results.forEach(d => {
            // Map server's response to addResultToTable columns
            const rowData = {
                x: d.x,
                y: d.y,
                r: d.r,
                time: new Date(d.time).toLocaleString(), // Convert server's ISO string to local date/time
                execTime: `${d.execTime.toFixed(2)} ms`, // Server returns milliseconds directly
                result: d.result ? 'Hit' : 'Miss', // Server returns boolean
            };
            addResultToTable(rowData);
            points.push({ x: d.x, y: d.y, hit: d.result }); // d.result is already boolean
        });
        drawGraph(state.r);

    } catch (error) {
        console.error("Failed to load results from server:", error);
        errorDisplay.textContent = "Could not load past results from server.";
        errorDisplay.hidden = false;
    }
}

// Rewrite clearResults using SuperAgent
clearResButton.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to clear all results? This action cannot be undone.")) {
        return;
    }
    try {
        // Replaced fetch() with request.get().query()
        const response = await request
            .get("/fcgi-bin/app.jar") // Server endpoint
            .query("clear_results"); // Send query parameter

        const message = response.body; // Server returns { "message": "Results cleared successfully" }
        console.log(message.message);

        // Clear client-side display after successful server clear
        resultTableBody.innerHTML = "";
        points = [];
        drawGraph(state.r); // Redraw graph without points
        errorDisplay.hidden = true; // Hide any previous error messages

    } catch (error) {
        console.error("Failed to clear results on server:", error);
        errorDisplay.textContent = "Could not clear results on server.";
        errorDisplay.hidden = false;
    }
});

loadResults(); // Call the updated loadResults to fetch from server on page load