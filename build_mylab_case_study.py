from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.colors import HexColor
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus.flowables import Flowable
from reportlab.pdfbase.pdfmetrics import stringWidth
from pathlib import Path

OUT = Path(r"C:\Users\G512LI\OneDrive\Documents\ChatGPT\Aplikasi Aset Manajemen\output\pdf\MyLab_Case_Study_Refined.pdf")
OUT.parent.mkdir(parents=True, exist_ok=True)

NAVY = HexColor('#101B3F')
BLUE = HexColor('#3157E8')
TEAL = HexColor('#2CAD96')
INK = HexColor('#19233A')
MUTED = HexColor('#657089')
PALE = HexColor('#F3F6FC')
LINE = HexColor('#DFE5F0')
WHITE = colors.white

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Kicker', fontName='Helvetica-Bold', fontSize=8, leading=11, textColor=BLUE, spaceAfter=5, uppercase=True))
styles.add(ParagraphStyle(name='CoverTitle', fontName='Helvetica-Bold', fontSize=31, leading=35, textColor=NAVY, spaceAfter=10))
styles.add(ParagraphStyle(name='Deck', fontName='Helvetica', fontSize=12, leading=18, textColor=MUTED, spaceAfter=12))
styles.add(ParagraphStyle(name='H1x', fontName='Helvetica-Bold', fontSize=21, leading=25, textColor=NAVY, spaceBefore=2, spaceAfter=9, keepWithNext=True))
styles.add(ParagraphStyle(name='H2x', fontName='Helvetica-Bold', fontSize=12, leading=15, textColor=NAVY, spaceBefore=8, spaceAfter=5, keepWithNext=True))
styles.add(ParagraphStyle(name='Bodyx', fontName='Helvetica', fontSize=9.2, leading=14, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle(name='Smallx', fontName='Helvetica', fontSize=8, leading=11, textColor=MUTED, spaceAfter=4))
styles.add(ParagraphStyle(name='CardTitle', fontName='Helvetica-Bold', fontSize=10, leading=13, textColor=NAVY, spaceAfter=4))
styles.add(ParagraphStyle(name='Quote', fontName='Helvetica-Oblique', fontSize=12, leading=17, textColor=NAVY, leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=5))

def P(text, style='Bodyx'):
    return Paragraph(text, styles[style])

def card(title, body, width=83*mm, fill=PALE):
    t=Table([[P(title,'CardTitle')],[P(body,'Bodyx')]], colWidths=[width])
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),fill),('BOX',(0,0),(-1,-1),0.5,LINE),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,0),9),('BOTTOMPADDING',(0,-1),(-1,-1),5),('VALIGN',(0,0),(-1,-1),'TOP')]))
    return t

