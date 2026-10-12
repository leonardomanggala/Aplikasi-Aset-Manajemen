import os, math, sys
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase.pdfmetrics import stringWidth
sys.path.insert(0,os.path.dirname(__file__))
import build_aktivitas as style

OUT=os.path.abspath('output/pdf/latihan-menebalkan-garis-dan-angka-1-10.pdf')
W,H=A4
PALE=HexColor('#CFC3B7'); GUIDE=HexColor('#F1D7C7'); INK=style.INK

def line_path(c,points,width=4):
    p=c.beginPath(); p.moveTo(points[0][0],points[0][1])
    for x,y in points[1:]: p.lineTo(x,y)
    c.saveState(); c.setStrokeColor(GUIDE); c.setLineWidth(width); c.setLineCap(1); c.setDash(1,5); c.drawPath(p,stroke=1,fill=0); c.restoreState()
    c.setFillColor(style.CORAL); c.circle(points[0][0],points[0][1],4,fill=1,stroke=0)
    c.setFillColor(style.MINT); c.circle(points[-1][0],points[-1][1],4,fill=1,stroke=0)

def trace_glyph(c,text,x,y,size=96):
    c.saveState(); c.setStrokeColor(PALE); c.setLineWidth(2.2); c.setDash(1.5,3)
    t=c.beginText(); t.setFont('ComicBold',size); t.setTextRenderMode(1)
    t.setTextOrigin(x-stringWidth(text,'ComicBold',size)/2,y); t.textOut(text); c.drawText(t)
    c.restoreState()

def number_page(c,n,num):
    title=f'Tebalkan Angka {num}'
    style.header(c,n,title,f'Ikuti garis putus-putus dengan pensil. Ucapkan angkanya sambil menebalkan.')
    # Large, generously spaced numeral guides.
    positions=[W*.22,W*.50,W*.78]
    for x in positions:
        style.rr(c,x-62,392,124,142,18,white,HexColor('#F3D7C6'),1.4)
        trace_glyph(c,str(num),x,422,95 if len(str(num))==1 else 80)
        c.setStrokeColor(GUIDE); c.setDash(2,4); c.line(x-40,407,x+40,407); c.setDash()
    style.txt(c,'Sekarang coba tulis sendiri:',W/2,325,17,INK,'ComicBold','center')
    for x in positions:
        style.rr(c,x-62,205,124,94,18,white,HexColor('#F3D7C6'),1.4)
        c.setStrokeColor(GUIDE); c.setDash(2,4); c.line(x-43,235,x+43,235); c.setDash()

def shape_path(c,kind,x,y,size):
    s=size/2; pts=[]
    if kind=='lingkaran':
        c.saveState(); c.setStrokeColor(GUIDE); c.setLineWidth(4); c.setDash(1,5); c.circle(x,y,s,stroke=1,fill=0); c.restoreState(); return
    if kind=='persegi': pts=[(x-s,y-s),(x+s,y-s),(x+s,y+s),(x-s,y+s),(x-s,y-s)]
    elif kind=='segitiga': pts=[(x,y+s),(x+s,y-s),(x-s,y-s),(x,y+s)]
    line_path(c,pts,4)

