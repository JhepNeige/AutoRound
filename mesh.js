///Augment
if (!Array.prototype.remove)  Object.defineProperty(Array.prototype,"remove",{value(arg){ this.splice(this.indexOf(arg),1); }});
if (!Array.prototype.distinct)Object.defineProperty(Array.prototype,"distinct",{value(){return this.filter((value, index, self)=> self.indexOf(value) === index);}});
if (!Array.prototype.add)Object.defineProperty(Array.prototype,"add",{value(...args){args.forEach(arg=>{if (this.indexOf(arg)==-1)this.push(arg);});}});


/* Mesh sub-routines */
function get_lnk_index(i,j){if(i==j)return null; if (i<j){let tmp=j;j=i;i=tmp;}; return i*(i-1)/2+j; }
function get_lnk(ind){ let i=Math.floor(Math.sqrt(ind*8+1)/2+1/2); return [i, ind-i*(i-1)/2];}
function putAt(arr,i,arg){if (!arr[i])arr[i]=[arg]; else arr[i].push(arg); }
function triIntoLinks(t){
	[
		 get_lnk_index(t[0],t[1])
		,get_lnk_index(t[1],t[2])
		,get_lnk_index(t[2],t[0])
	].forEach(x=>{
		putAt(lnk, x, t); // sparse array = memory leak?
		if (lnk[x].length>2) throw new Error("triIntoLinks bad mesh");
	});
}
	
function removeFromLinks(t){
	lnk[get_lnk_index(t[0],t[1])].remove(t);
	lnk[get_lnk_index(t[1],t[2])].remove(t);
	lnk[get_lnk_index(t[2],t[0])].remove(t); //need to return a checking function?
}

/* Mesh Globals */
var vertices;
var lnk;
var tri;

var flipPool=[];

/* Delaunay functions */
function initMesh(w,h,off=0) {
	vertices=[[0-off,0-off],[w+off,0-off], [w+off,h+off], [0-off,h+off] ];
	tri=[[0,1,2],[2,3,0]];
	lnk=[];
	triIntoLinks(tri[0]);
	triIntoLinks(tri[1]);
}
function get_house(p){
	function inside(t,arg) {
		return polygon_collision.isPointInside(t.map(x=>vertices[x]), [arg.x,arg.y]); // could use a triangle specific algo for perf ?
	}
	var t=tri.find(x=>inside(x,p)); // TODO: this is O(n), use binary partition or walk() for O(ln(n))
	return t;
}
function insert(p) {
	var t=get_house(p);
	if (!t) {console.warn("bad insertion",[p.x,p.y]); return 'fail';}
	var p_i=vertices.length;
	vertices.push(p);
	tri.remove(t); removeFromLinks(t);
	var newt;
	newt=[t[0],t[1],p_i]; tri.push(newt); triIntoLinks(newt);
	newt=[t[1],t[2],p_i]; tri.push(newt); triIntoLinks(newt);
	newt=[t[2],t[0],p_i]; tri.push(newt); triIntoLinks(newt);
	var myPool=[get_lnk_index(t[0],t[1]),get_lnk_index(t[1],t[2]),get_lnk_index(t[2],t[0])];
	while (myPool.length>0) doOneFlip(myPool);
// if (lnk.find(x=>x && (x.length>2 || (x.length==2 && x.flat().distinct().length<4) ) )){console.log("CLUSTER MEGA FUCK");}
	return p_i;
}
async function kick(ind){
// draw();
	var tz=tri.filter(t=>t.indexOf(ind)>-1);
	var lk=tz.map(x=>x.filter(i=>i!=ind)); /// smallest length is 3
	var piv=lk[0][0]; //can taking multiple pivots improve perf?
	lk=lk.filter(x=>x.indexOf(piv)==-1);
	var ntz=lk.map(x=>x.concat(piv));
	tz.forEach(t=>{ tri.remove(t); removeFromLinks(t); } );
	ntz.forEach(t=>{ tri.push(t); triIntoLinks(t); });
	delete vertices[ind];
	for (let p of lk.flat().distinct()) lk.push([piv,p]);
// lk.forEach(x=>{ drawSeg(vertices[x[0]],vertices[x[1]],"yellow"); });
// console.log(lk);
	lk=lk.map(x=>get_lnk_index(...x));
	while (lk.length>0) doOneFlip(lk);
}



/* old
function get_tri_circum_center(a,b,c){ //TODO: avoid fail when segment is horizontal
	var a1=(a.x-b.x)/(b.y-a.y), a2=(a.x-c.x)/(c.y-a.y);
	var b1=(a.y+b.y-a1*(a.x+b.x))*0.5,b2=(a.y+c.y-a2*(a.x+c.x))*0.5;
	var x=(b1-b2)/(a2-a1);
	var y=b1+a1*x;
	return [x,y]; 
}*/
function get_tri_circum_center(a,b,c){ ///https://en.wikipedia.org/wiki/Circumcircle
	var d=2*(a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y));
	var a2=a.x**2+a.y**2, b2=b.x**2+b.y**2, c2=c.x**2+c.y**2;
	return [
		 (a2*(b.y-c.y)+b2*(c.y-a.y)+c2*(a.y-b.y))/d
		,(a2*(c.x-b.x)+b2*(a.x-c.x)+c2*(b.x-a.x))/d
	];
}