class MockScreen(Flowable):
    def __init__(self, width=174*mm, height=86*mm, variant='files'):
        super().__init__(); self.width=width; self.height=height; self.variant=variant
    def draw(self):
        c=self.canv; w=self.width; h=self.height
        c.setFillColor(WHITE); c.setStrokeColor(LINE); c.roundRect(0,0,w,h,5,fill=1,stroke=1)
        side=15*mm
        c.setFillColor(BLUE); c.roundRect(0,0,side,h,5,fill=1,stroke=0); c.rect(side-5,0,5,h,fill=1,stroke=0)
        c.setFillColor(WHITE); c.setFont('Helvetica-Bold',8); c.drawString(4*mm,h-8*mm,'M')
        for i in range(7):
            c.setFillColor(HexColor('#92A9FF') if i else WHITE); c.circle(side/2,h-(18+i*8)*mm,1.3*mm,fill=1,stroke=0)
        c.setFillColor(INK); c.setFont('Helvetica-Bold',10); c.drawString(side+7*mm,h-10*mm,'All files' if self.variant=='files' else 'Workspace overview')
        c.setFillColor(MUTED); c.setFont('Helvetica',6.5); c.drawString(side+7*mm,h-15*mm,'Search, organize, and review research files')
        c.setFillColor(BLUE); c.roundRect(w-38*mm,h-14*mm,20*mm,7*mm,2,fill=1,stroke=0)
        c.setFillColor(WHITE); c.setFont('Helvetica-Bold',6); c.drawCentredString(w-28*mm,h-11.4*mm,'↑  Upload')
        if self.variant=='files':
            c.setFillColor(PALE); c.roundRect(side+6*mm,h-31*mm,w-2*side-12*mm,9*mm,2,fill=1,stroke=0)
            c.setFillColor(MUTED); c.setFont('Helvetica',6); c.drawString(side+9*mm,h-26*mm,'Search by file or folder name')
            c.setStrokeColor(LINE); c.line(side+6*mm,h-37*mm,w-6*mm,h-37*mm)
            labels=['Name','Modified','Type','Owner']
            xs=[side+8*mm, w-66*mm,w-43*mm,w-23*mm]
            for x,label in zip(xs,labels):
                c.setFillColor(MUTED); c.setFont('Helvetica-Bold',6); c.drawString(x,h-43*mm,label)
            for i in range(4):
                y=h-(52+i*9)*mm
                c.setFillColor(HexColor('#FFD166')); c.roundRect(side+8*mm,y-1*mm,5*mm,4*mm,1,fill=1,stroke=0)
                c.setFillColor(INK); c.setFont('Helvetica',6.5); c.drawString(side+16*mm,y,'Research folder / Case files' if i==0 else ['Blood panel','Pathology image','Lab report'][i-1])
                c.setFillColor(MUTED); c.drawString(w-66*mm,y,'Today' if i==0 else 'Yesterday'); c.drawString(w-43*mm,y,'Folder' if i==0 else 'File'); c.drawString(w-23*mm,y,'Clinical team')
                c.setStrokeColor(LINE); c.line(side+7*mm,y-3*mm,w-6*mm,y-3*mm)
        else:
            gap=4*mm; cw=(w-2*side-6*gap-14*mm)/3
            for i,(lab,val,col) in enumerate([('Projects','239',BLUE),('Folders','890',HexColor('#EF4771')),('Collaborators','981',TEAL)]):
                x=side+7*mm+i*(cw+gap); y=h-39*mm
                c.setFillColor(col); c.roundRect(x,y,cw,20*mm,3,fill=1,stroke=0)
                c.setFillColor(WHITE); c.setFont('Helvetica',6); c.drawString(x+3*mm,y+14*mm,lab)
                c.setFont('Helvetica-Bold',15); c.drawString(x+3*mm,y+5*mm,val)
            c.setFillColor(PALE); c.roundRect(side+7*mm,8*mm,w-2*side-14*mm,14*mm,3,fill=1,stroke=0)
            c.setFillColor(INK); c.setFont('Helvetica-Bold',7); c.drawString(side+11*mm,17*mm,'Recent activity')
            c.setFillColor(MUTED); c.setFont('Helvetica',6); c.drawString(side+11*mm,12*mm,'Review recent files, updates, and shared work in one place')

def footer(canvas, doc):
    canvas.saveState(); w,h=A4
    if doc.page>1:
        canvas.setStrokeColor(LINE); canvas.line(19*mm,15*mm,w-19*mm,15*mm)
        canvas.setFont('Helvetica',7); canvas.setFillColor(MUTED)
        canvas.drawString(19*mm,10*mm,'MYLAB  /  PRODUCT DESIGN CASE STUDY')
        canvas.drawRightString(w-19*mm,10*mm,f'{doc.page:02d}')
    canvas.restoreState()

doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=19*mm,leftMargin=19*mm,topMargin=17*mm,bottomMargin=21*mm,title='MyLab | Healthcare SaaS UX Case Study',author='Leonardo Manggala Wardhana')
story=[]

