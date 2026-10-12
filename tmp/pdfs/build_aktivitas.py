from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os, math

OUT = os.path.abspath('output/pdf/aktivitas-seru-mengenal-angka-1-10.pdf')
W,H=A4
INK=HexColor('#493D38'); MUTED=HexColor('#756B65'); CORAL=HexColor('#F27D72'); YELLOW=HexColor('#F7C95C'); MINT=HexColor('#8CCDB6'); BLUE=HexColor('#83B9D8'); LILAC=HexColor('#B8A2D3'); PALE=HexColor('#FFF9EF'); LINE=HexColor('#E8DED1')
pdfmetrics.registerFont(TTFont('Comic',r'C:\Windows\Fonts\comic.ttf'))
pdfmetrics.registerFont(TTFont('ComicBold',r'C:\Windows\Fonts\comicbd.ttf'))

def rr(c,x,y,w,h,r=12,fill=white,stroke=LINE,sw=1):
    c.setLineWidth(sw); c.setFillColor(fill); c.setStrokeColor(stroke); c.roundRect(x,y,w,h,r,fill=1,stroke=1)
def txt(c,s,x,y,size=12,color=INK,font='Comic',align='left'):
    c.setFillColor(color); c.setFont(font,size)
    if align=='center': c.drawCentredString(x,y,s)
    elif align=='right': c.drawRightString(x,y,s)
    else: c.drawString(x,y,s)
def wrap(c,s,x,y,maxw,size=11,leading=15,color=INK,font='Comic',align='left'):
    words=s.split(); lines=[]; cur=''
    for word in words:
        test=(cur+' '+word).strip()
        if stringWidth(test,font,size)>maxw and cur: lines.append(cur); cur=word
        else: cur=test
    if cur: lines.append(cur)
    for line in lines:
        txt(c,line,x,y,size,color,font,align); y-=leading
    return y
def apple(c,x,y,s=22,color=CORAL):
    c.setFillColor(CORAL); c.setStrokeColor(HexColor('#9D3B35')); c.setLineWidth(max(1.1,s*.025))
    p=c.beginPath(); p.moveTo(x,y-s*.43)
    p.curveTo(x-s*.50,y-s*.55,x-s*.60,y-s*.05,x-s*.43,y+s*.25)
    p.curveTo(x-s*.29,y+s*.52,x-s*.08,y+s*.42,x,y+s*.34)
    p.curveTo(x+s*.08,y+s*.42,x+s*.29,y+s*.52,x+s*.43,y+s*.25)
    p.curveTo(x+s*.60,y-s*.05,x+s*.50,y-s*.55,x,y-s*.43); p.close()
    c.drawPath(p,fill=1,stroke=1)
    c.setStrokeColor(HexColor('#6D452A')); c.setLineWidth(max(2,s*.045)); c.line(x,y+s*.33,x+s*.035,y+s*.57)
    c.setFillColor(HexColor('#79B84F')); c.setStrokeColor(HexColor('#4A8137')); c.setLineWidth(max(.8,s*.012))
    c.ellipse(x+s*.015,y+s*.38,x+s*.39,y+s*.58,fill=1,stroke=1)
    c.setStrokeColor(HexColor('#4A8137')); c.setLineWidth(max(.7,s*.012)); c.line(x+s*.05,y+s*.42,x+s*.33,y+s*.54)
    c.setFillColor(HexColor('#FFB4A4')); c.ellipse(x-s*.34,y+s*.08,x-s*.22,y+s*.24,fill=1,stroke=0)
def star(c,x,y,r=12,color=YELLOW):
    pts=[]
    for i in range(10):
        a=math.pi/2+i*math.pi/5; rad=r if i%2==0 else r*.45; pts.append((x+rad*math.cos(a),y+rad*math.sin(a)))
    p=c.beginPath(); p.moveTo(*pts[0]);
    for q in pts[1:]: p.lineTo(*q)
    p.close(); c.setFillColor(color); c.setStrokeColor(HexColor('#E5B84F')); c.drawPath(p,fill=1,stroke=1)
