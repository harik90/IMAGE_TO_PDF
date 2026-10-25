import React from 'react';
import { ToolDef } from '../types';

const ImageToPdfTool = React.lazy(() => import('./ImageToPdf').then(m => ({ default: m.ImageToPdfTool })));
const PdfToTextTool = React.lazy(() => import('./PdfToText').then(m => ({ default: m.PdfToTextTool })));
const ImageToTextTool = React.lazy(() => import('./ImageToText').then(m => ({ default: m.ImageToTextTool })));
const MergePdfTool = React.lazy(() => import('./MergePdf').then(m => ({ default: m.MergePdfTool })));
const SplitPdfTool = React.lazy(() => import('./SplitPdf').then(m => ({ default: m.SplitPdfTool })));
const PdfToImageTool = React.lazy(() => import('./PdfToImage').then(m => ({ default: m.PdfToImageTool })));
const ImageConvertCompressTool = React.lazy(() => import('./ImageConvertCompress').then(m => ({ default: m.ImageConvertCompressTool })));
const RotatePdfTool = React.lazy(() => import('./RotatePdf').then(m => ({ default: m.RotatePdfTool })));
const ReorderPdfTool = React.lazy(() => import('./ReorderPdf').then(m => ({ default: m.ReorderPdfTool })));
const CompressPdfTool = React.lazy(() => import('./CompressPdf').then(m => ({ default: m.CompressPdfTool })));
const ResizeImageTool = React.lazy(() => import('./ResizeImage').then(m => ({ default: m.ResizeImageTool })));
const ImageToBase64Tool = React.lazy(() => import('./ImageToBase64').then(m => ({ default: m.ImageToBase64Tool })));
const TextToPdfTool = React.lazy(() => import('./TextToPdf').then(m => ({ default: m.TextToPdfTool })));
const PdfMetadataTool = React.lazy(() => import('./PdfMetadata').then(m => ({ default: m.PdfMetadataTool })));

