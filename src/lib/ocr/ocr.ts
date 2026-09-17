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

  const words: OCRWord[] = ((res.data as any).words ?? [])
    .filter((w: any) => w.text && w.bbox)
    .map((w: any) => ({
      text: String(w.text),
      bbox: { x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 }
    }));

  const anyData = res.data as any;
  const imageSize =
    anyData.imageSize?.width && anyData.imageSize?.height
      ? { width: anyData.imageSize.width, height: anyData.imageSize.height }
      : inferImageSizeFromWords(words);

  return {
    text: res.data.text,
    words,
    imageSize
  };
}

function inferImageSizeFromWords(words: OCRWord[]) {
  let width = 0;
  let height = 0;
  for (const w of words) {
    width = Math.max(width, w.bbox.x1);
    height = Math.max(height, w.bbox.y1);
  }
  // non-zero fallback
  return { width: width || 2000, height: height || 2000 };
}