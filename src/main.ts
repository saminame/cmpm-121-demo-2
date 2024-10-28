import "./style.css";

const APP_NAME = "Drawing Deluxe";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = `<h1>${APP_NAME}</h1>
<canvas id="gameCanvas" width="256" height="256"></canvas>
<div id="buttonContainer">
  <button id="clearButton">Clear</button>
  <button id="undoButton">Undo</button>
  <button id="redoButton">Redo</button>
  <button id="thinButton">Fine Brush</button>
  <button id="thickButton">Bold Brush</button>
  <button id="customStampButton">Create Custom Stamp</button>
  <button id="exportButton">Export</button>
  <input type="color" id="colorPicker" value="#000000"> Color
  <div id="stampButtonsContainer"></div>
</div>`;

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
const drawingData: (BrushStroke | Stamp)[] = [];
const redoStack: (BrushStroke | Stamp)[] = [];
let currentLine: BrushStroke | null = null;
let currentStamp: Stamp | null = null;
let drawing = false;
let lineWidth = 1.5;
let toolPreview: ToolPreview | StampPreview | null = null;
let currentStampType: string | null = null;
let currentColor = getRandomColor();

const stamps = ["🦭", "✨", "🧿"];
const stampButtonsContainer = document.getElementById("stampButtonsContainer") as HTMLDivElement;

stamps.forEach((stamp, index) => {
  const button = document.createElement("button");
  button.textContent = `Stamp ${stamp}`;
  button.id = `stampButton${index}`;
  button.addEventListener("click", () => {
    currentColor = getRandomColor();
    selectStamp(stamp);
    canvas.dispatchEvent(new Event("tool-moved"));
  });
  stampButtonsContainer.appendChild(button);
});

const selectStamp = (stamp: string) => {
  currentStampType = stamp;
  Array.from(stampButtonsContainer.children).forEach((child) => child.classList.remove("selectedTool"));
  thinButton.classList.remove("selectedTool");
  thickButton.classList.remove("selectedTool");
  (document.getElementById(`stampButton${stamps.indexOf(stamp)}`) as HTMLButtonElement).classList.add("selectedTool");
};

class BrushStroke {
  private points: { x: number; y: number }[] = [];
  private width: number;
  private color: string;

  constructor(x: number, y: number, width: number, color: string) {
    this.points.push({ x, y });
    this.width = width;
    this.color = color;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length > 0) {
      ctx.beginPath();
      ctx.lineWidth = this.width;
      ctx.strokeStyle = this.color;
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.stroke();
    }
  }
}

class Stamp {
  private x: number;
  private y: number;
  private stamp: string;
  private color: string;

  constructor(x: number, y: number, stamp: string, color: string) {
    this.x = x;
    this.y = y;
    this.stamp = stamp;
    this.color = color;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.font = "32px Arial";
    ctx.fillText(this.stamp, this.x, this.y);
  }
}

class ToolPreview {
  private x: number;
  private y: number;
  private width: number;
  private color: string;

  constructor(x: number, y: number, width: number, color: string) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.color = color;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width / 2, 0, 2 * Math.PI);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

class StampPreview {
  private x: number;
  private y: number;
  private stamp: string;
  private color: string;

  constructor(x: number, y: number, stamp: string, color: string) {
    this.x = x;
    this.y = y;
    this.stamp = stamp;
    this.color = color;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.font = "32px Arial";
    ctx.fillText(this.stamp, this.x, this.y);
  }
}

if (ctx) {
  canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (currentStampType) {
      currentStamp = new Stamp(x, y, currentStampType, currentColor);
      drawingData.push(currentStamp);
      redoStack.length = 0;
      toolPreview = null;
    } else {
      drawing = true;
      currentLine = new BrushStroke(x, y, lineWidth, currentColor);
      drawingData.push(currentLine);
      redoStack.length = 0; // Clear redo stack when new drawing starts
      toolPreview = null;
    }
  });

  canvas.addEventListener("mouseup", () => {
    drawing = false;
    currentLine = null;
    currentStamp = null;
    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (drawing && currentLine) {
      currentLine.drag(x, y);
      canvas.dispatchEvent(new Event("drawing-changed"));
    } else if (currentStamp) {
      currentStamp.drag(x, y);
      canvas.dispatchEvent(new Event("drawing-changed"));
    } else {
      if (currentStampType) {
        toolPreview = new StampPreview(x, y, currentStampType, currentColor);
      } else {
        toolPreview = new ToolPreview(x, y, lineWidth, currentColor);
      }
      canvas.dispatchEvent(new Event("tool-moved"));
    }
  });

  canvas.addEventListener("drawing-changed", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    drawingData.forEach((item) => {
      item.display(ctx);
    });

    if (toolPreview && !drawing) {
      toolPreview.draw(ctx);
    }
  });

  canvas.addEventListener("tool-moved", () => {
    canvas.dispatchEvent(new Event("drawing-changed"));
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
    const lastItem = drawingData.pop();
    if (lastItem) {
      redoStack.push(lastItem);
    }
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

const redoButton = document.getElementById("redoButton") as HTMLButtonElement;
redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const lastItem = redoStack.pop();
    if (lastItem) {
      drawingData.push(lastItem);
    }
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

const thinButton = document.getElementById("thinButton") as HTMLButtonElement;
const thickButton = document.getElementById("thickButton") as HTMLButtonElement;

thinButton.addEventListener("click", () => {
  lineWidth = 1.5;
  currentColor = getRandomColor();
  currentStampType = null;
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
  Array.from(stampButtonsContainer.children).forEach((child) => child.classList.remove("selectedTool"));
  canvas.dispatchEvent(new Event("tool-moved"));
});

thickButton.addEventListener("click", () => {
  lineWidth = 4;
  currentColor = getRandomColor();
  currentStampType = null;
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
  Array.from(stampButtonsContainer.children).forEach((child) => child.classList.remove("selectedTool"));
  canvas.dispatchEvent(new Event("tool-moved"));
});

const customStampButton = document.getElementById("customStampButton") as HTMLButtonElement;
customStampButton.addEventListener("click", () => {
  const stamp = prompt("Enter your custom stamp:", "");
  if (stamp) {
    stamps.push(stamp);
    const button = document.createElement("button");
    button.textContent = `Stamp ${stamp}`;
    button.id = `stampButton${stamps.length - 1}`;
    button.addEventListener("click", () => {
      currentColor = getRandomColor();
      selectStamp(stamp);
      canvas.dispatchEvent(new Event("tool-moved"));
    });
    stampButtonsContainer.appendChild(button);
  }
});

const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
colorPicker.addEventListener("input", (event) => {
  currentColor = (event.target as HTMLInputElement).value;
  canvas.dispatchEvent(new Event("tool-moved"));
});

const exportButton = document.getElementById("exportButton") as HTMLButtonElement;
exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d");

  if (exportCtx) {
    exportCtx.scale(4, 4);
    drawingData.forEach((item) => {
      item.display(exportCtx);
    });

    const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
  }
});

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}