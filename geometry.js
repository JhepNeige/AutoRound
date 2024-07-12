if (!Array.prototype.x) Object.defineProperty(Array.prototype,"x",{get(){return this[0]},set(arg){this[0]=arg;}});
if (!Array.prototype.y) Object.defineProperty(Array.prototype,"y",{get(){return this[1]},set(arg){this[1]=arg;}});

var sqrt=Math.sqrt;

/*** geometry functions ***/

function dif(a,b) {
	return [a.x-b.x, a.y-b.y ];
}
function add(a,b) {
	return [a.x+b.x, a.y+b.y ];
}
function mult(v,lambda) {
	return [v.x*lambda, v.y*lambda];
}
// function norm(...args) { return Math.sqrt(args.reduce((a,b)=>a+=b*b,0)); }
function norm(v) { return Math.sqrt(v.x**2+v.y**2); }
function normed(v) {
	// let q=1/norm(v.x,v.y);
	let q=1/norm(v);
	return [v.x*q, v.y*q];
}
function turn(v,an) {
	return [v.x*cos(an)-sin(an)*v.y,v.y*cos(an)+sin(an)*v.x];
}
function limits(x,a,b) {
	return Math.min(Math.max(x,b),a);
}
function dist(a,b){
	return norm(dif(a,b));
	// return norm(a.x-b.x,a.y-b.y);
}
function dot_prod(a,b) {
	return a.x*b.x+a.y*b.y;
}
function cross_prod(a,b) {
	return a.x*b.y-a.y*b.x;
}
function point_of_line(d,t) { /// lines are d=[point, vec]
	return {x: d[0].x +t*d[1].x, y:d[0].y +t*d[1].y };
}
function proj_dist(p, d) {
	return cross_prod(dif(p, d[0]),d[1]);
}
function get_angle(a,b) {
	var aa=normed(a), bb=normed(b);
	return Math.acos(dot_prod(aa,bb))*Math.sign(cross_prod(aa,bb));
}
function projected(p,d){
	return point_of_line(d, dot_prod(dif(p,d[0]),d[1]) );
}



var circle_in_box={};
var log=x=>0; //console.log;

circle_in_box.getIntersections=function([x1,y1,x2,y2], circle) {
	var r=circle.r;
	var pt=[[x2,y2],[x2,y1],[x1,y1],[x1,y2]].map(p=>[p.x-circle.x,p.y-circle.y]);
	var pt2=pt.slice();
	function turn(arg){ return [-arg.y,arg.x];}
	function nrut(arg){ return [arg.y,-arg.x];}
	function flip(arg){ return [arg.y,arg.x];}
	log("ek", pt);
	function get_isec(x,y){
	log(x,y);
		if (x>r) return "err1";
		let tmp=Math.sqrt(r**2-x**2);
		if (tmp>y) return "err2";
		return [x,tmp];
	}
	var z, isec=[];
	z=get_isec(... pt[0]); if (typeof z!='string')isec.push(z);
	pt=pt.map(turn);
	z=get_isec(... pt[1]); if (typeof z!='string')isec.push(nrut(z));
	pt=pt.map(turn);
	z=get_isec(... pt[2]); if (typeof z!='string')isec.push(nrut(nrut(z)));
	pt=pt.map(turn);
	z=get_isec(... pt[3]); if (typeof z!='string')isec.push(nrut(nrut(nrut(z))));
	pt=[ pt2[0], pt2[3], pt2[2], pt2[1]].map(flip);
	z=get_isec(... pt[0]); if (typeof z!='string')isec.push(flip(z));
	pt=pt.map(turn);
	z=get_isec(... pt[1]); if (typeof z!='string')isec.push(flip(nrut(z)));
	pt=pt.map(turn);
	z=get_isec(... pt[2]); if (typeof z!='string')isec.push(flip(nrut(nrut(z))));
	pt=pt.map(turn);
	z=get_isec(... pt[3]); if (typeof z!='string')isec.push(flip(nrut(nrut(nrut(z)))));
	var ret= isec.map(p=>[p.x+circle.x, p.y+circle.y]);	
	log(ret);
	return ret;
}

var circle_collision={};


circle_collision.isPointInside=function (circle,p) {
	return (circle.x-p.x)**2+(circle.y-p.y)**2 < circle.r**2;
}
circle_collision.reject=function (circle,p) {
	return add(circle, mult( normed(dif(p,circle)), circle.r )) ;
}


















