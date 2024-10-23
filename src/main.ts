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
  <button id="thinButton">Thin Marker</button>
  <button id="thickButton">Thick Marker</button>
  <button id="sticker1Button">Sticker 🦢</button>
  <button id="sticker2Button">Sticker 🪩</button>
  <button id="sticker3Button">Sticker 🤍</button>
</div>`;

// Step 8: Multiple stickers
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
const drawingData: (MarkerLine | Sticker)[] = [];
const redoStack: (MarkerLine | Sticker)[] = [];
let currentLine: MarkerLine | null = null;
let currentSticker: Sticker | null = null;
let drawing = false;
let lineWidth = 2;
let toolPreview: ToolPreview | StickerPreview | null = null;
let currentStickerType: string | null = null;

class MarkerLine {
  private points: { x: number; y: number }[] = [];
  private width: number;

  constructor(x: number, y: number, width: number) {
    this.points.push({ x, y });
    this.width = width;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length > 0) {
      ctx.beginPath();
      ctx.lineWidth = this.width;
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.stroke();
    }
  }
}

class Sticker {
  private x: number;
  private y: number;
  private sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.font = "24px Arial";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

class ToolPreview {
  private x: number;
  private y: number;
  private width: number;

  constructor(x: number, y: number, width: number) {
    this.x = x;
    this.y = y;
    this.width = width;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width / 2, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fill();
  }
}

class StickerPreview {
  private x: number;
  private y: number;
  private sticker: string;

  constructor(x: number, y: number, sticker: string) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = "24px Arial";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

if (ctx) {
  canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (currentStickerType) {
      currentSticker = new Sticker(x, y, currentStickerType);
      drawingData.push(currentSticker);
      redoStack.length = 0;
      toolPreview = null;
    } else {
      drawing = true;
      currentLine = new MarkerLine(x, y, lineWidth);
      drawingData.push(currentLine);
      redoStack.length = 0; // Clear redo stack when new drawing starts
      toolPreview = null;
    }
  });

  canvas.addEventListener("mouseup", () => {
    drawing = false;
    currentLine = null;
    currentSticker = null;
    canvas.dispatchEvent(new Event("drawing-changed"));
  });

  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (drawing && currentLine) {
      currentLine.drag(x, y);
      canvas.dispatchEvent(new Event("drawing-changed"));
    } else if (currentSticker) {
      currentSticker.drag(x, y);
      canvas.dispatchEvent(new Event("drawing-changed"));
    } else {
      if (currentStickerType) {
        toolPreview = new StickerPreview(x, y, currentStickerType);
      } else {
        toolPreview = new ToolPreview(x, y, lineWidth);
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
const sticker1Button = document.getElementById("sticker1Button") as HTMLButtonElement;
const sticker2Button = document.getElementById("sticker2Button") as HTMLButtonElement;
const sticker3Button = document.getElementById("sticker3Button") as HTMLButtonElement;

thinButton.addEventListener("click", () => {
  lineWidth = 2;
  currentStickerType = null;
  thinButton.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
  sticker1Button.classList.remove("selectedTool");
  sticker2Button.classList.remove("selectedTool");
  sticker3Button.classList.remove("selectedTool");
});

thickButton.addEventListener("click", () => {
  lineWidth = 5;
  currentStickerType = null;
  thickButton.classList.add("selectedTool");
  thinButton.classList.remove("selectedTool");
  sticker1Button.classList.remove("selectedTool");
  sticker2Button.classList.remove("selectedTool");
  sticker3Button.classList.remove("selectedTool");
});

sticker1Button.addEventListener("click", () => {
  currentStickerType = "🦢";
  sticker1Button.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
  thinButton.classList.remove("selectedTool");
  sticker2Button.classList.remove("selectedTool");
  sticker3Button.classList.remove("selectedTool");
  canvas.dispatchEvent(new Event("tool-moved"));
});

sticker2Button.addEventListener("click", () => {
  currentStickerType = "🪩";
  sticker2Button.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
  thinButton.classList.remove("selectedTool");
  sticker1Button.classList.remove("selectedTool");
  sticker3Button.classList.remove("selectedTool");
  canvas.dispatchEvent(new Event("tool-moved"));
});

sticker3Button.addEventListener("click", () => {
  currentStickerType = "🤍";
  sticker3Button.classList.add("selectedTool");
  thickButton.classList.remove("selectedTool");
  thinButton.classList.remove("selectedTool");
  sticker1Button.classList.remove("selectedTool");
  sticker2Button.classList.remove("selectedTool");
  canvas.dispatchEvent(new Event("tool-moved"));
});