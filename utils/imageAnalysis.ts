import Tesseract from 'tesseract.js';

export interface OCRText {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Preprocess image: grayscale, increase contrast, binarize
function preprocessImage(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');
      ctx.drawImage(img, 0, 0);
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let data = imageData.data;
      // Grayscale and increase contrast
      for (let i = 0; i < data.length; i += 4) {
        let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        // Increase contrast
        avg = avg < 128 ? avg * 0.8 : avg * 1.2;
        avg = Math.max(0, Math.min(255, avg));
        data[i] = data[i + 1] = data[i + 2] = avg;
      }
      ctx.putImageData(imageData, 0, 0);
      // Binarize (black/white)
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = data[i] < 140 ? 0 : 255;
        data[i] = data[i + 1] = data[i + 2] = v;
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}

// Simple rectangle detection using Canvas API (works for high-contrast images)
export async function detectRectanglesWithCanvas(imageDataUrl: string): Promise<DetectedRect[]> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imageData;
      // Simple thresholding: mark all dark pixels as 1, others as 0
      const binary = new Uint8Array(width * height);
      for (let i = 0; i < width * height; i++) {
        const r = data[i * 4];
        binary[i] = r < 128 ? 1 : 0;
      }
      // Naive rectangle detection: scan for bounding boxes of connected regions
      const visited = new Uint8Array(width * height);
      const rects: DetectedRect[] = [];
      function floodFill(x: number, y: number, bounds: {minX: number, minY: number, maxX: number, maxY: number}) {
        const stack = [[x, y]];
        while (stack.length) {
          const [cx, cy] = stack.pop()!;
          if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
          const idx = cy * width + cx;
          if (visited[idx] || !binary[idx]) continue;
          visited[idx] = 1;
          bounds.minX = Math.min(bounds.minX, cx);
          bounds.minY = Math.min(bounds.minY, cy);
          bounds.maxX = Math.max(bounds.maxX, cx);
          bounds.maxY = Math.max(bounds.maxY, cy);
          stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
        }
      }
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (!visited[idx] && binary[idx]) {
            const bounds = { minX: x, minY: y, maxX: x, maxY: y };
            floodFill(x, y, bounds);
            const w = bounds.maxX - bounds.minX + 1;
            const h = bounds.maxY - bounds.minY + 1;
            if (w > 20 && h > 20) {
              rects.push({ x: bounds.minX, y: bounds.minY, width: w, height: h });
            }
          }
        }
      }
      resolve(rects);
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}

export async function analyzeWarehouseImage(imageDataUrl: string): Promise<{ rects: DetectedRect[], ocr: OCRText[] }> {
  // Preprocess image
  const processedDataUrl = await preprocessImage(imageDataUrl);
  const [rects, ocr] = await Promise.all([
    detectRectanglesWithCanvas(processedDataUrl),
    (async () => {
      const { data: { words } } = await Tesseract.recognize(processedDataUrl, 'eng', { logger: m => {} });
      return (words || []).map(word => ({
        text: word.text,
        x: word.bbox.x0,
        y: word.bbox.y0,
        width: word.bbox.x1 - word.bbox.x0,
        height: word.bbox.y1 - word.bbox.y0
      }));
    })()
  ]);
  return { rects, ocr };
} 