# Cover
story += [Spacer(1,13*mm),P('PRODUCT DESIGN  /  HEALTHCARE SAAS','Kicker'),P('Making complex lab work feel clear.','CoverTitle'),P('A UX case study for a centralized workspace to manage, find, and review medical research files.','Deck')]
story += [Spacer(1,7*mm),MockScreen(height=83*mm,variant='files'),Spacer(1,9*mm)]
meta=Table([[P('<b>ROLE</b><br/>UI/UX Designer','Smallx'),P('<b>PROJECT</b><br/>MyLab Platform','Smallx'),P('<b>TIMELINE</b><br/>31 Aug – 16 Oct 2023 · 6 weeks','Smallx')]],colWidths=[47*mm,54*mm,66*mm])
meta.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('BOX',(0,0),(-1,-1),0.5,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),8)])); story += [meta,Spacer(1,7*mm),P('The challenge','H2x'),P('Clinical and research teams work with large collections of files, images, and reports. When these materials are spread across folders and tools, finding the right item and coordinating work becomes harder. MyLab explores a calmer, more structured way to bring those tasks into one workspace.'),P('Project framing','Smallx'),P('This is a concept case study. The original project documents a six-week design process and interface explorations; it does not report a shipped product or measured outcome.','Smallx'),PageBreak()]

# 1 Overview
story += [P('01  /  THE OPPORTUNITY','Kicker'),P('One workspace for the work around the data.','H1x'),P('MyLab is a proposed healthcare SaaS platform for organizing laboratory and research files, supporting review and analysis, and helping multidisciplinary teams coordinate their work.'),P('The design challenge','H2x'),P('How might we help clinical and research teams locate, organize, and review complex files with less friction—while keeping the interface approachable for people with different levels of technical confidence?'),P('Product principles','H2x')]
story += [Table([[card('Make information findable','Clear hierarchy, useful search, and predictable file organization.',82*mm),card('Make actions understandable','Keep common tasks visible and use familiar patterns for upload, folders, and review.',82*mm)],[card('Support shared work','Bring files and collaboration cues into a common workspace.',82*mm),card('Respect clinical context','Present dense information in a calm, legible interface that supports careful review.',82*mm)]],colWidths=[87*mm,87*mm],style=TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),4),('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3)])),Spacer(1,5*mm),P('My contribution','H2x'),P('I shaped the product direction through a design-thinking process, documented user needs and a primary persona, mapped a core file-management flow, and developed wireframe and high-fidelity interface explorations. The source project lists Google Forms and design testing among its tools, but does not provide detailed usability-test findings.'),P('Scope at a glance','H2x')]
scope=Table([[P('<b>Core workspace</b><br/>Centralized file and folder browsing','Smallx'),P('<b>Find and organize</b><br/>Search, filter, and switch views','Smallx'),P('<b>Review and collaborate</b><br/>Preview, annotate, and share work','Smallx')]],colWidths=[58*mm]*3)
scope.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('BOX',(0,0),(-1,-1),0.5,LINE),('INNERGRID',(0,0),(-1,-1),0.5,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),6)])); story += [scope,PageBreak()]

