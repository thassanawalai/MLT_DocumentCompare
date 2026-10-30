import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for Vite / Browser environment
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface RenderedPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * Render a PDF File, Blob, or URL into array of page image data URLs with dimensions
 */
export async function renderPdfToImages(
  source: File | Blob | ArrayBuffer | string,
  scale = 2.0
): Promise<RenderedPage[]> {
  try {
    let data: Uint8Array | undefined;
    let url: string | undefined;

    if (typeof source === 'string') {
      if (source.startsWith('data:') || source.startsWith('blob:') || source.startsWith('/') || source.startsWith('http')) {
        url = source;
      }
    } else if (source instanceof File || source instanceof Blob) {
      const buffer = await source.arrayBuffer();
      data = new Uint8Array(buffer);
    } else if (source instanceof ArrayBuffer) {
      data = new Uint8Array(source);
    }

    const loadingTask = url
      ? pdfjsLib.getDocument({ url })
      : pdfjsLib.getDocument({ data: data! });

    const pdf = await loadingTask.promise;
    const pages: RenderedPage[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const unscaledViewport = page.getViewport({ scale: 1.0 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (context) {
        // White background
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        // @ts-ignore
        await page.render(renderContext).promise;

        pages.push({
          pageNumber: i,
          dataUrl: canvas.toDataURL('image/png'),
          width: viewport.width,
          height: viewport.height,
          viewportWidth: unscaledViewport.width,
          viewportHeight: unscaledViewport.height,
        });
      }
    }

    return pages;
  } catch (error) {
    console.error('Failed to render PDF pages:', error);
    throw error;
  }
}
