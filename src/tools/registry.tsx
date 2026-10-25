import React from 'react';
import { ToolDef } from '../types';
import {
  FileImage,
  FileText,
  ScanText,
  Files,
  Scissors,
  SlidersHorizontal,
  RotateCw,
  ListOrdered,
  Minimize2,
  Scaling,
  Binary,
  FilePlus,
  FileCog
} from 'lucide-react';

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
    description: 'Convert JPG, PNG, WEBP, GIF, SVG to clean PDF documents with page layout and margin controls.',
    keywords: ['jpg to pdf', 'png to pdf', 'image to pdf', 'photo to pdf', 'picture to pdf', 'compile pdf', 'scan to pdf'],
    route: '/image-to-pdf',
    accent: 'amber',
    featured: true,
    category: 'pdf',
    component: ImageToPdfTool,
    icon: (props) => <FileImage size={props?.size ?? 20} className={props?.className} strokeWidth={1.75} />
  },
  {
    id: 'convert-compress-image',
    name: 'Image Converter & Compressor',
    description: 'Convert between JPG, PNG, WEBP and reduce file size with honest byte-level before/after stats.',
    keywords: ['compress image', 'image converter', 'png to jpg', 'jpg to webp', 'reduce image size', 'shrink photo'],
    route: '/convert-compress-image',
    accent: 'green',
    featured: true,
    category: 'image',
    component: ImageConvertCompressTool,
    icon: (props) => <SlidersHorizontal size={props?.size ?? 20} className={props?.className} strokeWidth={1.75} />
  },
  {
    id: 'pdf-to-text',
    name: 'PDF to Text',
    description: 'Extract digital text or run self-hosted 300 DPI Hindi and English OCR on scanned PDF pages.',
    keywords: ['pdf to text', 'extract text', 'read pdf', 'scanned pdf', 'ocr pdf', 'copy text from pdf', 'pdf text extractor'],
    route: '/pdf-to-text',
    accent: 'indigo',
    category: 'text',
    component: PdfToTextTool,
    icon: (props) => <FileText size={props?.size ?? 20} className={props?.className} strokeWidth={1.75} />
  },
  {
    id: 'image-to-text',
    name: 'Image to Text (OCR)',
    description: 'Extract printed text from images with English and Hindi self-hosted best models and markdown export.',
    keywords: ['ocr', 'image to text', 'scan to text', 'extract text from photo', 'hindi ocr', 'tesseract', 'screenshot to text'],
    route: '/image-to-text',
    accent: 'green',
    category: 'text',
    component: ImageToTextTool,
    icon: (props) => <ScanText size={props?.size ?? 20} className={props?.className} strokeWidth={1.75} />
  },
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    description: 'Combine multiple PDF documents into a single organized file with full page order control.',
    keywords: ['merge pdf', 'combine pdf', 'join pdf', 'unite pdf', 'concatenate pdf', 'bind pdf'],
    route: '/merge-pdf',
    accent: 'amber',
    category: 'pdf',
    component: MergePdfTool,
    icon: (props) => <Files size={props?.size ?? 20} className={props?.className} strokeWidth={1.75} />
  },
  {
    id: 'split-pdf',
    name: 'Split / Extract PDF',
    description: 'Extract specific page ranges into a new PDF or download every page as individual files.',
    keywords: ['split pdf', 'extract pdf pages', 'cut pdf', 'break pdf', 'separate pdf', 'divide pdf'],
    route: '/split-pdf',
    accent: 'indigo',
    category: 'pdf',
    component: SplitPdfTool,
    icon: (props) => <Scissors size={props?.size ?? 20} className={props?.className} strokeWidth={1.75} />
  },
  {
    id: 'pdf-to-image',
    name: 'PDF to Image',
    description: 'Convert PDF pages into high-resolution PNG or JPG images at 1x, 2x, or 3x scale in a ZIP file.',
    keywords: ['pdf to image', 'pdf to png', 'pdf to jpg', 'pdf to picture', 'render pdf', 'export pdf as image'],
    route: '/pdf-to-image',
    accent: 'green',
    category: 'image',
    component: PdfToImageTool,
    icon: (props) => <FileImage size={props?.size ?? 20} className={props?.className} strokeWidth={1.75} />
  },
  {
    id: 'rotate-pdf',
    name: 'Rotate PDF',
    description: 'Rotate all or specific PDF pages by 90°, 180°, or 270° permanently with zero quality degradation.',
    keywords: ['rotate pdf', 'turn pdf pages', 'fix upside down pdf', 'change pdf orientation'],
    route: '/rotate-pdf',
    accent: 'indigo',
    category: 'pdf',
    component: RotatePdfTool,
    icon: (props) => <RotateCw size={props?.size ?? 20} className={props?.className} strokeWidth={1.75} />
  },
  {
    id: 'reorder-pdf',
    name: 'Reorder & Delete PDF Pages',
    description: 'Visual thumbnail arranger to drag, re-order, or delete individual pages from a PDF document.',
    keywords: ['reorder pdf', 'delete pdf pages', 'rearrange pdf pages', 'organize pdf', 'remove pdf pages'],
    route: '/reorder-pdf',
    accent: 'green',
    category: 'pdf',
    component: ReorderPdfTool,
    icon: (props) => <ListOrdered size={props?.size ?? 20} className={props?.className} strokeWidth={1.75} />
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Shrink bloated PDF documents with adjustable DPI and JPEG compression with exact size diff.',
    keywords: ['compress pdf', 'reduce pdf size', 'shrink pdf', 'small pdf', 'optimize pdf size'],
    route: '/compress-pdf',
    accent: 'amber',
    category: 'pdf',
    component: CompressPdfTool,
    icon: (props) => <Minimize2 size={props?.size ?? 20} className={props?.className} strokeWidth={1.75} />
  },
  {
    id: 'resize-image',
    name: 'Resize Image',
    description: 'Scale images to custom pixel dimensions or percentage with aspect ratio locking.',
    keywords: ['resize image', 'scale image', 'change image dimensions', 'crop picture', 'photo resizer'],
    route: '/resize-image',
    accent: 'indigo',
    category: 'image',
    component: ResizeImageTool,
    icon: (props) => <Scaling size={props?.size ?? 20} className={props?.className} strokeWidth={1.75} />
  },
  {
    id: 'image-to-base64',
    name: 'Image to Base64',
    description: 'Convert images into inline Data URI strings with one-click HTML and CSS code generator.',
    keywords: ['image to base64', 'data uri', 'base64 encoder', 'embed image in html', 'inline image'],
    route: '/image-to-base64',
    accent: 'green',
    category: 'text',
    component: ImageToBase64Tool,
    icon: (props) => <Binary size={props?.size ?? 20} className={props?.className} strokeWidth={1.75} />
  },
  {
    id: 'text-to-pdf',
    name: 'Text to PDF',
    description: 'Convert plain text notes, markdown, or text files into formatted multi-page PDF documents.',
    keywords: ['text to pdf', 'convert txt to pdf', 'markdown to pdf', 'notes to pdf', 'write pdf'],
    route: '/text-to-pdf',
    accent: 'amber',
    category: 'pdf',
    component: TextToPdfTool,
    icon: (props) => <FilePlus size={props?.size ?? 20} className={props?.className} strokeWidth={1.75} />
  },
  {
    id: 'pdf-metadata',
    name: 'PDF Metadata Viewer & Editor',
    description: 'Inspect and edit document Title, Author, Subject, and Keywords without altering document content.',
    keywords: ['pdf metadata', 'edit pdf author', 'change pdf title', 'pdf info viewer', 'pdf properties'],
    route: '/pdf-metadata',
    accent: 'indigo',
    category: 'pdf',
    component: PdfMetadataTool,
    icon: (props) => <FileCog size={props?.size ?? 20} className={props?.className} strokeWidth={1.75} />
  }
];
