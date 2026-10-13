from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether

OUT = Path(r"C:\Users\G512LI\OneDrive\Documents\ChatGPT\Aplikasi Aset Manajemen\output\pdf\Leonardo_Manggala_Design_Rate_Card_Friendly.pdf")
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
    c.drawString(17*mm,10*mm,'LEONARDO MANGGALA  /  FREELANCE UI/UX DESIGN')
    c.drawRightString(w-17*mm,10*mm,'USD · PROJECT PRICING')
    c.restoreState()

doc=SimpleDocTemplate(str(OUT),pagesize=landscape(A4),rightMargin=17*mm,leftMargin=17*mm,topMargin=12*mm,bottomMargin=18*mm,title='Graphic Design and UI/UX Rate Card | Leonardo Manggala',author='Leonardo Manggala Wardhana')
story=[]
head=Table([[ [P('DESIGN SERVICES  /  2026','eyebrow'),P('Graphic Design + UI/UX','titlecard'),P('Visual communication and thoughtful digital experiences for brands, SaaS, and healthcare products.','subtitle')], [P('HOURLY RATES','eyebrow'),P('$10  <font size="9">/ hr</font>','hourprice'),P('Graphic design','hourlabel'),Spacer(1,1*mm),P('$12  <font size="9">/ hr</font>','hourprice'),P('UI/UX design','hourlabel')] ]],colWidths=[204*mm,54*mm],rowHeights=[45*mm])
head.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),NAVY),('ROUNDEDCORNERS',[5,5,5,5]),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),8*mm),('RIGHTPADDING',(0,0),(-1,-1),6*mm),('TOPPADDING',(0,0),(-1,-1),6*mm),('BOTTOMPADDING',(0,0),(-1,-1),6*mm)]))
story += [head,Spacer(1,4*mm),P('Ways we can work together','h2rate'),P('These starting packages are a helpful place to begin. We can shape the scope around your goals, timeline, and budget.','smallrate'),Spacer(1,2*mm)]
cards=Table([[category_card('BRAND & MARKETING DESIGN','',[
    ('Social & marketing design','$80+','Need a fresh visual for your campaign? Choose up to 3 social graphics or one flyer, poster, or digital banner. Final exports and one revision are included.'),
    ('Brand starter','$250+','Build a consistent starting point with a logo direction, color and type palette, and two simple brand applications. Two revision rounds are included.'),
]),category_card('DIGITAL PRODUCT DESIGN','',[
    ('UX foundation','$150+','Let’s make one key journey easier to use. Includes a flow review, prioritized suggestions, and a proposed user flow or low-fidelity concept.'),
    ('Product UI/UX','$350+','Bring one feature to life with up to 5 screens, wireframes, polished UI, a clickable Figma prototype, and a handoff for your development team.'),
],True)]],colWidths=[131*mm,131*mm])
cards.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),2*mm)]))
story += [cards,Spacer(1,3*mm)]

included=Table([[P('WHAT’S INCLUDED','h2rate'),P('HOW PROJECTS WORK','h2rate')],
    [P('•  Design files and exports for agreed formats<br/>•  Clear async communication and progress updates<br/>•  Figma prototype and developer handoff for UI/UX projects','bodyrate'),P('•  Scope and deliverables agreed before kickoff<br/>•  Project work billed by milestones<br/>•  Additional rounds or scope changes quoted separately','bodyrate')]],colWidths=[129*mm,129*mm])
included.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),WHITE),('BOX',(0,0),(-1,-1),0.6,LINE),('INNERGRID',(0,0),(-1,-1),0.4,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),5*mm),('RIGHTPADDING',(0,0),(-1,-1),5*mm),('TOPPADDING',(0,0),(-1,-1),4*mm),('BOTTOMPADDING',(0,0),(-1,-1),3*mm)]))
story += [included,Spacer(1,5*mm)]
note=Table([[P('<b>Healthcare and complex workflows</b><br/>For projects involving clinical workflows, medical data, AI-assisted review, or system integrations, I’ll first clarify the users, constraints, and deliverables, then provide a tailored quote.','bodyrate'),P('<b>Let’s discuss your project</b><br/>Share your goals, timeline, and expected deliverables to receive a scope-specific estimate.','bodyrate')]],colWidths=[155*mm,103*mm])
note.setStyle(TableStyle([('BACKGROUND',(0,0),(0,0),HexColor('#EAF7F4')),('BACKGROUND',(1,0),(1,0),PALE),('BOX',(0,0),(-1,-1),0.6,LINE),('INNERGRID',(0,0),(-1,-1),0.4,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),5*mm),('RIGHTPADDING',(0,0),(-1,-1),5*mm),('TOPPADDING',(0,0),(-1,-1),4*mm),('BOTTOMPADDING',(0,0),(-1,-1),3*mm)]))
story += [note,Spacer(1,3*mm),P('Rates are in USD. Third-party costs, taxes, and work outside the agreed scope are not included. Larger product flows, complete brand systems, and print production are quoted after discovery.','smallrate')]
doc.build(story,onFirstPage=footer)
print(OUT)