function initFlips(){
	if (flipPool.length>0) throw "wtf";
	for (let ind in lnk) {if (lnk[ind].length>0) flipPool.push(ind); }
}
function doOneFlip(job=flipPool){
	if (job.length==0) return;
	var ind=job.pop();
	if (lnk[ind].length<2) return;
	var a=lnk[ind][0], b=lnk[ind][1];
	var [i,j]=get_lnk(ind);
	var quad_i=[... a,...b].distinct();
	var quad=quad_i.map(x=>vertices[x]);
	var center=get_tri_circum_center(...quad.slice(0,3));
	var need=dist(center,quad[3]) < dist(center, quad[0]); 
	/// if (! polygon_collision.isInCircle(...quad) ) continue;/// old: for matrix to work need good triangle points order
	if (!need ) return;
	tri.remove(a); removeFromLinks(a);
	tri.remove(b); removeFromLinks(b);
	var [k,l]=quad_i.filter(x=>x!=i && x!=j);
	var newt;
	newt=[k,l,i]; tri.push(newt); triIntoLinks(newt);
	newt=[k,l,j]; tri.push(newt); triIntoLinks(newt);
	job.add(get_lnk_index(i,k),get_lnk_index(k,j),get_lnk_index(j,l),get_lnk_index(l,i));
}


/* A* algorithm */
function get_tri_center(a,b,c){
	return [(a.x+b.x+c.x)/3,(a.y+b.y+c.y)/3];
}
function get_middle(...args){
	var ret=args.reduce((a,b)=>[a.x+b.x,a.y+b.y]);
	return [ret.x/args.length,ret.y/args.length];
}
function getPath(start,end,filter,ret_key='p') { //TODO: improve cause when you go on a link from a triangle you got only 1 way to go
	var links=lnk.slice();
	// var hideout=get_house(start);
	var hideout=vertices.indexOf(start);
	var target=get_house(end);
	if (hideout==-1 || !target) {console.warn("getPath input error"); return 'fail';}
	if (filter){
		for (let i in links){
			if (links[i].length==0)continue;
			var [a,b]=get_lnk(i);
			a=vertices[a];b=vertices[b];
			var sz=dist(a,b);
			if (!filter(i,a,b,sz))links[i]=null;
// if (links[i] && links[i].length>0) drawSeg(a,b,"magenta");
		}
	}
	function node(arg) {
		this.t=arg;
		this.p=get_middle(... this.t.map(x=>vertices[x]));
		this.g=cur.g+dist(cur.p,this.p);
		this.h=dist(end,this.p);
		this.f=this.g+this.h;
		this.parent=cur;
	}
	var cur={p:start,g:0};
	// var job=[new node(hideout)];
	var job=[];
	for (let i=0;i<vertices.length;++i){
		if (!vertices[i])continue;
		let tmp=links[get_lnk_index(hideout,i)];
		if(tmp && tmp.length>0)job.push(new node([hideout,i]));
	}
	/*var job=tri
		.filter(t=>t[0]==start ||t[1]==start ||t[2]==start)
		.map(t=>new node(t));*/
	var done=[];
	while (job.length >0 ) {
		var lo=0;
		for (let i=0;i<job.length;++i) if (job[i].f<job[lo].f) lo=i;
		cur=job[lo];
//		if (cur.t.indexOf(end)>-1) {
		if (cur.t == target) {
			var tmp=cur;
			var ret=[end,cur[ret_key]];
			while (tmp = tmp.parent) ret.push(tmp[ret_key]);
			ret =ret.reverse();
			return ret;
		}
		job.remove(cur);
		done.push(cur.t);
		var hood;
		if (cur.t.length==3){
/*			hood= [get_lnk_index(cur.t[0],cur.t[1]),get_lnk_index(cur.t[1],cur.t[2]),get_lnk_index(cur.t[2],cur.t[0])];
			hood=hood.map(x=>links[x]).filter(x=>x!=null).flat().filter(x=>x!=cur.t);*/
			hood= [[cur.t[0],cur.t[1]],[cur.t[1],cur.t[2]],[cur.t[2],cur.t[0]]];
			hood=hood.filter(x=>{ let y=links[get_lnk_index(...x)]; return y && y.length>0;})
		}else{
			hood=  links[get_lnk_index(...cur.t)];
		}
		if (!hood || hood.length== 0) continue;//there could be better failure
		for (let neigh of hood){
			if (done.indexOf(neigh)>-1 ) continue;
			var no=job.find(x=>x.t==neigh);
			if (no!=null && no.g<cur.g+dist(cur.p,no.p)) continue;
			if (no==null) {
				job.push(new node(neigh));
			}else {
				no.g=cur.g+dist(cur.p,no.p);
				no.f=no.g+no.h;
				no.parent=cur;
			}
		}
	}
	return 'fail';
}


function improvePath(arg){
	var ret=[arg[0]];
	for (let i=1;i<arg.length;i+=2)ret.push(arg[i]);
	if (arg.length % 2==1)ret.push(arg[arg.length-1]);
	return ret;
}
function straightenPath(arg){
	var ret=[arg[0]];
	var indic=0;
	for (let i =1;i<arg.length-1;++i){
		var d=[arg[i-1],dif(arg[i+1],arg[i-1])];
		var p;
		if (Math.abs(cross_prod(d[1],arg[i].vec))<1e-9)p=0;
		else p=intersections([arg[i].origin,arg[i].vec],d)[0];
		p=Math.min(arg[i].rg,Math.abs(p))*Math.sign(p);
		indic+=Math.abs(p-arg[i].corr);
		arg[i].corr=p;
		p=[]; for (let prop in arg[i])p[prop]=arg[i][prop];
		let tmp=point_of_line([arg[i].origin,arg[i].vec],arg[i].corr);
		p.x=tmp.x;p.y=tmp.y;
		ret.push(p);
	}
	ret.push(arg[arg.length-1]);
	ret.indic=indic; //should divide by arg.length?
	return ret;
}