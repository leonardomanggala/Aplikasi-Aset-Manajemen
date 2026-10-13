from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether

OUT = Path(r"C:\Users\G512LI\OneDrive\Documents\ChatGPT\Aplikasi Aset Manajemen\output\pdf\Leonardo_Manggala_Rate_Card_Indonesia.pdf")
OUT.parent.mkdir(parents=True, exist_ok=True)

NAVY=HexColor('#101B3F'); BLUE=HexColor('#3157E8'); TEAL=HexColor('#2CAD96')
INK=HexColor('#19233A'); MUTED=HexColor('#657089'); PALE=HexColor('#F3F6FC')
LINE=HexColor('#DFE5F0'); WHITE=colors.white

styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='eyebrow',fontName='Helvetica-Bold',fontSize=8,leading=10,textColor=HexColor('#BFCBFF'),spaceAfter=8))
styles.add(ParagraphStyle(name='titlecard',fontName='Helvetica-Bold',fontSize=27,leading=31,textColor=WHITE,spaceAfter=5))
styles.add(ParagraphStyle(name='subtitle',fontName='Helvetica',fontSize=10,leading=15,textColor=HexColor('#D9E1FF')))
styles.add(ParagraphStyle(name='h2rate',fontName='Helvetica-Bold',fontSize=12,leading=15,textColor=NAVY,spaceAfter=5))
styles.add(ParagraphStyle(name='bodyrate',fontName='Helvetica',fontSize=8.5,leading=12,textColor=INK,spaceAfter=3))
styles.add(ParagraphStyle(name='smallrate',fontName='Helvetica',fontSize=7.4,leading=10,textColor=MUTED))
styles.add(ParagraphStyle(name='price',fontName='Helvetica-Bold',fontSize=22,leading=25,textColor=BLUE,spaceAfter=4))
styles.add(ParagraphStyle(name='hourprice',fontName='Helvetica-Bold',fontSize=27,leading=29,textColor=WHITE))
styles.add(ParagraphStyle(name='idrprice',fontName='Helvetica-Bold',fontSize=18,leading=21,textColor=WHITE))
styles.add(ParagraphStyle(name='hourlabel',fontName='Helvetica',fontSize=8,leading=10,textColor=HexColor('#D9E1FF')))
styles.add(ParagraphStyle(name='pill',fontName='Helvetica-Bold',fontSize=7,leading=9,textColor=BLUE))

def P(text,style='bodyrate'):
    return Paragraph(text,styles[style])

def service_card(name,price,desc,items,highlight=False,width=82*mm):
    bg=HexColor('#EEF2FF') if highlight else PALE
    content=[P(name,'h2rate'),P(price,'price'),P(desc,'bodyrate'),Spacer(1,2*mm)]
    content.extend(P('•  '+x,'bodyrate') for x in items)
    t=Table([[content]],colWidths=[width])
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),bg),('BOX',(0,0),(-1,-1),0.6,BLUE if highlight else LINE),('LEFTPADDING',(0,0),(-1,-1),5*mm),('RIGHTPADDING',(0,0),(-1,-1),5*mm),('TOPPADDING',(0,0),(-1,-1),5*mm),('BOTTOMPADDING',(0,0),(-1,-1),5*mm),('VALIGN',(0,0),(-1,-1),'TOP')]))
    return t

def category_card(name,rate,offers,highlight=False):
    bg=HexColor('#EEF2FF') if highlight else PALE
    parts=[P(name,'h2rate')]
    if rate:
        parts.append(P(rate,'price'))
    for title,price,desc in offers:
        parts += [P(f'<b>{title}</b>  <font color="#3157E8"><b>{price}</b></font>','bodyrate'),P(desc,'smallrate'),Spacer(1,2*mm)]
    t=Table([[parts]],colWidths=[126*mm])
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),bg),('BOX',(0,0),(-1,-1),0.6,BLUE if highlight else LINE),('LEFTPADDING',(0,0),(-1,-1),5*mm),('RIGHTPADDING',(0,0),(-1,-1),5*mm),('TOPPADDING',(0,0),(-1,-1),4*mm),('BOTTOMPADDING',(0,0),(-1,-1),2*mm),('VALIGN',(0,0),(-1,-1),'TOP')]))
    return t

def footer(c,doc):
    c.saveState(); w,h=landscape(A4)
    c.setStrokeColor(LINE); c.line(17*mm,15*mm,w-17*mm,15*mm)
    c.setFillColor(MUTED); c.setFont('Helvetica',7)
    c.drawString(17*mm,10*mm,'LEONARDO MANGGALA  /  DESAIN GRAFIS & UI/UX')
    c.drawRightString(w-17*mm,10*mm,'HARGA DALAM RUPIAH')
    c.restoreState()

