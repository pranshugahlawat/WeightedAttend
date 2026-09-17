import * as pdfjsLib from "pdfjs-dist";

export async function pdfPageToImage(file: File, pageNo: number): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  // Use local worker served from /public (fixes CDN fetch failure)
  // @ts-ignore
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(pageNo);

  const viewport = page.getViewport({ scale: 2.2 });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/png");
}