export const toolsRegistry: ToolDef[] = [
  {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    description: 'Convert JPG, PNG, WEBP, GIF, SVG, BMP to clean PDF documents with page layout controls.',
    keywords: ['jpg to pdf', 'png to pdf', 'image to pdf', 'photo to pdf', 'picture to pdf', 'compile pdf', 'scan to pdf'],
    route: '/image-to-pdf',
    accent: 'amber',
    component: ImageToPdfTool,
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
    )
  },
  {
    id: 'pdf-to-text',
    name: 'PDF to Text',
    description: 'Extract digital text with line positions or run automatic local OCR on scanned PDF pages.',
    keywords: ['pdf to text', 'extract text', 'read pdf', 'scanned pdf', 'ocr pdf', 'copy text from pdf', 'pdf text extractor'],
    route: '/pdf-to-text',
    accent: 'indigo',
    component: PdfToTextTool,
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    )
  },
  {
    id: 'image-to-text',
    name: 'Image to Text (OCR)',
    description: 'Extract printed and handwritten text from images with English and Hindi self-hosted OCR.',
    keywords: ['ocr', 'image to text', 'scan to text', 'extract text from photo', 'hindi ocr', 'tesseract', 'screenshot to text'],
    route: '/image-to-text',
    accent: 'green',
    component: ImageToTextTool,
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 7 4 4 20 4 20 7"></polyline>
        <line x1="9" y1="20" x2="15" y2="20"></line>
        <line x1="12" y1="4" x2="12" y2="20"></line>
      </svg>
    )
  },
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    description: 'Combine multiple PDF documents into a single organized file with full page order control.',
    keywords: ['merge pdf', 'combine pdf', 'join pdf', 'unite pdf', 'concatenate pdf', 'bind pdf'],
    route: '/merge-pdf',
    accent: 'amber',
    component: MergePdfTool,
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="12" y1="18" x2="12" y2="12"></line>
        <line x1="9" y1="15" x2="15" y2="15"></line>
      </svg>
    )
  },
  {
    id: 'split-pdf',
    name: 'Split / Extract PDF',
    description: 'Extract specific page ranges (e.g. 1-3,5) into a new PDF or download each page in a ZIP archive.',
    keywords: ['split pdf', 'extract pdf pages', 'cut pdf', 'break pdf', 'separate pdf', 'divide pdf'],
    route: '/split-pdf',
    accent: 'indigo',
    component: SplitPdfTool,
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="12" x2="20" y2="12"></line>
      </svg>
    )
  },
  {
    id: 'pdf-to-image',
    name: 'PDF to Image',
    description: 'Convert PDF pages into high-resolution PNG or JPG images at 1x, 2x, or 3x scale in a ZIP file.',
    keywords: ['pdf to image', 'pdf to png', 'pdf to jpg', 'pdf to picture', 'render pdf', 'export pdf as image'],
    route: '/pdf-to-image',
    accent: 'green',
    component: PdfToImageTool,
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
    )
  },
  {
    id: 'convert-compress-image',
    name: 'Image Converter & Compressor',
    description: 'Convert between JPG, PNG, and WEBP formats and shrink file size with honest before/after metrics.',
    keywords: ['compress image', 'image converter', 'png to jpg', 'jpg to webp', 'reduce image size', 'shrink photo'],
    route: '/convert-compress-image',
    accent: 'amber',
    component: ImageConvertCompressTool,
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
      </svg>
    )
  },
  {
    id: 'rotate-pdf',
    name: 'Rotate PDF',
    description: 'Rotate all or specific PDF pages by 90°, 180°, or 270° permanently with zero quality loss.',
    keywords: ['rotate pdf', 'turn pdf pages', 'fix upside down pdf', 'change pdf orientation'],
    route: '/rotate-pdf',
    accent: 'indigo',
    component: RotatePdfTool,
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"></polyline>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
      </svg>
    )
  },
  {
    id: 'reorder-pdf',
    name: 'Reorder & Delete PDF Pages',
    description: 'Visual thumbnail arranger to drag, re-order, or delete individual pages from a PDF document.',
    keywords: ['reorder pdf', 'delete pdf pages', 'rearrange pdf pages', 'organize pdf', 'remove pdf pages'],
    route: '/reorder-pdf',
    accent: 'green',
    component: ReorderPdfTool,
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
      </svg>
    )
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Shrink bloated PDF documents with adjustable DPI and JPEG compression. Honest size diff.',
    keywords: ['compress pdf', 'reduce pdf size', 'shrink pdf', 'small pdf', 'optimize pdf size'],
    route: '/compress-pdf',
    accent: 'amber',
    component: CompressPdfTool,
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 14 10 14 10 20"></polyline>
        <polyline points="20 10 14 10 14 4"></polyline>
        <line x1="14" y1="10" x2="21" y2="3"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
      </svg>
    )
  },
  {
    id: 'resize-image',
    name: 'Resize Image',
    description: 'Scale images to custom pixel dimensions or percentage with aspect ratio locking.',
    keywords: ['resize image', 'scale image', 'change image dimensions', 'crop picture', 'photo resizer'],
    route: '/resize-image',
    accent: 'indigo',
    component: ResizeImageTool,
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h6v6"></path>
        <path d="M9 21H3v-6"></path>
        <path d="M21 3l-7 7"></path>
        <path d="M3 21l7-7"></path>
      </svg>
    )
  },
  {
    id: 'image-to-base64',
    name: 'Image to Base64',
    description: 'Convert images into inline Data URI strings with one-click HTML and CSS code generator.',
    keywords: ['image to base64', 'data uri', 'base64 encoder', 'embed image in html', 'inline image'],
    route: '/image-to-base64',
    accent: 'green',
    component: ImageToBase64Tool,
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    )
  },
  {
    id: 'text-to-pdf',
    name: 'Text to PDF',
    description: 'Convert text notes, markdown, or plain text files into formatted multi-page PDF documents.',
    keywords: ['text to pdf', 'convert txt to pdf', 'markdown to pdf', 'notes to pdf', 'write pdf'],
    route: '/text-to-pdf',
    accent: 'amber',
    component: TextToPdfTool,
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
    )
  },
  {
    id: 'pdf-metadata',
    name: 'PDF Metadata Viewer & Editor',
    description: 'Inspect and edit document Title, Author, Subject, and Keywords without altering document content.',
    keywords: ['pdf metadata', 'edit pdf author', 'change pdf title', 'pdf info viewer', 'pdf properties'],
    route: '/pdf-metadata',
    accent: 'indigo',
    component: PdfMetadataTool,
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    )
  }
];