doc=SimpleDocTemplate(str(OUT),pagesize=landscape(A4),rightMargin=17*mm,leftMargin=17*mm,topMargin=12*mm,bottomMargin=18*mm,title='Rate Card Desain Grafis dan UI/UX | Leonardo Manggala',author='Leonardo Manggala Wardhana')
story=[]
head=Table([[ [P('LAYANAN DESAIN  /  2026','eyebrow'),P('Desain Grafis + UI/UX','titlecard'),P('Visual yang kuat dan pengalaman digital yang mudah digunakan untuk brand, SaaS, dan produk kesehatan.','subtitle')], [P('TARIF PER JAM','eyebrow'),P('Rp175.000','idrprice'),P('Desain grafis / jam','hourlabel'),Spacer(1,1*mm),P('Rp215.000','idrprice'),P('Desain UI/UX / jam','hourlabel')] ]],colWidths=[204*mm,54*mm],rowHeights=[45*mm])
head.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),NAVY),('ROUNDEDCORNERS',[5,5,5,5]),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),8*mm),('RIGHTPADDING',(0,0),(-1,-1),6*mm),('TOPPADDING',(0,0),(-1,-1),6*mm),('BOTTOMPADDING',(0,0),(-1,-1),6*mm)]))
story += [head,Spacer(1,4*mm),P('Pilihan layanan untuk berkolaborasi','h2rate'),P('Harga paket berikut adalah harga awal. Cakupan bisa kita sesuaikan dengan tujuan, waktu, dan anggaran proyek Anda.','smallrate'),Spacer(1,2*mm)]
cards=Table([[category_card('DESAIN GRAFIS & BRAND','',[
    ('Desain promosi & media sosial','Rp1.450.000+','Butuh visual baru untuk kampanye Anda? Paket mencakup hingga 3 desain media sosial atau 1 flyer, poster, atau banner digital. Termasuk file final dan 1 kali revisi.'),
    ('Paket awal identitas brand','Rp4.500.000+','Bangun tampilan brand yang konsisten dengan arahan logo, palet warna dan tipografi, serta 2 aplikasi brand sederhana. Termasuk 2 kali revisi.'),
]),category_card('DESAIN PRODUK DIGITAL','',[
    ('Fondasi UX','Rp2.700.000+','Mari buat satu alur utama lebih mudah digunakan. Termasuk evaluasi alur, saran prioritas, dan rancangan user flow atau konsep low-fidelity.'),
    ('Desain UI/UX produk','Rp6.300.000+','Wujudkan satu fitur hingga 5 layar, wireframe, UI final, prototipe Figma interaktif, dan file handoff untuk tim pengembang.'),
],True)]],colWidths=[131*mm,131*mm])
cards.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),2*mm)]))
story += [cards,Spacer(1,3*mm)]

included=Table([[P('YANG TERMASUK','h2rate'),P('ALUR KERJA','h2rate')],
    [P('•  File desain dan ekspor sesuai format yang disepakati<br/>•  Komunikasi dan kabar perkembangan secara berkala<br/>•  Prototipe Figma dan handoff untuk proyek UI/UX','bodyrate'),P('•  Cakupan dan hasil kerja disepakati sebelum mulai<br/>•  Pembayaran proyek berdasarkan tahapan<br/>•  Revisi tambahan atau perubahan cakupan dibicarakan terlebih dahulu','bodyrate')]],colWidths=[129*mm,129*mm])
included.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),WHITE),('BOX',(0,0),(-1,-1),0.6,LINE),('INNERGRID',(0,0),(-1,-1),0.4,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),5*mm),('RIGHTPADDING',(0,0),(-1,-1),5*mm),('TOPPADDING',(0,0),(-1,-1),4*mm),('BOTTOMPADDING',(0,0),(-1,-1),3*mm)]))
story += [included,Spacer(1,5*mm)]
note=Table([[P('<b>Proyek kesehatan dan alur kerja kompleks</b><br/>Untuk proyek terkait alur klinis, data medis, analisis berbantuan AI, atau integrasi sistem, saya akan memahami kebutuhan dan batasannya terlebih dahulu sebelum memberikan penawaran khusus.','bodyrate'),P('<b>Mari diskusikan proyek Anda</b><br/>Ceritakan tujuan, jadwal, dan hasil yang Anda butuhkan untuk mendapat estimasi sesuai cakupan.','bodyrate')]],colWidths=[155*mm,103*mm])
note.setStyle(TableStyle([('BACKGROUND',(0,0),(0,0),HexColor('#EAF7F4')),('BACKGROUND',(1,0),(1,0),PALE),('BOX',(0,0),(-1,-1),0.6,LINE),('INNERGRID',(0,0),(-1,-1),0.4,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),5*mm),('RIGHTPADDING',(0,0),(-1,-1),5*mm),('TOPPADDING',(0,0),(-1,-1),4*mm),('BOTTOMPADDING',(0,0),(-1,-1),3*mm)]))
story += [note,Spacer(1,3*mm),P('Semua harga dalam Rupiah. Biaya pihak ketiga, pajak, dan pekerjaan di luar cakupan yang disepakati belum termasuk. Alur produk yang lebih besar, sistem identitas brand lengkap, dan produksi cetak akan dihitung setelah diskusi kebutuhan.','smallrate')]
doc.build(story,onFirstPage=footer)
print(OUT)
