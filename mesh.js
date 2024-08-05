///Augment
if (!Array.prototype.remove)  Object.defineProperty(Array.prototype,"remove",{value(arg){ this.splice(this.indexOf(arg),1); }});
if (!Array.prototype.distinct)Object.defineProperty(Array.prototype,"distinct",{value(){return this.filter((value, index, self)=> self.indexOf(value) === index);}});
if (!Array.prototype.add)Object.defineProperty(Array.prototype,"add",{value(...args){args.forEach(arg=>{if (this.indexOf(arg)==-1)this.push(arg);});}});


/* Mesh sub-routines */
function get_lnk_index(i,j){ if (i<j){let tmp=j;j=i;i=tmp;}; return i*(i-1)/2+j; }
function get_lnk(ind){ let i=Math.floor(Math.sqrt(ind*8+1)/2+1/2); return [i, ind-i*(i-1)/2];}
function putAt(arr,i,arg){if (!arr[i])arr[i]=[arg]; else arr[i].push(arg); }
function triIntoLinks(t){
	putAt(lnk, get_lnk_index(t[0],t[1]), t); // sparse array = memory leak?
	putAt(lnk, get_lnk_index(t[1],t[2]), t);
	putAt(lnk, get_lnk_index(t[2],t[0]), t);
}
function removeFromLinks(t){
	lnk[get_lnk_index(t[0],t[1])].remove(t);
	lnk[get_lnk_index(t[1],t[2])].remove(t);
	lnk[get_lnk_index(t[2],t[0])].remove(t);
}

/* Mesh Globals */
var vertices;
var lnk;
var tri;

var flipPool=[];

/* Delaunay functions */
function initMesh(w,h) {
	vertices=[[0,0],[w*2,-1], [-1,h*2] ];
	lnk=[];
	tri=[[0,1,2]];
	triIntoLinks(tri[0]);
}
function insert(p) {
	var p_i=vertices.length;
	vertices.push(p);
	function inside(t,arg) {
		return polygon_collision.isPointInside(t.map(x=>vertices[x]), [arg.x,arg.y]); // could use a triangle specific algo for perf ?
	}
	var t=tri.find(x=>inside(x,p)); // TODO: this is O(n), use binary partition or walk() for O(ln(n))
	tri.remove(t); removeFromLinks(t);
	var newt;
	newt=[t[0],t[1],p_i]; tri.push(newt); triIntoLinks(newt);
	newt=[t[1],t[2],p_i]; tri.push(newt); triIntoLinks(newt);
	newt=[t[2],t[0],p_i]; tri.push(newt); triIntoLinks(newt);
	var myPool=[get_lnk_index(t[0],t[1]),get_lnk_index(t[1],t[2]),get_lnk_index(t[2],t[0])];
	while (myPool.length>0) doOneFlip(myPool);
	return p_i;
}


function get_tri_circum_center(a,b,c){ //TODO: avoid fail when segment is horizontal
	var a1=(a.x-b.x)/(b.y-a.y), a2=(a.x-c.x)/(c.y-a.y);
	var b1=(a.y+b.y-a1*(a.x+b.x))*0.5,b2=(a.y+c.y-a2*(a.x+c.x))*0.5;
	var x=(b1-b2)/(a2-a1);
	var y=b1+a1*x;
	return [x,y]; 
}

function initFlips(){
	if (flipPool.length>0) throw "wtf";
	for (let ind in lnk) flipPool.push(ind);
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
	var need=dist(center,quad[3])< dist(center, quad[0]); // TODO: get the matrices to work
	// if (! polygon_collision.isInCircle(...quad) ) continue;
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
function getPath(start,end) {
	var cur={p:vertices[start],g:0};
	function node(t) {
		this.t=t;
		this.p=get_tri_center(... t.map(x=>vertices[x]));
		this.g=cur.g+dist(cur.p,this.p);
		this.h=dist(vertices[end],this.p);
		this.f=this.g+this.h;
		this.parent=cur;
	}
	var job=tri
		.filter(t=>t[0]==start ||t[1]==start ||t[2]==start)
		.map(t=>new node(t));
	var done=[];
	while (job.length >0 ) {
		var lo=0;
		for (let i=0;i<job.length;++i) if (job[i].f<job[lo].f) lo=i;
		cur=job[lo];
		if (cur.t[0]==end ||cur.t[1]==end ||cur.t[2]==end) {
			var tmp=cur;
			var ret=[vertices[end],cur.p];
			while (tmp = tmp.parent) ret.push(tmp.p);
			return ret.reverse();
		}
		job.remove(cur);
		done.push(cur.t);
		var hood = [get_lnk_index(cur.t[0],cur.t[1]),get_lnk_index(cur.t[1],cur.t[2]),get_lnk_index(cur.t[2],cur.t[0])];
		hood=hood.map(x=>lnk[x]).flat().filter(x=>x!=cur.t);
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
	return "fail";
}
