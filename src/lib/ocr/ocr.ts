import Tesseract from "tesseract.js";

export type OCRWord = {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

export type OCRResult = {
  text: string;
  words: OCRWord[];
  imageSize: { width: number; height: number };
};

export async function ocrImageDetailed(dataUrl: string): Promise<OCRResult> {
  const res = await Tesseract.recognize(dataUrl, "eng", { logger: () => {} });

  const words: OCRWord[] = (res.data.words ?? [])
    .filter((w: any) => w.text && w.bbox)
    .map((w: any) => ({
      text: String(w.text),
      bbox: { x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 }
    }));

  return {
    text: res.data.text,
    words,
    imageSize: { width: res.data.imageSize.width, height: res.data.imageSize.height }
  };
}