def main():
    os.makedirs(os.path.dirname(OUT),exist_ok=True)
    c=canvas.Canvas(OUT,pagesize=A4); c.setTitle('Latihan Menebalkan Garis dan Angka 1-10')
    # 1: horizontal lines
    style.header(c,1,'Garis Mendatar','Mulai dari titik merah, lalu ikuti garis sampai titik hijau.')
    for y in [535,465,395,325,255]: line_path(c,[(92,y),(503,y)])
    c.showPage()
    # 2: vertical lines
    style.header(c,2,'Garis Tegak','Tarik garis dari atas ke bawah mengikuti titik-titik.')
    for x in [125,240,355,470]: line_path(c,[(x,535),(x,250)])
    c.showPage()
    # 3: diagonal lines
    style.header(c,3,'Garis Miring','Ikuti garis miring dari titik merah ke titik hijau.')
    line_path(c,[(95,510),(500,420)],5)
    line_path(c,[(95,280),(500,370)],5)
    c.showPage()
    # 4: zig-zag paths
    style.header(c,4,'Garis Zig-zag','Bantu si ulat berjalan mengikuti jalur zig-zag.')
    for y in [490,385,280]: line_path(c,[(85,y),(145,y+48),(205,y),(265,y+48),(325,y),(385,y+48),(445,y),(505,y+48)],4)
    c.showPage()
    # 5: wavy paths
    style.header(c,5,'Garis Berombak','Ikuti ombak yang berkelok dari kiri ke kanan.')
    for y in [470,370,270]:
        p=c.beginPath(); p.moveTo(82,y)
        for i in range(4):
            x=82+i*105; p.curveTo(x+26,y+55,x+26,y+55,x+52,y); p.curveTo(x+78,y-55,x+78,y-55,x+105,y)
        c.saveState(); c.setStrokeColor(GUIDE); c.setLineWidth(4); c.setLineCap(1); c.setDash(1,5); c.drawPath(p,stroke=1,fill=0); c.restoreState()
        c.setFillColor(style.CORAL); c.circle(82,y,4,fill=1,stroke=0); c.setFillColor(style.MINT); c.circle(502,y,4,fill=1,stroke=0)
    c.showPage()
    # 6: rounded curves
    style.header(c,6,'Garis Melengkung','Ikuti garis lengkung dengan gerakan tangan yang lembut.')
    for i,y in enumerate([470,365,260]):
        p=c.beginPath(); p.moveTo(85,y)
        p.curveTo(85,y+110,220,y+110,220,y); p.curveTo(220,y-90,360,y-90,360,y); p.curveTo(360,y+55,505,y+55,505,y)
        c.saveState(); c.setStrokeColor(GUIDE); c.setLineWidth(4); c.setLineCap(1); c.setDash(1,5); c.drawPath(p,stroke=1,fill=0); c.restoreState()
        c.setFillColor(style.CORAL); c.circle(85,y,4,fill=1,stroke=0); c.setFillColor(style.MINT); c.circle(505,y,4,fill=1,stroke=0)
    c.showPage()
    # 7: trace simple shapes
    style.header(c,7,'Tebalkan Bentuk','Ikuti titik-titik untuk menyelesaikan setiap bentuk.')
    for x,kind in [(125,'lingkaran'),(297,'persegi'),(470,'segitiga')]: shape_path(c,kind,x,420,112)
    for x,kind in [(125,'segitiga'),(297,'lingkaran'),(470,'persegi')]: shape_path(c,kind,x,245,72)
    c.showPage()
    # Pages 8-17: one numeral per page.
    for n,num in enumerate(range(1,11),start=8): number_page(c,n,num); c.showPage()
    # 18: trace 1-5 in large cards
    style.header(c,18,'Tebalkan Angka 1–5','Ikuti bentuk setiap angka. Lalu sebutkan angkanya dengan lantang.')
    for i,num in enumerate(range(1,6)):
        x=74+i*112; style.rr(c,x-43,390,86,130,16,white,HexColor('#F3D7C6'),1.3); trace_glyph(c,str(num),x,420,76)
        style.rr(c,x-43,220,86,95,15,white,HexColor('#F3D7C6'),1.2); c.setStrokeColor(GUIDE); c.setDash(2,4); c.line(x-30,250,x+30,250); c.setDash()
    c.showPage()
    # 19: trace 6-10 in large cards
    style.header(c,19,'Tebalkan Angka 6–10','Ikuti bentuk setiap angka. Lalu coba tulis sekali lagi.')
    for i,num in enumerate(range(6,11)):
        x=74+i*112; style.rr(c,x-43,390,86,130,16,white,HexColor('#F3D7C6'),1.3); trace_glyph(c,str(num),x,420,69 if num==10 else 76)
        style.rr(c,x-43,220,86,95,15,white,HexColor('#F3D7C6'),1.2); c.setStrokeColor(GUIDE); c.setDash(2,4); c.line(x-30,250,x+30,250); c.setDash()
    c.showPage()
    # 20: number review, two large rows
    style.header(c,20,'Ayo Menebalkan Angka!','Tebalkan angka 1 sampai 10, lalu pilih angka yang paling kamu suka.')
    for i,num in enumerate(range(1,11)):
        row=i//5; col=i%5; x=84+col*107; y=460-row*160
        style.rr(c,x-39,y-48,78,104,15,white,HexColor('#F3D7C6'),1.2); trace_glyph(c,str(num),x,y-11,64 if num==10 else 72)
    style.txt(c,'Angka favoritku:',W/2,210,17,INK,'ComicBold','center'); c.setStrokeColor(GUIDE); c.setDash(2,4); c.line(195,183,W-195,183); c.setDash()
    c.save(); print(OUT)

if __name__=='__main__': main()
