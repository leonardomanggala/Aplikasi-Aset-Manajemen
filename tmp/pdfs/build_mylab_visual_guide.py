from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color, white
from reportlab.pdfbase.pdfmetrics import stringWidth
from pathlib import Path

OUT = Path('output/pdf/MyLab_Panduan_Visual.pdf')
W, H = landscape(A4)
c = canvas.Canvas(str(OUT), pagesize=(W,H), pageCompression=1)
c.setTitle('MyLab - Panduan Visual')
c.setAuthor('Leonardo Manggala Wardhana')

navy = HexColor('#172B4D')
muted = HexColor('#63728A')
indigo = HexColor('#4F46E5')
teal = HexColor('#2CAD96')
soft = HexColor('#F4F6FB')
line = HexColor('#DFE5EF')
coral = HexColor('#FF979D')
orange = HexColor('#FF6B00')
burgundy = HexColor('#AE2D5D')

# clean paper background
c.setFillColor(HexColor('#FBFCFE')); c.rect(0,0,W,H,fill=1,stroke=0)
margin=38
# top identity strip
c.setFillColor(indigo); c.roundRect(margin,H-56,30,22,6,fill=1,stroke=0)
c.setFillColor(white); c.setFont('Helvetica-Bold',10); c.drawCentredString(margin+15,H-49,'M')
c.setFillColor(navy); c.setFont('Helvetica-Bold',10); c.drawString(margin+40,H-42,'MYLAB  /  DESIGN SYSTEM')
c.setFillColor(muted); c.setFont('Helvetica',8); c.drawRightString(W-margin,H-42,'HEALTHCARE PLATFORM  •  VISUAL GUIDE')
c.setStrokeColor(line); c.setLineWidth(.7); c.line(margin,H-66,W-margin,H-66)

# title
c.setFillColor(navy); c.setFont('Helvetica-Bold',25); c.drawString(margin,H-105,'A clear, trusted visual system that is easy to use')
c.setFillColor(muted); c.setFont('Helvetica',10.5)
c.drawString(margin,H-125,'Color and layout foundations for MyLab clinical workflows.')

# cards
card_y=117; card_h=H-263
left_x=margin; left_w=335
right_x=left_x+left_w+17; right_w=W-margin-right_x
for x,w in [(left_x,left_w),(right_x,right_w)]:
    c.setFillColor(white); c.setStrokeColor(line); c.setLineWidth(.7); c.roundRect(x,card_y,w,card_h,10,fill=1,stroke=1)

# left card: colors
x=left_x+18; top=H-164
c.setFillColor(navy); c.setFont('Helvetica-Bold',12); c.drawString(x,top,'Color palette')
c.setFillColor(muted); c.setFont('Helvetica',8.5); c.drawString(x,top-15,'Primary colors create a calm, modern identity.')

def swatch(x,y,color,label,hexv):
    c.setFillColor(color); c.roundRect(x,y-34,137,39,6,fill=1,stroke=0)
    ink = white if hexv in ('#4F46E5','#FF6B00','#AE2D5D') else navy
    c.setFillColor(ink); c.setFont('Helvetica-Bold',8.5); c.drawString(x+9,y-11,label)
    c.setFillColor(ink); c.setFont('Helvetica',7.5); c.drawString(x+9,y-25,hexv)

swatch(x,top-39,indigo,'Primary indigo','#4F46E5')
swatch(x+151,top-39,teal,'Primary teal','#2CAD96')
c.setFillColor(navy); c.setFont('Helvetica-Bold',9); c.drawString(x,top-99,'Accent colors')
swatch(x,top-108,coral,'Coral','#FF979D')
swatch(x+151,top-108,orange,'Orange','#FF6B00')
swatch(x,top-158,burgundy,'Burgundy','#AE2D5D')
c.setFillColor(navy); c.setFont('Helvetica-Bold',9); c.drawString(x,top-210,'Supporting colors')
# supporting chips
support=[('#3E3E3E','Dark gray'),('#1E1E1E','Near black'),('#6B7280','Mid gray'),('#000000','Black'),('#2966DC','Additional blue')]
chip_y=top-225
for i,(hx,label) in enumerate(support):
    col=i%2; row=i//2; xx=x+col*151; yy=chip_y-row*25
    c.setFillColor(HexColor(hx)); c.roundRect(xx,yy-12,13,13,3,fill=1,stroke=0)
    c.setFillColor(navy); c.setFont('Helvetica',7.4); c.drawString(xx+19,yy-5,label)
    c.setFillColor(muted); c.drawRightString(xx+136,yy-5,hx)

# right card: grid specifications
rx=right_x+18; rtop=H-164
c.setFillColor(navy); c.setFont('Helvetica-Bold',12); c.drawString(rx,rtop,'Desktop grid')
c.setFillColor(muted); c.setFont('Helvetica',8.5); c.drawString(rx,rtop-15,'1440 px canvas • 12 columns • 24 px gutters • 50 px margins')
# diagram dimensions based on canvas aspect ratio
bx=rx+15; by=rtop-169; bw=right_w-52; bh=bw*0.35
c.setFillColor(HexColor('#FAFBFE')); c.setStrokeColor(line); c.roundRect(bx,by,bw,bh,4,fill=1,stroke=1)
# margin zones
m=bw*50/1440; gutter=bw*24/1440; col=(bw-2*m-11*gutter)/12
c.setFillColor(HexColor('#E7E9FF'))
for i in range(12):
    xx=bx+m+i*(col+gutter)
    c.roundRect(xx,by+12,col,bh-24,2,fill=1,stroke=0)
# dashed outer inset and labels
c.setStrokeColor(indigo); c.setDash(3,2); c.rect(bx+m,by+8,bw-2*m,bh-16,fill=0,stroke=1); c.setDash()
c.setFillColor(muted); c.setFont('Helvetica',7); c.drawCentredString(bx+bw/2,by-13,'12-column grid with consistent gutters')
# spec row
sy=by-30
specs=[('1440 px','Canvas width'),('12','Columns'),('24 px','Gutter'),('50 px','Margin')]
boxw=(right_w-36)/4
for i,(val,lab) in enumerate(specs):
    xx=rx+i*boxw
    c.setFillColor(soft); c.roundRect(xx,sy-32,boxw-7,40,5,fill=1,stroke=0)
    c.setFillColor(navy); c.setFont('Helvetica-Bold',10); c.drawString(xx+8,sy-8,val)
    c.setFillColor(muted); c.setFont('Helvetica',7); c.drawString(xx+8,sy-22,lab)
# note on typography
ny=card_y+15
c.setFillColor(HexColor('#FFF8ED')); c.roundRect(rx,ny,right_w-36,46,6,fill=1,stroke=0)
c.setFillColor(HexColor('#9B5B00')); c.setFont('Helvetica-Bold',8); c.drawString(rx+10,ny+29,'Specification note')
c.setFillColor(HexColor('#765D38')); c.setFont('Helvetica',7.4)
c.drawString(rx+10,ny+16,'Font family, weight, and spacing details were unclear in the source document.')
c.drawString(rx+10,ny+5,'Verify them in the design file before treating them as final specifications.')

# Footer
c.setStrokeColor(line); c.line(margin,66,W-margin,66)
c.setFillColor(muted); c.setFont('Helvetica',7.5); c.drawString(margin,49,'MyLab  •  Healthcare file management and analysis platform concept')
c.drawRightString(W-margin,49,'LEONARDO MANGGALA WARDHANA  /  01')
c.save()
print(OUT.resolve())