def balloon(c,x,y,s=18,color=CORAL):
    c.setFillColor(color); c.setStrokeColor(color); c.ellipse(x-s*.62,y-s*.72,x+s*.62,y+s*.72,fill=1,stroke=0)
    p=c.beginPath(); p.moveTo(x-3,y-s*.69); p.lineTo(x+3,y-s*.69); p.lineTo(x,y-s*.86); p.close(); c.drawPath(p,fill=1,stroke=0)
    c.setStrokeColor(MUTED); c.setLineWidth(.8); c.line(x,y-s*.86,x+2,y-s*1.55)
def fish(c,x,y,s=24,color=BLUE):
    c.setFillColor(color); c.setStrokeColor(HexColor('#6199B7')); c.ellipse(x-s*.55,y-s*.32,x+s*.42,y+s*.32,fill=1,stroke=1)
    p=c.beginPath(); p.moveTo(x+s*.35,y); p.lineTo(x+s*.82,y+s*.35); p.lineTo(x+s*.82,y-s*.35); p.close(); c.drawPath(p,fill=1,stroke=1)
    c.setFillColor(INK); c.circle(x-s*.25,y+s*.06,1.4,fill=1,stroke=0)
def shape(c,kind,x,y,s=20,color=MINT):
    c.setFillColor(color); c.setStrokeColor(color)
    if kind=='lingkaran': c.circle(x,y,s*.5,fill=1,stroke=0)
    elif kind=='persegi': c.rect(x-s*.45,y-s*.45,s*.9,s*.9,fill=1,stroke=0)
    elif kind=='segitiga':
        p=c.beginPath(); p.moveTo(x,y+s*.55); p.lineTo(x+s*.55,y-s*.45); p.lineTo(x-s*.55,y-s*.45); p.close(); c.drawPath(p,fill=1,stroke=0)
    else: star(c,x,y,s*.55,color)
def object_icon(c,kind,x,y,s=20,color=CORAL):
    if kind=='apel': apple(c,x,y,s,CORAL)
    elif kind=='bintang': star(c,x,y,s*.55,color)
    elif kind=='ikan': fish(c,x,y,s,color)
    elif kind=='balon': balloon(c,x,y,s*.65,color)
    elif kind=='lingkaran': shape(c,'lingkaran',x,y,s,color)
    elif kind=='persegi': shape(c,'persegi',x,y,s,color)
    else: shape(c,'segitiga',x,y,s,color)
def choice(c,vals,cx,cy,correct=None,r=22,gap=76):
    start=cx-(len(vals)-1)*gap/2
    rings=[CORAL,YELLOW,MINT,BLUE,LILAC]
    for i,v in enumerate(vals):
        x=start+i*gap; c.setStrokeColor(rings[i%len(rings)]); c.setLineWidth(3.2); c.setFillColor(white); c.circle(x,cy,r,fill=1,stroke=1); txt(c,str(v),x,cy-16,42,INK,'ComicBold','center')
