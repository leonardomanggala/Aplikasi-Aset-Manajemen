from pathlib import Path
import re
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'PANDUAN-PENGGUNAAN.md'
OUTPUT = ROOT / 'Panduan_Penggunaan_SIMAS_Gereja.pdf'

def clean(value):
    replacements = {'–': '-', '—': '-', '·': '-', '✓': 'OK', '→': '->', '’': "'", '“': '"', '”': '"', '•': '-'}
    for old, new in replacements.items():
        value = value.replace(old, new)
    return value

def inline(value):
    value = clean(value)
    value = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', value)
    value = re.sub(r'`(.*?)`', r'<font name="Courier" color="#174A8B">\1</font>', value)
    return value

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='ManualTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=22, leading=26, textColor=colors.HexColor('#111827'), spaceAfter=5))
styles.add(ParagraphStyle(name='ManualH1', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=15, leading=18, textColor=colors.HexColor('#174A8B'), spaceBefore=12, spaceAfter=5, keepWithNext=True))
styles.add(ParagraphStyle(name='ManualH2', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=11.5, leading=14, textColor=colors.HexColor('#344054'), spaceBefore=8, spaceAfter=4, keepWithNext=True))
styles.add(ParagraphStyle(name='ManualBody', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.25, leading=12.5, textColor=colors.HexColor('#222222'), spaceAfter=5))
styles.add(ParagraphStyle(name='ManualBullet', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.25, leading=12.5, leftIndent=12, firstLineIndent=-8, textColor=colors.HexColor('#222222'), spaceAfter=3))
styles.add(ParagraphStyle(name='ManualCode', parent=styles['BodyText'], fontName='Courier', fontSize=8.6, leading=11, leftIndent=12, textColor=colors.HexColor('#174A8B'), spaceBefore=2, spaceAfter=7))
styles.add(ParagraphStyle(name='ManualFooter', parent=styles['BodyText'], fontName='Helvetica', fontSize=7.5, leading=9, textColor=colors.HexColor('#667085'), alignment=TA_RIGHT))

def parse_rows(lines, index):
    rows = []
    while index < len(lines) and lines[index].strip().startswith('|'):
        raw = lines[index].strip().strip('|')
        if not re.fullmatch(r'\s*:?[-]+:?\s*(\|\s*:?[-]+:?\s*)+\|?', raw):
            rows.append([part.strip() for part in raw.split('|')])
        index += 1
    return rows, index

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#D9E2F2'))
    canvas.setLineWidth(0.4)
    canvas.line(18*mm, 14*mm, 192*mm, 14*mm)
    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(colors.HexColor('#667085'))
    canvas.drawRightString(192*mm, 9*mm, f'Halaman {doc.page}')
    canvas.restoreState()

def build():
    doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=16*mm, bottomMargin=20*mm, title='Panduan Penggunaan SIMAS Gereja Aset Manajemen', author='SIMAS Gereja')
    lines = SOURCE.read_text(encoding='utf-8').replace('\r\n', '\n').split('\n')
    story = []
    i = 0
    while i < len(lines):
        line = lines[i].strip('\ufeff')
        if not line.strip():
            i += 1
            continue
        if line.startswith('```'):
            code = []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                code.append(clean(lines[i]))
                i += 1
            story.append(Paragraph('<br/>'.join(code), styles['ManualCode']))
            i += 1
            continue
        if line.startswith('# '):
            story.append(Paragraph(inline(line[2:]), styles['ManualTitle']))
            story.append(Spacer(1, 4))
            i += 1
            continue
        heading = re.match(r'^(#{2,3})\s+(.*)$', line)
        if heading:
            style = styles['ManualH1'] if len(heading.group(1)) == 2 else styles['ManualH2']
            story.append(Paragraph(inline(heading.group(2)), style))
            i += 1
            continue
        if line.startswith('|') and i + 1 < len(lines) and lines[i+1].strip().startswith('|'):
            rows, i = parse_rows(lines, i)
            data = [[Paragraph(inline(cell), styles['ManualBody']) for cell in row] for row in rows]
            table = Table(data, repeatRows=1, hAlign='LEFT')
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#174A8B')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F6FA')]),
                ('GRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#D9D9D9')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 6), ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(table)
            story.append(Spacer(1, 7))
            continue
        bullet = re.match(r'^[-*]\s+(.*)$', line)
        if bullet:
            story.append(Paragraph('- ' + inline(bullet.group(1)), styles['ManualBullet']))
            i += 1
            continue
        ordered = re.match(r'^(\d+)\.\s+(.*)$', line)
        if ordered:
            story.append(Paragraph(f"{ordered.group(1)}. {inline(ordered.group(2))}", styles['ManualBullet']))
            i += 1
            continue
        story.append(Paragraph(inline(line), styles['ManualBody']))
        i += 1
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUTPUT)

if __name__ == '__main__':
    build()
