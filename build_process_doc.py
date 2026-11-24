from pathlib import Path
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).parent
SOURCE = ROOT / 'ALUR-PROSES-PENGELOLAAN-ASET.md'
OUT = ROOT / 'output' / 'docx' / 'Alur_Proses_Pengelolaan_Aset_SIMAS_Gereja.docx'
OUT.parent.mkdir(parents=True, exist_ok=True)

def shade(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn('w:shd'))
    if shd is None:
        shd = OxmlElement('w:shd')
        tc_pr.append(shd)
    shd.set(qn('w:fill'), fill)

def borders(table, color='D9E2F3'):
    tbl = table._tbl
    tbl_pr = tbl.tblPr
    borders_el = tbl_pr.first_child_found_in('w:tblBorders')
    if borders_el is None:
        borders_el = OxmlElement('w:tblBorders')
        tbl_pr.append(borders_el)
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        tag = 'w:' + edge
        el = borders_el.find(qn(tag))
        if el is None:
            el = OxmlElement(tag)
            borders_el.append(el)
        el.set(qn('w:val'), 'single')
        el.set(qn('w:sz'), '6')
        el.set(qn('w:space'), '0')
        el.set(qn('w:color'), color)

def set_cell_text(cell, text, bold=False, color='172033', size=9.2):
    cell.text = ''
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.line_spacing = 1.08
    run = p.add_run(text.strip())
    run.bold = bold
    run.font.name = 'Aptos'
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER

def add_page_number(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = paragraph.add_run('Halaman ')
    fld = OxmlElement('w:fldSimple')
    fld.set(qn('w:instr'), 'PAGE')
    paragraph._p.append(fld)

def add_table(doc, rows):
    if not rows:
        return
    table = doc.add_table(rows=1, cols=len(rows[0]))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True
    hdr = table.rows[0].cells
    for i, value in enumerate(rows[0]):
        set_cell_text(hdr[i], value, True, 'FFFFFF', 9)
        shade(hdr[i], '17365D')
    for row_idx, row in enumerate(rows[1:], start=1):
        cells = table.add_row().cells
        for i, value in enumerate(row):
            set_cell_text(cells[i], value, False, '172033', 8.8)
            if row_idx % 2 == 0:
                shade(cells[i], 'F4F7FB')
    borders(table)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)

def add_body(doc, text):
    p = doc.add_paragraph(style='Body Text')
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.12
    p.add_run(text)

def add_list(doc, text, numbered=False):
    style = 'List Number' if numbered else 'List Bullet'
    p = doc.add_paragraph(style=style)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.08
    p.add_run(text)

def parse_table(lines, start):
    rows = []
    i = start
    while i < len(lines) and lines[i].strip().startswith('|'):
        parts = [x.strip() for x in lines[i].strip().strip('|').split('|')]
        if not all(set(x) <= set('-: ') for x in parts):
            rows.append(parts)
        i += 1
    return rows, i

doc = Document()
sec = doc.sections[0]
sec.top_margin = Inches(.72)
sec.bottom_margin = Inches(.68)
sec.left_margin = Inches(.78)
sec.right_margin = Inches(.78)
styles = doc.styles
styles['Normal'].font.name = 'Aptos'
styles['Normal'].font.size = Pt(10)
styles['Body Text'].font.name = 'Aptos'
styles['Body Text'].font.size = Pt(10)
styles['Title'].font.name = 'Aptos Display'
styles['Title'].font.size = Pt(24)
styles['Title'].font.bold = True
styles['Title'].font.color.rgb = RGBColor(0, 0, 0)
for name, size in [('Heading 1', 16), ('Heading 2', 12.5), ('Heading 3', 11.5)]:
    styles[name].font.name = 'Aptos Display'
    styles[name].font.size = Pt(size)
    styles[name].font.bold = True
    styles[name].font.color.rgb = RGBColor(0, 0, 0)
    styles[name].paragraph_format.space_before = Pt(12 if name == 'Heading 1' else 8)
    styles[name].paragraph_format.space_after = Pt(5)

header = sec.header.paragraphs[0]
header.text = 'SIMAS GEREJA  |  PAROKI PRINGWULUNG'
header.alignment = WD_ALIGN_PARAGRAPH.LEFT
for run in header.runs:
    run.font.name = 'Aptos'
    run.font.size = Pt(8)
    run.font.bold = True
    run.font.color.rgb = RGBColor(55, 96, 146)
footer = sec.footer.paragraphs[0]
footer.text = 'Alur Proses Pengelolaan Aset'
footer.runs[0].font.size = Pt(8)
footer.runs[0].font.color.rgb = RGBColor(100, 116, 139)
add_page_number(sec.footer.add_paragraph())

lines = SOURCE.read_text(encoding='utf-8').splitlines()
i = 0
first_title = True
while i < len(lines):
    line = lines[i].rstrip()
    if not line.strip():
        i += 1
        continue
    if line.startswith('# '):
        p = doc.add_paragraph(style='Title')
        p.add_run(line[2:].strip())
        sub = doc.add_paragraph()
        sub.paragraph_format.space_after = Pt(14)
        r = sub.add_run('Panduan operasional dan pengendalian data aset mulai dari pelaporan dan pencatatan spreadsheet hingga digitalisasi sistem')
        r.font.name = 'Aptos'
        r.font.size = Pt(11)
        r.font.color.rgb = RGBColor(55, 96, 146)
        first_title = False
    elif line.startswith('## '):
        doc.add_paragraph(line[3:].strip(), style='Heading 1')
    elif line.startswith('### '):
        doc.add_paragraph(line[4:].strip(), style='Heading 2')
    elif line.startswith('#### '):
        doc.add_paragraph(line[5:].strip(), style='Heading 3')
    elif line.startswith('|'):
        rows, i = parse_table(lines, i)
        add_table(doc, rows)
        continue
    elif line.startswith('- '):
        add_list(doc, line[2:].strip())
    elif re.match(r'^\d+\.\s+', line):
        add_list(doc, re.sub(r'^\d+\.\s+', '', line), True)
    elif line.startswith('    '):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(.25)
        p.paragraph_format.space_after = Pt(5)
        r = p.add_run(line.strip())
        r.font.name = 'Consolas'
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(31, 78, 121)
    else:
        add_body(doc, line)
    i += 1

doc.core_properties.title = 'Alur Proses Lengkap Pengelolaan Aset Gereja'
doc.core_properties.subject = 'SIMAS Gereja Paroki Pringwulung'
doc.core_properties.author = 'SIMAS Gereja'
doc.save(OUT)
print(OUT)
