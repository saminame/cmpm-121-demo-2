import "./style.css";

const APP_NAME = "Sims Deluxe";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
// Step 1: Initial non-interactive UI layout
app.innerHTML = app.innerHTML = `<h1>${APP_NAME}</h1><canvas id="gameCanvas" width="256" height="256"></canvas>`;

