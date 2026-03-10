import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  BorderStyle,
  ThematicBreak
} from "docx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";

function parseMarkdownToChildren(markdownText: string) {
  const sanitizedText = markdownText.replace(/\\n/g, '\n');
  const lines = sanitizedText.split('\n');
  const children: any[] = [];

  const createDivider = () => new Paragraph({
    children: [new ThematicBreak()],
    spacing: { before: 100, after: 100 }
  });

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      children.push(new Paragraph({ spacing: { after: 100 } }));
      continue;
    }

    if (trimmed.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: trimmed.replace('# ', '').toUpperCase(),
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (trimmed.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: trimmed.replace('## ', '').toUpperCase(),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
          border: {
            bottom: {
              color: "auto",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
        })
      );
    } else if (trimmed.startsWith('### ')) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.replace('### ', ''),
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.substring(2),
              size: 22,
            })
          ],
          bullet: { level: 0 },
          spacing: { after: 80 },
        })
      );
    } else {
      const isContactInfo = children.length === 1;
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              size: isContactInfo ? 20 : 22,
            })
          ],
          alignment: isContactInfo ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { after: 120 },
        })
      );
      if (isContactInfo) {
        children.push(createDivider());
      }
    }
  }
  return children;
}

export async function generateWordDoc(resumeMarkdown: string, coverLetterMarkdown?: string, fileName: string = "Optimized_Resume.docx") {
  const resumeChildren = parseMarkdownToChildren(resumeMarkdown);
  const children = [...resumeChildren];

  if (coverLetterMarkdown) {
    children.push(new Paragraph({ text: "", pageBreakBefore: true }));
    const coverLetterChildren = parseMarkdownToChildren(coverLetterMarkdown);
    children.push(...coverLetterChildren);
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22,
          },
        },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 36,
            bold: true,
            color: "000000",
            font: "Calibri",
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 28,
            bold: true,
            color: "000000",
            font: "Calibri",
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
}

export async function generatePdf(resumeMarkdown: string, coverLetterMarkdown?: string, fileName: string = "Optimized_Resume.pdf") {
  const doc = new jsPDF();
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = margin;

  const addText = (text: string, size: number, bold: boolean = false, center: boolean = false) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    
    for (const line of lines) {
      if (y > 280) {
        doc.addPage();
        y = margin;
      }
      
      if (center) {
        const textWidth = doc.getTextWidth(line);
        doc.text(line, (pageWidth - textWidth) / 2, y);
      } else {
        doc.text(line, margin, y);
      }
      y += size * 0.5;
    }
    y += 2;
  };

  const processMarkdown = (markdown: string) => {
    const sanitizedText = markdown.replace(/\\n/g, '\n');
    const lines = sanitizedText.split('\n');
    let isFirstLine = true;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        y += 5;
        continue;
      }

      if (trimmed.startsWith('# ')) {
        addText(trimmed.replace('# ', '').toUpperCase(), 18, true, true);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;
      } else if (trimmed.startsWith('## ')) {
        y += 5;
        addText(trimmed.replace('## ', '').toUpperCase(), 14, true);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;
      } else if (trimmed.startsWith('### ')) {
        addText(trimmed.replace('### ', ''), 12, true);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        addText("• " + trimmed.substring(2), 11);
      } else {
        const center = isFirstLine || y < 50; // Simple heuristic for contact info
        addText(trimmed, 11, false, center);
      }
      isFirstLine = false;
    }
  };

  processMarkdown(resumeMarkdown);
  
  if (coverLetterMarkdown) {
    doc.addPage();
    y = margin;
    processMarkdown(coverLetterMarkdown);
  }

  doc.save(fileName);
}