# 2 problem/research
story += [P('02  /  UNDERSTAND','Kicker'),P('Reduce the friction around scattered files.','H1x'),P('The original brief describes a recurring operational pattern: growing volumes of complex data, files stored in different places, time-consuming reporting, limited analysis support, and coordination that happens outside a shared system.'),P('Design opportunity','H2x')]
story += [Table([[card('Scattered materials','Files across local folders, drives, and messages are harder to locate and keep organized.',82*mm),card('Manual, repetitive work','Manual processes can slow reporting and create opportunities for duplicate or inconsistent data.',82*mm)],[card('Limited shared context','Without a central workspace, teams may have difficulty staying aligned around the same files and updates.',82*mm),card('High cognitive load','A complex interface can add to the workload for users who need to focus on clinical or research tasks.',82*mm)]],colWidths=[87*mm,87*mm],style=TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),4),('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3)])),P('Research snapshot','H2x'),P('The case study records an online questionnaire with approximately three participants and names pathologists, specialists, residents, and laboratory teams as relevant users. This is an exploratory, small-sample input—not statistically representative research. The original survey description contains an unrelated email-verification reference, so this rewrite does not treat those questions or outcomes as validated evidence.'),P('What the available material supports','H2x')]
findings=Table([[P('<b>Supported by the brief</b><br/>Users need a more structured way to manage and retrieve files; team coordination and reporting are important parts of the workflow.','Bodyx')],[P('<b>Design hypotheses to validate</b><br/>Search and filters may reduce retrieval effort; shared context may reduce coordination friction; a simplified interface may lower onboarding effort. These are hypotheses, not measured outcomes.','Bodyx')]],colWidths=[174*mm])
findings.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),HexColor('#EEF2FF')),('BACKGROUND',(0,1),(-1,1),PALE),('BOX',(0,0),(-1,-1),0.5,LINE),('INNERGRID',(0,0),(-1,-1),0.5,LINE),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),3)])); story += [findings,Spacer(1,3*mm),P('Primary user','H2x'),P('<b>Dr. Selviyanti Padma, Sp.KK, FINSDV</b> is represented in the original work as a 35-year-old dermatologist and venereologist. The persona’s goals are to manage complex patient-related files efficiently, find documents reliably, and coordinate with colleagues from one place.'),P('Needs translated into design','H2x'),P('• Locate the right case file without navigating a maze of folders.<br/>• Keep related images and documents organized and accessible.<br/>• Review material in context and understand what has changed.<br/>• Coordinate with colleagues around shared work.'),PageBreak()]

# 3 flow and IA
story += [P('03  /  DEFINE THE FLOW','Kicker'),P('Make the next step easy to see.','H1x'),P('The source flow connects sign-in, the dashboard, file upload and browsing, image review, analysis, and saving or commenting on results. I reframed it as a clear, staged path so that file management remains the foundation and advanced capabilities stay understandable.'),Spacer(1,4*mm)]
flow=[('01','Enter workspace','Sign in and land on a clear overview.'),('02','Find or add files','Search, filter, browse folders, or upload.'),('03','Open and review','Preview the selected image or document.'),('04','Analyze or annotate','Use available review tools with clear status and controls.'),('05','Save and share','Keep the result with its source and share it with the team.')]
rows=[]
for n,title,desc in flow:
    rows.append([P(f'<font color="#3157E8"><b>{n}</b></font>','Bodyx'),P(f'<b>{title}</b><br/>{desc}','Bodyx')])
