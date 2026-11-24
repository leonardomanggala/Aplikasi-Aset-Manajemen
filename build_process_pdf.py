from pathlib import Path
import re
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether

ROOT = Path(__file__).parent
SOURCE = ROOT / 'ALUR-PROSES-PENGELOLAAN-ASET.md'
OUT = ROOT / 'output' / 'pdf' / 'Alur_Proses_Pengelolaan_Aset_SIMAS_Gereja.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)

styles = getSampleStyleSheet()
styles.add(ParagraphStyle('DocTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=21, leading=25, textColor=colors.HexColor('#111827'), spaceAfter=8))
styles.add(ParagraphStyle('Subtitle', parent=styles['Normal'], fontName='Helvetica', fontSize=10.5, leading=14, textColor=colors.HexColor('#376092'), spaceAfter=15))
styles.add(ParagraphStyle('H1x', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=14, leading=18, textColor=colors.HexColor('#111827'), spaceBefore=13, spaceAfter=6, keepWithNext=True))
styles.add(ParagraphStyle('H2x', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=11.2, leading=14, textColor=colors.HexColor('#1F2937'), spaceBefore=8, spaceAfter=4, keepWithNext=True))
styles.add(ParagraphStyle('Bodyx', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.2, leading=12.5, textColor=colors.HexColor('#172033'), spaceAfter=5))
styles.add(ParagraphStyle('Bulletx', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.2, leading=12.2, leftIndent=13, firstLineIndent=-8, bulletIndent=3, spaceAfter=2, textColor=colors.HexColor('#172033')))
styles.add(ParagraphStyle('Codex', parent=styles['Code'], fontName='Courier', fontSize=8.4, leading=11, leftIndent=11, textColor=colors.HexColor('#1F4E79'), backColor=colors.HexColor('#F4F7FB'), borderPadding=5, spaceAfter=6))
styles.add(ParagraphStyle('Cell', parent=styles['BodyText'], fontName='Helvetica', fontSize=7.8, leading=9.8, textColor=colors.HexColor('#172033'), spaceAfter=0))
styles.add(ParagraphStyle('CellHead', parent=styles['BodyText'], fontName='Helvetica-Bold', fontSize=7.9, leading=9.8, textColor=colors.white, spaceAfter=0))

def esc(text):
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def inline(text):
    text = esc(text)
    return re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)

def parse_table(lines, start):
    rows = []
    i = start
    while i < len(lines) and lines[i].strip().startswith('|'):
        cells = [x.strip() for x in lines[i].strip().strip('|').split('|')]
        if not all(set(x) <= set('-: ') for x in cells):
            rows.append(cells)
        i += 1
    return rows, i

def make_table(rows):
    if not rows:
        return Spacer(1, 1)
    data = []
    for ri, row in enumerate(rows):
        row = row + [''] * (len(rows[0]) - len(row))
        data.append([Paragraph(inline(cell), styles['CellHead' if ri == 0 else 'Cell']) for cell in row])
    widths = [170*mm / len(rows[0])] * len(rows[0])
    table = Table(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
    commands = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#17365D')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), .35, colors.HexColor('#D9E2F3')),
        ('LEFTPADDING', (0, 0), (-1, -1), 6), ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5)
    ]
    for r in range(1, len(data)):
        if r % 2 == 0:
            commands.append(('BACKGROUND', (0, r), (-1, r), colors.HexColor('#F4F7FB')))
    table.setStyle(TableStyle(commands))
    return KeepTogether([table, Spacer(1, 5)])

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica-Bold', 7.5)
    canvas.setFillColor(colors.HexColor('#376092'))
    canvas.drawString(18*mm, 286*mm, 'SIMAS GEREJA  |  PAROKI PRINGWULUNG')
    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(colors.HexColor('#64748B'))
    canvas.drawString(18*mm, 10*mm, 'Alur Proses Pengelolaan Aset')
    canvas.drawRightString(192*mm, 10*mm, f'Halaman {doc.page}')
    canvas.restoreState()

lines = SOURCE.read_text(encoding='utf-8').splitlines()
story = []
i = 0
while i < len(lines):
    line = lines[i].rstrip()
    if not line.strip():
        i += 1
        continue
    if line.startswith('# '):
        story.append(Paragraph(inline(line[2:]), styles['DocTitle']))
        story.append(Paragraph('Panduan operasional dan pengendalian data aset mulai dari pelaporan dan pencatatan spreadsheet hingga digitalisasi sistem', styles['Subtitle']))
    elif line.startswith('## '):
        story.append(Paragraph(inline(line[3:]), styles['H1x']))
    elif line.startswith('### '):
        story.append(Paragraph(inline(line[4:]), styles['H2x']))
    elif line.startswith('|'):
        rows, i = parse_table(lines, i)
        story.append(make_table(rows))
        continue
    elif line.startswith('- '):
        story.append(Paragraph('• ' + inline(line[2:]), styles['Bulletx']))
    elif re.match(r'^\d+\.\s+', line):
        num, text = re.match(r'^(\d+)\.\s+(.*)$', line).groups()
        story.append(Paragraph(f'{num}. {inline(text)}', styles['Bulletx']))
    elif line.startswith('    '):
        code_lines = []
        while i < len(lines) and (lines[i].startswith('    ') or not lines[i].strip()):
            if lines[i].startswith('    '):
                code_lines.append(esc(lines[i].strip()))
            i += 1
        story.append(Paragraph('<br/>'.join(code_lines), styles['Codex']))
        continue
    else:
        story.append(Paragraph(inline(line), styles['Bodyx']))
    i += 1

doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=22*mm, bottomMargin=17*mm, title='Alur Proses Lengkap Pengelolaan Aset Gereja', author='SIMAS Gereja')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT)