def header(c,n,title,instruction):
    c.setFillColor(white); c.rect(0,0,W,H,fill=1,stroke=0)
    # Soft, playful corner accents inspired by the supplied worksheet.
    c.setFillColor(HexColor('#FFE4D5')); c.circle(29,H-30,23,fill=1,stroke=0)
    c.setFillColor(HexColor('#FFE59A')); c.circle(W+7,H+3,47,fill=1,stroke=0)
    c.setFillColor(HexColor('#DDECCB')); c.circle(W-1,9,31,fill=1,stroke=0)
    txt(c,'Nama:',39,H-59,17,INK,'ComicBold'); c.setStrokeColor(INK); c.setLineWidth(1.4); c.line(91,H-62,370,H-62)
    # Large peach title cloud with a rounded silhouette.
    c.setFillColor(HexColor('#FFE5D6'))
    c.roundRect(37,H-169,W-74,76,34,fill=1,stroke=0)
    # Gentle scallops along top and bottom make the banner feel soft.
    for i in range(8):
        x=52+i*70
        c.circle(x,H-100,13,fill=1,stroke=0); c.circle(x,H-162,13,fill=1,stroke=0)
    size=36
    while stringWidth(title,'ComicBold',size)>W-100 and size>19: size-=1
    txt(c,title,W/2,H-143,size,INK,'ComicBold','center')
    wrap(c,instruction,W/2,H-192,W-100,16,20,INK,'ComicBold','center')
    # Footer encouragement band and subtle page number.
    c.setFillColor(HexColor('#E5F0D8')); c.roundRect(95,48,W-190,31,15,fill=1,stroke=0)
    txt(c,'Hebat! Kamu sedang belajar berhitung.',W/2,59,10,INK,'ComicBold','center')
    txt(c,str(n),W-34,27,9,MUTED,'Comic','right')
def section(c,x,y,w,h,label):
    rr(c,x,y,w,h,15,white,LINE,1); txt(c,label,x+16,y+h-27,12,INK,'ComicBold')
def draw_count_page(c,n,title,kind,count,instruction,opts=None):
    header(c,n,title,instruction)
    cols=3 if count<=6 else 4
    top_count=min(cols,count); bottom_count=count-top_count
    icon_size=112 if count<=5 else (82 if count<=6 else 92)
    top_y=535
    top_gap=160 if count<=5 else 105
    top_start=W/2-(top_count-1)*top_gap/2
    for i in range(top_count): object_icon(c,kind,top_start+i*top_gap,top_y,icon_size,[CORAL,YELLOW,MINT,BLUE,LILAC][i%5])
    if bottom_count:
        gap=160 if count<=5 else 130; start=W/2-(bottom_count-1)*gap/2
        for i in range(bottom_count): object_icon(c,kind,start+i*gap,395,icon_size,[BLUE,CORAL,YELLOW,MINT][i%4])
    label={'apel':'Ada berapa apel?','bintang':'Ada berapa bintang?','ikan':'Ada berapa ikan?','balon':'Ada berapa balon?'}.get(kind,'Ada berapa?')
    txt(c,label,W/2,285,27,INK,'ComicBold','center')
    choice(c,opts or [max(1,count-1),count,count+1],W/2,190,r=54,gap=160)
def draw_trace(c,n,nums,instruction):
    header(c,n,'Tebalkan Angkanya',instruction); y=495
    for i,num in enumerate(nums):
        gap=112 if len(nums)>3 else 155; x=W/2+(i-(len(nums)-1)/2)*gap
        rr(c,x-47,y-54,94,120,18,white,HexColor('#F3D7C6'),1.4)
        txt(c,str(num),x,y-10,78,HexColor('#D5C9BB'),'ComicBold','center')
        c.setStrokeColor(LINE); c.setDash(2,3); c.line(x-33,y-35,x+33,y-35); c.setDash()
        txt(c,str(num),x,y-49,12,MUTED,'Comic','center')
    txt(c,'Sekarang coba tulis sendiri:',W/2,335,17,INK,'ComicBold','center')
    for i in range(4):
        x=43+i*132; rr(c,x,205,116,95,16,white,HexColor('#F3D7C6')); c.setStrokeColor(LINE); c.setDash(2,3); c.line(x+12,235,x+104,235); c.setDash()
def draw_sequence(c,n,sequence,instruction,title='Lengkapi Urutannya'):
    header(c,n,title,instruction); count=len(sequence); gap=min(57,(W-120)/(count-1)); start=W/2-gap*(count-1)/2
    for i,v in enumerate(sequence):
        x=start+i*gap; y=464
        rr(c,x-25,y-34,50,68,12,white,HexColor('#F3D7C6'),1.3)
        txt(c,str(v) if v is not None else '?',x,y-9,24,CORAL if v is None else INK,'ComicBold','center')
