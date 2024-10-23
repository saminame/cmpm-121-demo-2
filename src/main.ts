import "./style.css";

const APP_NAME = "Drawing Deluxe";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = `<h1>${APP_NAME}</h1><canvas id="gameCanvas" width="256" height="256"></canvas><button id="clearButton">Clear</button><button id="undoButton">Undo</button><button id="redoButton">Redo</button>`;

// Step 4: Redo/undo system
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
const drawingData: { x: number; y: number }[][] = [];
const redoStack: { x: number; y: number }[][] = [];
let currentPath: { x: number; y: number }[] = [];
let drawing = false;

if (ctx) {
  canvas.addEventListener("mousedown", () => {
    drawing = true;
    currentPath = [];
    drawingData.push(currentPath);
  });

  canvas.addEventListener("mouseup", () => {
    drawing = false;
    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  canvas.addEventListener("mousemove", (event) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    currentPath.push({ x, y });
    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  canvas.addEventListener("drawing-changed", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    drawingData.forEach((path) => {
      if (path.length > 0) {
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
      }
    });
  });
}

const clearButton = document.getElementById("clearButton") as HTMLButtonElement;
clearButton.addEventListener("click", () => {
  drawingData.length = 0;
  redoStack.length = 0;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

const undoButton = document.getElementById("undoButton") as HTMLButtonElement;
undoButton.addEventListener("click", () => {
  if (drawingData.length > 0) {
    const lastPath = drawingData.pop();
    if (lastPath) {
      redoStack.push(lastPath);
    }
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

const redoButton = document.getElementById("redoButton") as HTMLButtonElement;
redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const lastPath = redoStack.pop();
    if (lastPath) {
      drawingData.push(lastPath);
    }
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});