ft=Table(rows,colWidths=[18*mm,156*mm]); ft.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('BOX',(0,0),(-1,-1),0.5,LINE),('INNERGRID',(0,0),(-1,-1),0.5,LINE),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),1)])); story += [ft,Spacer(1,5*mm),P('Information architecture cues','H2x'),P('The interface uses persistent navigation for major destinations, a visible page title and breadcrumb for orientation, search and filters close to the file list, and an explicit distinction between folder and file actions. Grid and list views accommodate different scanning preferences.'),P('Key UX decisions','H2x')]
story += [Table([[card('Search where work happens','Place search and filtering directly above results, with clear empty and no-result states.',82*mm),card('Keep primary actions visible','Give upload and folder creation a consistent location and clear visual priority.',82*mm)],[card('Preserve context','Use breadcrumbs, meaningful names, and metadata to help users understand where a file belongs.',82*mm),card('Make review feel connected','Keep image preview and review actions tied to the selected file and its workspace.',82*mm)]],colWidths=[87*mm,87*mm],style=TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),4),('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3)])),P('Important product boundary','H2x'),P('Automated analysis, diagnostic-device integrations, and report generation appear as intended capabilities in the original brief. The available material does not document implementation details or clinical validation. In a production product, these features would need explicit provenance, confidence and status communication, permission controls, and human review appropriate to the intended use.'),PageBreak()]

# 4 design
story += [P('04  /  DESIGN THE EXPERIENCE','Kicker'),P('A calm workspace for dense information.','H1x'),P('The visual direction uses a blue navigation rail, light surfaces, compact data tables, folder cards, and a restrained typography scale. The aim is to make a high-density desktop workspace feel familiar and navigable.'),MockScreen(height=84*mm,variant='files'),Spacer(1,2*mm),P('Interface concept — file browsing view reconstructed from the supplied case-study visuals.','Smallx'),P('From wireframe to interface','H2x'),P('The mid-fidelity explorations establish the information hierarchy and page structure. The high-fidelity screens develop that structure into file browsing, grid and list patterns, an overview dashboard, and an image-review surface. The strongest through-line is the persistent workspace navigation paired with a clear content area.'),P('Visual system','H2x')]
tokens=Table([[P('<b>Color</b><br/>Blue-led navigation and actions; neutral surfaces; accent colors reserved for status or data.', 'Smallx'),P('<b>Type</b><br/>A clear heading-to-body hierarchy designed for dense desktop content.', 'Smallx'),P('<b>Layout</b><br/>12-column desktop grid; 1,440 px reference width; 50 px outer margin; 24 px gutter.', 'Smallx')]],colWidths=[58*mm]*3)
tokens.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('BOX',(0,0),(-1,-1),0.5,LINE),('INNERGRID',(0,0),(-1,-1),0.5,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),5)])); story += [tokens,P('The source style guide names Anter and defines heading and body sizes, but some values are inconsistently ordered in the original page. The case study therefore describes the hierarchy without asserting a precise font mapping beyond what can be read confidently.'),P('Design details that build trust','H2x'),P('• Keep labels and metadata legible at realistic content density.<br/>• Use consistent file naming, type, owner, and modified-date cues.<br/>• Provide visible feedback for upload, saving, and sharing.<br/>• Distinguish destructive actions from routine file actions.<br/>• Design loading, error, empty, and permission states alongside the happy path.'),PageBreak()]

# 5 outcomes
story += [P('05  /  OUTCOME & REFLECTION','Kicker'),P('A clearer product direction, ready for validation.','H1x'),P('The outcome is a set of interface explorations and a product direction for a centralized file-management workspace. The designs show how a shared navigation model, searchable file views, an overview dashboard, and a review surface can fit into one coherent SaaS experience.'),MockScreen(height=78*mm,variant='overview'),Spacer(1,2*mm),P('Concept dashboard — illustrative reconstruction based on supplied high-fidelity screens. Figures shown in the original dashboard are sample interface content, not verified product metrics.','Smallx'),P('What this work demonstrates','H2x')]
story += [Table([[card('Systems thinking','Connects file organization, discovery, review, and collaboration as one product workflow.',82*mm),card('Healthcare context','Frames design choices around clinical and research teams handling sensitive, complex material.',82*mm)],[card('Interface craft','Applies hierarchy, navigation, search, and view patterns to a dense desktop SaaS workspace.',82*mm),card('Product judgment','Separates the intended AI and integration vision from capabilities demonstrated by the design.',82*mm)]],colWidths=[87*mm,87*mm],style=TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),4),('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3)])),P('What I would test next','H2x'),P('Before building more features, I would check these five things with doctors and lab staff:<br/>1. Can they quickly find a patient case, image, or report?<br/>2. Can they organize and share files the way their team works?<br/>3. Are image preview and annotation easy to understand?<br/>4. Do access permissions and activity history meet their needs?<br/>5. Do AI analysis and device integrations fit their workflow, with a clinician reviewing the results?'),P('Why test this first?','H2x'),P('The current screens show a design concept, but do not prove that it saves time or fits real clinical work. The survey included about three people, so it is useful for early questions, not broad conclusions. Interviews and usability sessions with clinical, security, and engineering stakeholders would help guide the next version.'),Spacer(1,2*mm),Table([[P('Leonardo Manggala Wardhana','CardTitle'),P('UI/UX Designer - Healthcare SaaS and data-heavy workflows','Smallx')]],colWidths=[65*mm,109*mm],style=TableStyle([('BACKGROUND',(0,0),(-1,-1),HexColor('#EEF2FF')),('BOX',(0,0),(-1,-1),0.5,LINE),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),4)]))]

doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(OUT)