def draw_match(c,n,instruction,pairs):
    header(c,n,'Pasangkan Jumlahnya',instruction)
    rightx=W-164; top=520; gap=86
    for i,(num,qty,kind) in enumerate(pairs):
        y=top-i*gap; rr(c,65,y-29,104,58,17,white,HexColor('#F3D7C6'),1.4); txt(c,str(num),117,y-11,27,INK,'ComicBold','center')
        for j in range(qty): object_icon(c,kind,rightx+(j%5-2)*43,y+((j//5)*27),43,[CORAL,MINT,YELLOW,BLUE][j%4])
        c.setStrokeColor(HexColor('#F0DED1')); c.setDash(2,3); c.line(174,y,rightx-90,y); c.setDash()
def draw_dots(c,n,target,instruction):
    header(c,n,'Buat Titik Sebanyak Ini',instruction); star(c,W/2,520,52,YELLOW); txt(c,str(target),W/2,426,76,CORAL,'ComicBold','center')
    txt(c,'Gambar titik di dalam kotak:',W/2,335,18,INK,'ComicBold','center')
    rr(c,70,185,W-140,115,20,white,HexColor('#F3D7C6'),1.8)
def draw_color(c,n,instruction):
    header(c,n,'Warnai Sesuai Angka',instruction)
    colors=[(CORAL,'1 = merah'),(YELLOW,'2 = kuning'),(BLUE,'3 = biru')]
    for i,(col,label) in enumerate(colors):
        y=548-i*44; c.setFillColor(col); c.circle(69,y,12,fill=1,stroke=0); txt(c,label,91,y-5,15,INK,'ComicBold')
    for i,num in enumerate([1,2,3,1,2,3,2,1,3]):
        x=125+(i%3)*172; y=408-(i//3)*88; balloon(c,x,y,58,HexColor('#E9E2D7')); txt(c,str(num),x,y-7,22,INK,'ComicBold','center')
def draw_compare(c,n,instruction,a,b):
    header(c,n,'Mana yang Lebih Banyak?',instruction)
    for x,count,color,label in [(W*.32,a,CORAL,'Kelompok A'),(W*.68,b,BLUE,'Kelompok B')]:
        txt(c,label,x,538,16,INK,'ComicBold','center')
        for i in range(count): object_icon(c,'bintang',x+((i%4)-1.5)*52,478-(i//4)*72,48,color)
    txt(c,'Lingkari kelompok yang lebih banyak.',W/2,275,16,MUTED,'Comic','center')
def draw_pattern(c,n,seq,instruction):
    header(c,n,'Lanjutkan Polanya',instruction); start=67; y=460
    for i,item in enumerate(seq):
        x=start+i*66
        if item is None:
            rr(c,x-26,y-26,52,52,11,white,CORAL,1.7); txt(c,'?',x,y-8,22,CORAL,'ComicBold','center')
        else: shape(c,item,x,y,46,CORAL if item=='lingkaran' else MINT)
    txt(c,'Gambar bentuk berikutnya di kotak kosong.',W/2,350,15,MUTED,'Comic','center')
def draw_add(c,n,a,b,instruction):
    header(c,n,'Hitung Semuanya',instruction)
    y=500
    for i in range(a): apple(c,172-(a-1)*38+i*76,y,70,CORAL)
    txt(c,'+',W/2,y-12,37,INK,'ComicBold','center')
    for i in range(b): star(c,425-(b-1)*37+i*74,y,38,YELLOW)
    txt(c,'Ada berapa semuanya?',W/2,340,27,INK,'ComicBold','center'); choice(c,[a+b-1,a+b,a+b+1],W/2,235,r=50,gap=155)
def draw_number_grid(c,n,instruction,nums,ask):
    header(c,n,'Cari dan Lingkari',instruction)
    txt(c,ask,W/2,540,25,CORAL,'ComicBold','center')
    for i,val in enumerate(nums):
        row=i//5; col=i%5; x=90+col*102; y=465-row*75
        rr(c,x-36,y-31,72,62,14,white,HexColor('#F3D7C6'),1.3); txt(c,str(val),x,y-9,25,INK,'ComicBold','center')
def draw_before_after(c,n,target,instruction):
    header(c,n,'Angka Sebelum dan Sesudah',instruction)
    for j,(lab,val) in enumerate([('Sebelum',target-1),('Angkanya',target),('Sesudah',target+1)]):
        x=112+j*185; y=455; rr(c,x-58,y-60,116,122,22,white,CORAL if j==1 else HexColor('#F3D7C6'),2); txt(c,str(val) if j==1 else '?',x,y-14,42,CORAL if j==1 else INK,'ComicBold','center'); txt(c,lab,x,y-83,14,MUTED,'Comic','center')
def draw_path(c,n,instruction):
    header(c,n,'Jalur Angka 1 sampai 10',instruction)
    points=[]
    for i in range(10):
        row=i//5; col=i%5; x=(72+col*112) if row==0 else (523-col*112); y=500-row*170
        points.append((x,y))
    c.setStrokeColor(HexColor('#F3D7C6')); c.setLineWidth(7)
    for i in range(9): c.line(*points[i],*points[i+1])
    for i,(x,y) in enumerate(points):
        c.setFillColor([CORAL,YELLOW,MINT,BLUE,LILAC][i%5]); c.circle(x,y,29,fill=1,stroke=0); txt(c,str(i+1),x,y-7,18,white,'ComicBold','center')
    txt(c,'Ikuti angka dari 1 sampai 10 dengan pensil.',W/2,260,15,MUTED,'Comic','center')
def draw_final(c,n):
    header(c,n,'Aku Hebat Berhitung!', 'Selesaikan tantangan kecil ini bersama orang dewasa.')
    tasks=[('Hitung bintang',5,'bintang'),('Hitung apel',3,'apel'),('Hitung ikan',4,'ikan')]
    for k,(label,count,kind) in enumerate(tasks):
        y=510-k*128
        txt(c,label,52,y+38,15,INK,'ComicBold')
        for i in range(count): object_icon(c,kind,104+i*66,y-2,40,[CORAL,YELLOW,MINT,BLUE][i%4])
        c.setStrokeColor(HexColor('#EBCDB9')); c.setLineWidth(1.5); c.line(402,y-4,535,y-4); txt(c,'jawabanku',468,y-25,11,MUTED,'Comic','center')
    rr(c,48,110,W-96,88,19,HexColor('#FFF2D7'),HexColor('#F2DBA8'))
    txt(c,'Aku sudah berlatih angka 1 sampai 10!',W/2,166,16,INK,'ComicBold','center')
    txt(c,'Tanda tangan pendamping:',W/2,140,12,MUTED,'Comic','center'); c.setStrokeColor(HexColor('#D8C9A8')); c.line(W/2-85,124,W/2+85,124)

def main():
    os.makedirs(os.path.dirname(OUT),exist_ok=True); c=canvas.Canvas(OUT,pagesize=A4); c.setTitle('20 Aktivitas Seru Mengenal Angka 1-10')
    # Page 1: introduce numerals and make the book title part of the activity.
    header(c,1,'Ayo Kenal Angka 1–10','Sebutkan angka-angka ini, lalu pilih angka favoritmu.')
    txt(c,'Yuk sebutkan semuanya dari 1 sampai 10!',W/2,548,16,MUTED,'ComicBold','center')
    for i in range(10):
        x=92+(i%5)*103; y=475-(i//5)*82
        c.setFillColor([CORAL,YELLOW,MINT,BLUE,LILAC][i%5]); c.circle(x,y,34,fill=1,stroke=0)
        txt(c,str(i+1),x,y-8,21,white,'ComicBold','center')
    txt(c,'Angka yang paling kamu suka:',W/2,325,12,INK,'ComicBold','center')
    c.setStrokeColor(LINE); c.setLineWidth(1.5); c.line(170,294,W-170,294)
    c.showPage()
    # Activity pages 2-20.
    draw_count_page(c,2,'Ayo Hitung Buah!','apel',5,'Hitung gambarnya, lalu lingkari angka yang benar.'); c.showPage()
    draw_trace(c,3,[1,2,3],'Ikuti garis putus-putus untuk menebalkan angka.'); c.showPage()
    draw_count_page(c,4,'Bintang di Langit','bintang',7,'Hitung semua bintang. Lingkari jawaban yang tepat.',[6,7,8]); c.showPage()
    draw_sequence(c,5,[1,2,None,4,5,None,7,8,None,10],'Isi kotak kosong dengan angka yang hilang.'); c.showPage()
    draw_match(c,6,'Tarik garis dari angka ke kelompok gambar yang jumlahnya sama.',[(2,2,'apel'),(4,4,'bintang'),(3,3,'ikan'),(5,5,'lingkaran')]); c.showPage()
    draw_color(c,7,'Warnai balon sesuai petunjuk warna dan angka.'); c.showPage()
    draw_count_page(c,8,'Ikan di Kolam','ikan',6,'Hitung ikan, lalu pilih angka yang cocok.',[5,6,7]); c.showPage()
    draw_compare(c,9,'Lihat kedua kelompok. Lingkari kelompok yang jumlahnya lebih banyak.',5,7); c.showPage()
    draw_trace(c,10,[6,7,8,9,10],'Tebalkan angka 6 sampai 10, lalu coba tulis sendiri.'); c.showPage()
    draw_sequence(c,11,[2,3,None,5,None,7,8,None,10],'Lengkapi urutan angka yang belum lengkap.'); c.showPage()
    draw_dots(c,12,7,'Perhatikan angka, lalu gambar tujuh titik di dalam kotak.'); c.showPage()
    header(c,13,'Hitung Bentuknya','Hitung tiap bentuk, lalu tulis jumlahnya di kotak.'); section(c,38,210,W-76,385,'')
    for row,(kind,num) in enumerate([('lingkaran',4),('persegi',3),('segitiga',5)]):
        y=490-row*105; txt(c,['Lingkaran','Persegi','Segitiga'][row],55,y+10,13,INK,'ComicBold')
        for i in range(num): shape(c,kind,192+i*47,y+10,37,[CORAL,MINT,BLUE][row])
        rr(c,475,y-12,62,48,12,white,HexColor('#F3D7C6'),1.3)
    c.showPage()
    draw_number_grid(c,14,'Temukan angka yang disebutkan. Lingkari semua kemunculannya.',[2,8,4,7,8,1,5,3,8,6,10,2,9,4,7],'Cari angka 8'); c.showPage()
    draw_match(c,15,'Pasangkan angka dengan kumpulan gambar yang tepat.',[(1,1,'bintang'),(5,5,'apel'),(3,3,'ikan'),(2,2,'balon')]); c.showPage()
    draw_add(c,16,2,1,'Ada dua apel dan satu bintang. Hitung semuanya.'); c.showPage()
    draw_add(c,17,3,2,'Tiga apel ditambah dua bintang. Berapa jumlahnya?'); c.showPage()
    draw_before_after(c,18,6,'Isi angka yang datang sebelum dan sesudah angka 6.'); c.showPage()
    draw_path(c,19,'Mulai dari angka 1 dan ikuti jalurnya sampai 10.'); c.showPage()
    draw_final(c,20); c.showPage()
    c.save()
    print(OUT)
if __name__=='__main__': main()
