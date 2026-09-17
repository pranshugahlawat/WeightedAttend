import * as pdfjsLib from "pdfjs-dist";

export async function pdfPageToImage(file: File, pageNo: number): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // @ts-ignore
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjsLib as any).version}/pdf.worker.min.js`;

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