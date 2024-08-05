
var polygon_collision={};

//TODO : namespace
///Note : modified with .x .y augment usage
function inside(point, vs) {
    /// ray-casting algorithm based on
    /// https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
    
    var x = point.x, y = point.y;
    
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i].x, yi = vs[i].y;
        var xj = vs[j].x, yj = vs[j].y;
        
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
/** Note: This code doesn't work reliably when the point is a corner of the polygon or on an edge. There is an improved version here: https://github.com/mikolalysenko/robust-point-in-polygon **/
}

polygon_collision.isPointInside=function(poly,p){return inside(p,poly);}


/*function prod_mat(a,b){
	var n=a[0].length;
	var ret=Array(n).fill(0).map(x=>Array(n).fill(0));
	for (let i=0;i<n;i++)
	 for (let j=0;j<n;j++)
      for (let k=0;k<n;k++)ret[i][j]+=a[i][k]*b[k][j];
	return ret;
}*/

/// matrix inversion / determinant computing
function gauss(arg){
	var m=arg.map(x=>x.slice());
	var n=m[0].length;
	var ret=Array(n).fill(0).map((x,i)=>Array(n).fill(0).map((y,j)=>i==j?1:0));
	var tmp;
	var det=1.0;
	for (var j=0; j<n; j++) {
		var pivot=j,big=0.0;
		for (var i=j;i<n;i++) {tmp=Math.abs(m[i][j]); if (tmp>big) {big=tmp;pivot=i;} }
		if (big==0.0) return {det:0};
		if (pivot!=j){
			tmp=m[j];m[j]=m[pivot];m[pivot]=tmp;
			tmp=ret[j];ret[j]=ret[pivot];ret[pivot]=tmp;
			det=-det;
		}
		det*=m[j][j];
		tmp=1/m[j][j];
		for (var k=0;k<n;k++) {
			m  [j][k]*=tmp;
			ret[j][k]*=tmp;
		}
		for (var i=0; i<n; i++) {
			if (i==j) continue;
			tmp=m[i][j];
			for (var k=0; k<n; k++) {
				m  [i][k] -= m  [j][k] * tmp;
				ret[i][k] -= ret[j][k] * tmp;
			}
		}
	} /// each column j
	ret.det=det;
	return ret;
}
/*function crout(A,L,U) {
	var i, j, k, n=A.length;
	var sum = 0;
	L=[];U=[];
	for (i = 0; i < n; i++) {
		L[i]=[];U[i]=[];
		U[i][i] = 1;
	}
	for (j = 0; j < n; j++) {
		for (i = j; i < n; i++) {
			sum = 0;
			for (k = 0; k < j; k++) {
				sum = sum + L[i][k] * U[k][j];	
			}
			L[i][j] = A[i][j] - sum;
		}
		for (i = j; i < n; i++) {
			sum = 0;
			for(k = 0; k < j; k++) {
				sum = sum + L[j][k] * U[k][i];
			}
			if (L[j][j] == 0) {console.log("crout fail"); return 0;}
			U[j][i] = (A[j][i] - sum) / L[j][j];
		}
	}
	var prod=1.0;
	for (i = 0; i < n; i++) prod*=L[i][i]*U[i][i];
	return prod;
}*/

/// check if d is the circumcircle of triangle [a,b,c]
polygon_collision.isInCircle=function (a,b,c,d) {
	var m=[[1,a.x,a.y,a.x*a.x+a.y*a.y],
	       [1,b.x,b.y,b.x*b.x+b.y*b.y],
	       [1,c.x,c.y,c.x*c.x+c.y*c.y],
		   [1,d.x,d.y,d.x*d.x+d.y*d.y]];
	// var d=crout(m);
/*console.log(m.map(x=>x.join('\t')).join('\n') );*/ /*console.log(d,gauss(m).det);*/
	var d=gauss(m).det;
	return d<0;
}


